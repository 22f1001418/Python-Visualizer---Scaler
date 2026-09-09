"""PyLens trace recorder.

Records what CPython actually did, one step per line executed, so the UI can
scrub through a finished run instead of re-executing anything.

The shape of a step is deliberately generous: every lens in phase 3 renders from
this same structure, so it carries the call stack, the reachable heap, and the
identity of every object. Identity is the whole game — two names pointing at one
list is the misconception this tool exists to fix, and it is only visible if the
snapshot keeps object ids rather than copying values.
"""

import ast
import inspect
import sys
import time

# Guards. A teaching program is small; anything that blows past these is a
# runaway, and a browser tab is a bad place to find that out the hard way.
MAX_ITEMS = 100  # entries serialised per container
MAX_STRING = 200  # characters kept from a long string
MAX_DEPTH = 12  # nesting depth before we stop descending

_PRIMITIVE_TYPES = (bool, int, float, complex)

# Names that live in every module's globals and teach nobody anything.
_HIDDEN_GLOBALS = {
    "__name__",
    "__doc__",
    "__package__",
    "__loader__",
    "__spec__",
    "__builtins__",
    "__file__",
    "__cached__",
    "__annotations__",
}


def _truncate(text, limit=MAX_STRING):
    return text if len(text) <= limit else text[:limit] + "…"


def _safe_repr(obj):
    """repr() that cannot itself break the trace."""
    try:
        return _truncate(repr(obj))
    except BaseException:
        return f"<{type(obj).__name__} with an unprintable repr>"


def _value(obj, heap, depth=0):
    """Serialise one value.

    Immutable scalars are inlined; everything else becomes a reference into the
    heap, which is what lets the UI draw two names pointing at the same object.
    """
    if obj is None:
        return {"k": "prim", "t": "NoneType", "r": "None"}

    if isinstance(obj, _PRIMITIVE_TYPES):
        return {"k": "prim", "t": type(obj).__name__, "r": _safe_repr(obj)}

    if isinstance(obj, str):
        return {"k": "prim", "t": "str", "r": _safe_repr(obj)}

    if isinstance(obj, (bytes, bytearray)):
        return {"k": "prim", "t": type(obj).__name__, "r": _safe_repr(obj)}

    if depth >= MAX_DEPTH:
        return {"k": "prim", "t": type(obj).__name__, "r": "…"}

    return {"k": "ref", "id": _register(obj, heap, depth)}


def _register(obj, heap, depth):
    """Put an object in the heap and return its id.

    The entry is inserted *before* its contents are walked, so a list that
    contains itself terminates instead of recursing forever.
    """
    key = str(id(obj))
    if key in heap:
        return key

    entry = {"id": key, "type": type(obj).__name__}
    heap[key] = entry
    child = depth + 1

    if isinstance(obj, (list, tuple)):
        entry["kind"] = "sequence"
        entry["ordered"] = True
        items = list(obj)[:MAX_ITEMS]
        entry["items"] = [_value(item, heap, child) for item in items]
        entry["truncated"] = len(obj) > MAX_ITEMS
        entry["length"] = len(obj)

    elif isinstance(obj, (set, frozenset)):
        entry["kind"] = "sequence"
        entry["ordered"] = False
        items = list(obj)[:MAX_ITEMS]
        entry["items"] = [_value(item, heap, child) for item in items]
        entry["truncated"] = len(obj) > MAX_ITEMS
        entry["length"] = len(obj)

    elif isinstance(obj, dict):
        entry["kind"] = "mapping"
        pairs = list(obj.items())[:MAX_ITEMS]
        entry["entries"] = [
            [_value(key_obj, heap, child), _value(val, heap, child)] for key_obj, val in pairs
        ]
        entry["truncated"] = len(obj) > MAX_ITEMS
        entry["length"] = len(obj)

    elif inspect.isgenerator(obj):
        # A generator is a paused function. Keeping its frame's variables in the
        # snapshot is what makes laziness visible: the locals are still there
        # between one next() and the next.
        entry["kind"] = "generator"
        entry["name"] = obj.gi_code.co_name
        entry["state"] = inspect.getgeneratorstate(obj).replace("GEN_", "").lower()
        paused = obj.gi_frame
        entry["line"] = _line_of(paused) if paused else None
        entry["locals"] = (
            [[name, _value(val, heap, child)] for name, val in paused.f_locals.items()]
            if paused
            else []
        )

    elif isinstance(obj, type):
        entry["kind"] = "class"
        entry["name"] = obj.__name__
        entry["bases"] = [base.__name__ for base in obj.__bases__ if base is not object]
        entry["attrs"] = [
            [name, _value(val, heap, child)]
            for name, val in vars(obj).items()
            if not name.startswith("__")
        ]

    elif callable(obj) and hasattr(obj, "__name__"):
        entry["kind"] = "function"
        entry["name"] = getattr(obj, "__qualname__", obj.__name__)

    elif hasattr(obj, "__dict__") and not isinstance(obj, type(sys)):
        entry["kind"] = "instance"
        entry["attrs"] = [
            [name, _value(val, heap, child)]
            for name, val in list(vars(obj).items())[:MAX_ITEMS]
            if not name.startswith("__")
        ]

    else:
        entry["kind"] = "opaque"
        entry["repr"] = _safe_repr(obj)

    # The id, not the entry: callers hold references, never copies.
    return key


def _line_of(frame):
    """A 1-based line number, always.

    The 'call' event for a module frame reports line 0, which is not a place in
    anyone's file. Clamping here means no consumer downstream has to know that.
    """
    return max(1, frame.f_lineno or 1)


def _locals_of(frame, is_module, heap):
    """The variables worth showing for one frame."""
    scope = frame.f_locals
    pairs = []

    for name, value in scope.items():
        if is_module and (name in _HIDDEN_GLOBALS or name.startswith("__")):
            continue
        if isinstance(value, type(sys)):  # imported modules are noise
            continue
        pairs.append([name, _value(value, heap, 0)])

    return pairs


# ---------------------------------------------------------------------------
# Source index
# ---------------------------------------------------------------------------


def _classify(node):
    """What kind of statement this is, in words a beginner would recognise."""
    if isinstance(node, ast.Assign):
        return "assign", [t.id for t in node.targets if isinstance(t, ast.Name)]
    if isinstance(node, ast.AugAssign):
        return "augassign", [node.target.id] if isinstance(node.target, ast.Name) else []
    if isinstance(node, ast.For):
        return "for", [node.target.id] if isinstance(node.target, ast.Name) else []
    if isinstance(node, ast.While):
        return "while", []
    if isinstance(node, (ast.If, ast.IfExp)):
        return "if", []
    if isinstance(node, ast.Return):
        return "return", []
    if isinstance(node, ast.FunctionDef):
        return "def", [node.name]
    if isinstance(node, ast.ClassDef):
        return "class", [node.name]
    if isinstance(node, (ast.Import, ast.ImportFrom)):
        return "import", []
    if isinstance(node, ast.Expr):
        return ("call", []) if isinstance(node.value, ast.Call) else ("expr", [])
    return "other", []


class SourceIndex:
    """Everything the narration needs to know about the code being run.

    Parsed once per run. For each line it remembers the statement kind, the names
    it assigns, and exactly where every readable name sits, so a line can be
    rewritten with values in place of names — the "piece of paper where Python
    replaces subexpressions with their values" that beginners actually follow.
    """

    def __init__(self, files):
        self.lines = {}
        self.names = {}
        self.kinds = {}

        for name, source in files.items():
            self.lines[name] = source.splitlines()
            try:
                tree = ast.parse(source, name)
            except SyntaxError:
                continue

            for node in ast.walk(tree):
                if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load):
                    self.names.setdefault((name, node.lineno), []).append(
                        (node.col_offset, node.end_col_offset, node.id)
                    )
                elif isinstance(node, ast.stmt):
                    self.kinds[(name, node.lineno)] = _classify(node)

    def statement(self, file, line):
        """The raw text of a line, stripped of its indentation."""
        lines = self.lines.get(file)
        if not lines or line < 1 or line > len(lines):
            return ""
        return lines[line - 1].strip()

    def kind(self, file, line):
        return self.kinds.get((file, line), ("other", []))

    def substituted(self, file, line, frame):
        """The line with each name replaced by the value it currently holds.

        Names not bound yet are left alone — showing a placeholder for something
        Python has not worked out yet would be a lie, and beginners believe what
        the screen tells them.
        """
        lines = self.lines.get(file)
        spans = self.names.get((file, line))
        if not lines or not spans or line < 1 or line > len(lines):
            return ""

        raw = lines[line - 1]
        scope = frame.f_locals
        globals_ = frame.f_globals
        out = raw
        replaced = False

        # Right to left, so earlier offsets stay valid as the text changes length.
        for start, end, name in sorted(spans, key=lambda span: span[0], reverse=True):
            if end > len(raw):
                continue
            if name in scope:
                value = scope[name]
            elif name in globals_:
                value = globals_[name]
            else:
                continue

            # Functions and classes read better by name than by repr.
            if callable(value) or isinstance(value, type):
                continue

            out = out[:start] + _truncate(_safe_repr(value), 40) + out[end:]
            replaced = True

        stripped = out.strip()
        return stripped if replaced and stripped != raw.strip() else ""


class Recorder:
    """Collects one step per traced event, then hands over a plain list."""

    def __init__(self, filenames, max_steps, max_seconds, stdout_recorder, source=None):
        self.filenames = set(filenames)
        self.source = source
        self.max_steps = max_steps
        self.deadline = time.monotonic() + max_seconds
        self.stdout = stdout_recorder

        self.steps = []
        self.capped = False
        self.cap_reason = None

        self._stack = []
        self._frame_ids = {}
        self._next_frame_id = 0

    # -- the hook -----------------------------------------------------------

    def trace(self, frame, event, arg):
        code = frame.f_code
        if code.co_filename not in self.filenames:
            return None  # library and driver frames are not the student's problem

        if event == "call":
            self._next_frame_id += 1
            self._frame_ids[id(frame)] = self._next_frame_id
            self._stack.append(frame)

        # Entering and leaving the file itself are not events a student can see
        # in their code, so they are tracked but never shown.
        module_edge = code.co_name == "<module>" and event in ("call", "return")

        if not module_edge and not self._record(frame, event, arg):
            return None

        if event == "return":
            self._frame_ids.pop(id(frame), None)
            if self._stack and self._stack[-1] is frame:
                self._stack.pop()

        return self.trace

    # -- recording ----------------------------------------------------------

    def _record(self, frame, event, arg):
        """Append a step. Returns False once tracing has to give up."""
        if self.capped:
            return False

        if len(self.steps) >= self.max_steps:
            self._stop("steps")
            return False

        if time.monotonic() > self.deadline:
            self._stop("time")
            return False

        heap = {}
        frames = []

        for index, active in enumerate(self._stack):
            is_module = active.f_code.co_name == "<module>"
            frames.append(
                {
                    "id": self._frame_ids.get(id(active), index),
                    "name": "<module>" if is_module else active.f_code.co_name,
                    "file": active.f_code.co_filename,
                    "line": _line_of(active),
                    "module": is_module,
                    "locals": _locals_of(active, is_module, heap),
                }
            )

        step = {
            "i": len(self.steps),
            "e": event,
            "file": frame.f_code.co_filename,
            "line": _line_of(frame),
            "frames": frames,
            "heap": heap,
            "out": self.stdout.length,
        }

        if event == "line" and self.source:
            step["src"] = self.source.statement(step["file"], step["line"])
            substituted = self.source.substituted(step["file"], step["line"], frame)
            if substituted:
                step["sub"] = substituted
            kind, targets = self.source.kind(step["file"], step["line"])
            step["k"] = kind
            if targets:
                step["tg"] = targets

        if event == "return":
            step["ret"] = _value(arg, heap, 0)
        elif event == "exception" and arg:
            step["exc"] = {"type": arg[0].__name__, "message": str(arg[1])}

        self.steps.append(step)
        return True

    def _stop(self, reason):
        """Stop tracing but let the program run on to completion.

        Cutting the trace short is far better than cutting the program short: the
        student still gets their full output, and the timeline simply covers the
        part that fits.
        """
        self.capped = True
        self.cap_reason = reason
        sys.settrace(None)
