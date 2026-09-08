# PyLens

A teaching-first Python IDE that shows students what their code is actually doing.

Write Python, run it entirely in the browser, then scrub back and forth through
the execution while a **concept lens** draws the part you're teaching — the call
stack, the heap with its reference arrows, a loop's trace table, a recursion
tree.

## Why it works the way it does

- **Python runs client-side** via [Pyodide](https://pyodide.org) (real CPython
  compiled to WebAssembly) in a Web Worker. No execution server to secure, no
  per-student cost, and the whole app deploys as a static bundle.
- **Record, then scrub.** A run is traced once with `sys.settrace` and captured
  as a timeline of steps. Stepping backwards is therefore free, and you can drag
  a slider during a lecture instead of clicking *Next* forty times.
- **One trace, many lenses.** Every visualization renders from the same recorded
  timeline, so a lens is a view — never a separate fake interpreter.

## Status

Phases 0 through 2 are complete. PyLens is a working Python IDE **and** a
working time machine: every run is recorded step by step, and the timeline above
the workspace scrubs through it. The editor's highlighted line and the output
pane both follow the scrubber, so you can walk a class backwards through a
program and watch the printed output un-print itself.

What is still missing is the picture. The visualizer pane shows a bare summary
of the current step; phase 3 replaces it with the concept lenses.

| Phase | Scope | State |
| ----- | ----- | ----- |
| 0 | Scaffold, theme tokens, layout shell | done |
| 1 | CodeMirror editor, Pyodide worker, run/output, friendly errors | done |
| 2 | Trace engine, timeline store, scrubber | done |
| 3 | Concept lenses | next |
| 4 | Presenter tools, annotations, sharing | |
| 5 | Deployment configs, docs, polish | |

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`,
`npm run typecheck`, `npm run format`.

Requires Node 20+.

The Pyodide runtime (~13 MB) is copied out of `node_modules` into
`public/pyodide` by `scripts/vendor-pyodide.mjs`, which runs automatically
before `dev`, `build`, and `preview`. That directory is gitignored and
regenerated, so the runtime never enters the repo.

## Keyboard

| Shortcut | Action |
| -------- | ------ |
| `Ctrl/Cmd + Enter` | Run the active file |
| `left` / `right` | Previous / next step |
| `Home` / `End` | First / last step |
| `Space` | Play / pause the timeline |
| Click a line number | Jump to the next moment that line ran |
| `Ctrl/Cmd + Shift + P` | Presenter mode — big type, chrome hidden |
| `Ctrl/Cmd + Shift + L` | Light / dark theme |
| `Esc` | Leave presenter mode |

## Layout of the source

```
src/
  components/
    editor/     CodeMirror setup: theme, completions, tabs, line marking
    layout/     app shell, top bar, status bar, workspace splits, pane chrome
    output/     live console, replayed output, the friendly error card
    trace/      the timeline transport bar and scrubber
    panes/      the three workspace panes
    ui/         shared primitives (button, icons)
  hooks/        global keyboard shortcuts
  lib/
    runtime/    worker protocol and the main-thread client
    trace/      the recorded-run types every lens reads
    friendlyErrors.ts   Python exceptions rewritten in plain English
  python/
    runner.py   the driver that executes student code inside Pyodide
    tracer.py   the sys.settrace recorder and heap serialiser
  store/        zustand state (ui, files, run, trace)
  workers/      the Pyodide worker
  index.css     design tokens — every colour in the app is defined here once
```

### How a run works

1. The editor's files go to the worker as plain objects.
2. `runner.py` writes them into Pyodide's virtual filesystem at `/home/pylens`,
   so a second tab named `helpers.py` is genuinely importable from `main.py`.
3. The chosen file is compiled and executed; `stdout` and `stderr` stream back
   line by line while it runs.
4. On failure the driver strips its own frames out of the traceback and returns
   a structured error — type, message, file, line — which the UI turns into a
   plain-English card and a marked line in the editor.

### How the recording works

`tracer.py` installs a `sys.settrace` hook and appends one step per line
executed. A step carries the call stack, the reachable heap, and how much output
had been printed by that moment. Values are stored **by object id**, not copied —
that is what lets a lens draw two variables pointing at the same list, which is
the misconception the whole tool is built around.

Recording stops, but the program does not, after 2,000 steps or 20 seconds. The
student still gets their complete output; the timeline simply covers the part
that fits, and says so.

Nothing is re-executed while you scrub. The run is over; the UI is reading a
list.

`input()` reads from the Input box beside the editor and echoes what it consumed,
so the output reads like a real terminal transcript rather than a run of prompts
with the answers missing.

**Stop** sets an interrupt byte in a `SharedArrayBuffer` that Pyodide polls,
which raises `KeyboardInterrupt` inside the running program and leaves the
interpreter alive. That needs the page to be cross-origin isolated; where it is
not, Stop falls back to terminating the worker and Python re-boots on the next
run.

Colours are never hardcoded in components. `src/index.css` defines a light set on
`:root` and overrides the whole set for `[data-theme='dark']`, which is how the
theme swap and the projector-contrast tuning stay in one file.

## Deployment

The build output in `dist/` is static and works on Vercel or a Render static
site. Both need the cross-origin isolation headers already set in
`vite.config.ts`; the platform config files land in phase 5.
