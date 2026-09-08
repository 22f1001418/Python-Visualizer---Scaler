"""PyLens trace recorder.

Records what CPython actually did, one step per line executed, so the UI can
scrub through a finished run instead of re-executing anything.

The shape of a step is deliberately generous: every lens in phase 3 renders from
this same structure, so it carries the call stack, the reachable heap, and the
identity of every object. Identity is the whole game — two names pointing at one
list is the misconception this tool exists to fix, and it is only visible if the
snapshot keeps object ids rather than copying values.
"""

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

    return entry


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


class Recorder:
    """Collects one step per traced event, then hands over a plain list."""

    def __init__(self, filenames, max_steps, max_seconds, stdout_recorder):
        self.filenames = set(filenames)
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

        if not self._record(frame, event, arg):
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
