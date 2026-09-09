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

Phases 0 through 4 are complete, and the visualizer has since been rebuilt
around what beginners actually need.

PyLens is a working Python IDE, a time machine over any run, and two ways of
looking at the moment you have scrubbed to:

- **Explain** (the default) answers *what is this line about to do* and *what
  just changed*, in plain words and in the code itself.
- **Inspect** has the six diagrams — memory and references, the call stack, loop
  tables, collections, objects, generators.

Plus the tools to teach from it: a lesson deck, notes pinned to steps,
predict-the-output, presenter mode, and a share link that carries the whole
lesson.

The scope is deliberately the **foundations of Python**, not data structures and
algorithms. Everything DSA-flavoured is parked under
[aspirational extensions](#aspirational-extensions) rather than half-built.

| Phase | Scope | State |
| ----- | ----- | ----- |
| 0 | Scaffold, theme tokens, layout shell | done |
| 1 | CodeMirror editor, Pyodide worker, run/output, friendly errors | done |
| 2 | Trace engine, timeline store, scrubber | done |
| 3 | Concept lenses | done |
| 4 | Presenter tools, annotations, sharing | done |
| 5 | Deployment configs, docs, polish | next |

## Explain mode

The default view, and deliberately not a diagram.

**Values filled in, in place.** The line is shown as written, then again with
every name replaced by the value it holds, then with the answer:

```
the line                    total = total + n
with the values filled in   total = 4 + 8
so now                      total = 12
```

The same substitution appears at the end of the line **in the editor**, so the
code is the visualization and the eye never has to travel.

**A sentence per step.** "Work out the right-hand side first, then put the name
total on the answer." "add_bonus() starts running, with its own copy of the
values it was given." Derived from the statement kind and the recorded values —
nothing is hand-written per program.

**What just changed.** Every step shows the difference from the previous one:
`n  4 → 8`. A memory diagram shows where things stand; it never shows what moved,
and what moved is the thing a beginner is trying to work out.

**Loops laid out flat.** Every pass side by side with the current one lit, so a
loop reads as "it walks along these, one at a time" rather than as a slider
position. Click any pass to jump to it.

**Calls and returns as flows.** Entering a function shows the arguments becoming
its own variables; leaving one shows `add_bonus() → 77`.

## Why it looks like this

The first version of the visualizer was, structurally, Python Tutor — and
research on exactly that shape found it wanting for novices: it "provides precise
memory traces but does not help learners abstract what the computation is about",
and on its own sometimes engaged students *less* than a plain text explanation
([From Code to Concept, arXiv 2509.26466](https://arxiv.org/html/2509.26466)).
The fix that paper proposes is coordinated views at different levels of
abstraction, with the concrete one fading as understanding grows.

Explain mode is that abstract view. The substitution idea is
[Thonny's](https://github.com/thonny/thonny/blob/master/thonny/plugins/help/debuggers.rst)
"small step" — its own metaphor is a piece of paper where Python replaces
subexpressions with their values, piece by piece. Inline values and per-iteration
loop navigation come from [birdseye](https://birdseye.readthedocs.io/en/latest/quickstart.html).
Laying every pass of a loop out at once, and making time scrubbable rather than
merely steppable, are from Bret Victor's
[Learnable Programming](http://worrydream.com/LearnableProgramming/).

Inspect mode keeps the faithful diagrams, because they are right later — just not
in week one.

## The lenses

Every lens renders the same recorded step. Switch between them and the picture
changes; the program does not re-run, and two lenses never disagree.

| Lens | What it shows |
| ---- | ------------- |
| **Memory** | Names on the left, objects on the right, arrows between them. When two names point at one object the card says so — this is the lens the tool exists for. |
| **Call stack** | Which function is running, who called it, what each call is holding. Says out loud when a function is on the stack more than once. |
| **Loop table** | The trace table a teacher draws by hand: one row per pass, one column per variable that actually changes. Click a row to scrub to that pass. |
| **Collections** | Lists, tuples, sets and dictionaries drawn the way they behave — a list gets numbered cells, a set is told it has no order, a tuple says it cannot be changed. |
| **Objects** | Classes beside the objects made from them, so what is shared and what is per-object is visible rather than asserted. |
| **Generators** | Where a paused function stopped, which variables it is still holding, and what it has handed out so far. |

A lens with nothing to show in the current run is dimmed rather than hidden, so
a lesson can be planned around a tab that will always be in the same place.

## Teaching from it

- **Lessons** (`L`) — 14 prepared snippets grouped the way a foundations course
  runs, from variables to generators. Each one opens on the lens it was written
  for, so the picture is already right when the class looks up.
- **Notes** (`N`) — pin a sentence to a step. Scrub past it and the caption
  appears; annotated steps are marked on the scrubber, so a prepared lecture
  reads as a set of stops rather than a slider you have to remember positions on.
- **Predict the output** (`P`) — covers the console until someone commits to an
  answer. Everything else keeps working, so the class can reason from the code
  and the lens before seeing the result.
- **Presenter mode** (`Ctrl/Cmd + Shift + P`) — hides the chrome and scales every
  size by 1.45. The timeline and the caption rail stay, because they are the only
  things you touch mid-class.
- **Share** — copies a link containing the files, the stdin, the notes and the
  chosen lens, compressed into the URL fragment. No backend, no accounts, and
  nothing leaves the browser: the fragment is never sent to a server.

## Aspirational extensions

Deliberately not built. These are data-structures-and-algorithms material, and
PyLens is aimed at students learning the foundations of the language:

- recursion tree (the Call stack lens already shows recursive calls honestly)
- sorting animator driven by the student's own sort
- operation counter and empirical Big-O curve
- stack and queue views
- third-party packages (numpy, pandas, matplotlib) via micropip — these need a
  network fetch per package, which would undo the "loads once, then works on
  classroom wifi" property, and the lenses have nothing useful to say about an
  ndarray. `import numpy` currently fails with a friendly explanation instead.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Single-letter keys work whenever the editor does not have focus. The editor is
deliberately not focused on load, and running with `Ctrl/Cmd + Enter` hands focus
back to the page — after a run you are stepping, not typing.

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
| `N` | Write a note on this step |
| `P` | Predict the output |
| `L` | Open the lessons |
| `E` | Switch between Explain and Inspect |
| `?` | Show the shortcut list |
| `Ctrl/Cmd + Shift + P` | Presenter mode — big type, chrome hidden |
| `Ctrl/Cmd + Shift + L` | Light / dark theme |
| `Esc` | Close what is open, or leave presenter mode |

## Layout of the source

```
src/
  components/
    editor/     CodeMirror setup: theme, completions, tabs, line and value marking
    explain/    Explain mode: the beats, the change strip, the loop strip
    layout/     app shell, top bar, status bar, workspace splits, pane chrome
    lenses/     the six concept lenses, plus their shared value rendering
    output/     live console, replayed output, the friendly error card
    trace/      the timeline transport bar and scrubber
    panes/      the three workspace panes
    teach/      lesson drawer, note rail, predict card, share, shortcut help
    ui/         shared primitives (button, icons)
  hooks/        global keyboard shortcuts, shared-link loading
  lessons/      the prepared teaching snippets
  lib/
    runtime/    worker protocol and the main-thread client
    trace/      recorded-run types, the lens selectors, and the plain-words story
    friendlyErrors.ts   Python exceptions rewritten in plain English
    share.ts    the whole lesson, compressed into a URL fragment
  python/
    runner.py   the driver that executes student code inside Pyodide
    tracer.py   the sys.settrace recorder, heap serialiser and source index
  store/        zustand state (ui, files, run, trace, notes)
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

Alongside the state, each line step records its own source, what kind of
statement it is, the names it assigns, and the same line with every readable name
replaced by its current value. That last one is what Explain mode shows, and it
is computed once, in Python, from the module's AST — no expression is ever
evaluated twice.

Nothing is re-executed while you scrub. The run is over; the UI is reading a
list.

The recorder is plain CPython, so it can be exercised without a browser:

```bash
python3 scripts/trace-smoke.py            # built-in sample
python3 scripts/trace-smoke.py some.py    # your own file
```

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
