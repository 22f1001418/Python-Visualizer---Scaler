"""PyLens execution driver.

Runs inside Pyodide. Its job is to execute the student's files the way a real
`python main.py` would, and to hand back a *structured* result instead of a wall
of traceback text — the frontend needs the failing line number to highlight it
in the editor.

Every frame belonging to this driver is filtered out of the traceback, so a
student never sees PyLens' own plumbing in their error message.
"""

import builtins
import io
import json
import os
import sys
import traceback

WORKDIR = "/home/pylens"


def _sync_workdir(files):
    """Mirror the editor's files into the virtual filesystem.

    Stale files are removed first so that deleting a tab in the UI also makes
    `import helper` start failing again — otherwise the FS quietly keeps a copy
    and the student debugs a ghost.
    """
    os.makedirs(WORKDIR, exist_ok=True)
    for name in os.listdir(WORKDIR):
        path = os.path.join(WORKDIR, name)
        if os.path.isfile(path):
            os.remove(path)

    for name, source in files.items():
        with open(os.path.join(WORKDIR, name), "w", encoding="utf-8") as handle:
            handle.write(source)

    os.chdir(WORKDIR)
    if WORKDIR not in sys.path:
        sys.path.insert(0, WORKDIR)

    # Modules imported during an earlier run must not be cached, or editing a
    # helper file has no effect until the page is reloaded.
    for name in [n for n, m in sys.modules.items() if _is_user_module(m)]:
        del sys.modules[name]


def _is_user_module(module):
    origin = getattr(module, "__file__", None)
    return isinstance(origin, str) and origin.startswith(WORKDIR)


def _user_frames(exc, filenames):
    """Traceback frames from the student's own files, driver frames dropped."""
    frames = traceback.extract_tb(exc.__traceback__)
    return [frame for frame in frames if os.path.basename(frame.filename) in filenames]


def _describe(exc, filenames):
    """Turn an exception into the JSON shape the frontend renders."""
    line = None
    file = None

    if isinstance(exc, SyntaxError) and exc.filename:
        # A SyntaxError never executes, so it has no user frame — the position
        # lives on the exception itself.
        line = exc.lineno
        file = os.path.basename(exc.filename)
    else:
        frames = _user_frames(exc, filenames)
        if frames:
            line = frames[-1].lineno
            file = os.path.basename(frames[-1].filename)

    formatted = traceback.format_exception_only(type(exc), exc)
    frames = _user_frames(exc, filenames)
    text = "".join(traceback.format_list(frames) + formatted).rstrip()

    return {
        "type": type(exc).__name__,
        "message": str(exc),
        "line": line,
        "file": file,
        "traceback": text,
    }


class _StdoutRecorder:
    """Wraps Pyodide's stdout so the run can be replayed, not just watched.

    Text still goes straight through to the UI as it is written — that is what
    makes a long loop feel alive — but a copy is kept here. Each traced step
    records how many characters had been written by that point, which is how the
    output pane can rewind in step with the scrubber.
    """

    def __init__(self, wrapped):
        self._wrapped = wrapped
        self._chunks = []
        self.length = 0

    def write(self, text):
        self._chunks.append(text)
        self.length += len(text)
        return self._wrapped.write(text)

    def flush(self):
        self._wrapped.flush()

    def __getattr__(self, name):
        return getattr(self._wrapped, name)

    @property
    def text(self):
        return "".join(self._chunks)


def _make_input(stream):
    """An input() that echoes, the way a terminal session reads.

    Pyodide's stdin gives us the answers but no echo, so a transcript would show
    "Your name? Age? Diya will be 18" with the replies missing. Printing the
    consumed line after the prompt makes the output readable on a projector, and
    matches what a student sees in their own terminal at home.
    """

    def _input(prompt=""):
        text = str(prompt)
        line = stream.readline()
        if line == "":
            raise EOFError("EOF when reading a line")
        line = line.rstrip("\n")
        sys.stdout.write(text + line + "\n")
        return line

    return _input


def run(files, entry, stdin_text="", max_steps=2000, max_seconds=20):
    """Execute `entry` with `files` on disk, recording a trace.

    Returns a JSON string: the outcome, the full stdout, and the timeline.
    """
    files = dict(files)
    if entry not in files:
        return json.dumps(
            {
                "ok": False,
                "error": {
                    "type": "PyLensError",
                    "message": "The file you asked to run is not open.",
                    "line": None,
                    "file": None,
                    "traceback": "",
                },
            }
        )

    _sync_workdir(files)

    original_stdin = sys.stdin
    original_stdout = sys.stdout
    original_input = builtins.input
    stdin_stream = io.StringIO(stdin_text)
    recorder = _StdoutRecorder(original_stdout)
    sys.stdin = stdin_stream
    sys.stdout = recorder
    builtins.input = _make_input(stdin_stream)

    namespace = {
        "__name__": "__main__",
        "__file__": os.path.join(WORKDIR, entry),
    }

    try:
        code = compile(files[entry], entry, "exec")
    except SyntaxError as exc:
        sys.stdin = original_stdin
        sys.stdout = original_stdout
        builtins.input = original_input
        # A file that does not compile never runs, so there is no timeline.
        return json.dumps(
            {"ok": False, "error": _describe(exc, set(files)), "stdout": "", "trace": None}
        )

    tracer = Recorder(set(files), max_steps, max_seconds, recorder, SourceIndex(files))
    error = None

    try:
        sys.settrace(tracer.trace)
        exec(code, namespace)
    except SystemExit as exc:
        # sys.exit() is a normal way for a program to finish, not a crash.
        namespace["__pylens_exit__"] = exc.code
    except BaseException as exc:  # noqa: BLE001 - the point is to report anything
        error = _describe(exc, set(files))
    finally:
        sys.settrace(None)
        sys.stdin = original_stdin
        builtins.input = original_input
        recorder.flush()
        sys.stderr.flush()
        sys.stdout = original_stdout

    return json.dumps(
        {
            "ok": error is None,
            "error": error,
            "stdout": recorder.text,
            "trace": {
                "steps": tracer.steps,
                "capped": tracer.capped,
                "capReason": tracer.cap_reason,
                "entry": entry,
            },
        }
    )


def run_json(payload_json):
    """JSON-in, JSON-out wrapper.

    Crossing the JS/Python boundary with plain strings avoids proxy lifetimes
    entirely — nothing to destroy, nothing to leak between runs.
    """
    payload = json.loads(payload_json)
    return run(
        payload["files"],
        payload["entry"],
        payload.get("stdin", ""),
        payload.get("maxSteps", 2000),
        payload.get("maxSeconds", 20),
    )
