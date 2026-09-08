"""Run the tracer outside the browser.

The recorder is plain CPython, so it can be exercised straight from a terminal —
far faster than round-tripping through Pyodide when a snapshot looks wrong.

    python3 scripts/trace-smoke.py            # built-in sample
    python3 scripts/trace-smoke.py some.py    # your own file
"""

import json
import pathlib
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
SAMPLE = """names = ["a", "b"]
roster = names
roster.append("c")
print(len(names))
"""


def main():
    namespace = {}
    exec((ROOT / "src/python/tracer.py").read_text(), namespace)
    exec((ROOT / "src/python/runner.py").read_text(), namespace)
    namespace["WORKDIR"] = tempfile.mkdtemp(prefix="pylens-")

    source = pathlib.Path(sys.argv[1]).read_text() if len(sys.argv) > 1 else SAMPLE
    result = json.loads(
        namespace["run_json"](json.dumps({"files": {"main.py": source}, "entry": "main.py"}))
    )

    trace = result["trace"]
    print(f"ok={result['ok']} steps={len(trace['steps'])} capped={trace['capped']}")
    if result["error"]:
        print("error:", result["error"]["type"], result["error"]["message"])

    last = trace["steps"][-1]
    print("\nfinal step:")
    print(json.dumps({"line": last["line"], "frames": last["frames"], "heap": last["heap"]}, indent=2))


if __name__ == "__main__":
    main()
