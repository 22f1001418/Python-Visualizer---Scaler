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

Phase 0 (foundation) is complete: toolchain, design tokens, and the resizable
app shell. The panes are labelled placeholders until the phases below land.

| Phase | Scope | State |
| ----- | ----- | ----- |
| 0 | Scaffold, theme tokens, layout shell | done |
| 1 | CodeMirror editor, Pyodide worker, run/output | next |
| 2 | Trace engine, timeline store, scrubber | |
| 3 | Concept lenses | |
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

## Keyboard

| Shortcut | Action |
| -------- | ------ |
| `Ctrl/Cmd + Shift + P` | Presenter mode — big type, chrome hidden |
| `Ctrl/Cmd + Shift + L` | Light / dark theme |
| `Esc` | Leave presenter mode |

## Layout of the source

```
src/
  components/
    layout/     app shell, top bar, status bar, workspace splits, pane chrome
    panes/      the three workspace panes
    ui/         shared primitives (button, icons)
  hooks/        global keyboard shortcuts
  lib/          small helpers
  store/        zustand state
  index.css     design tokens — every colour in the app is defined here once
```

Colours are never hardcoded in components. `src/index.css` defines a light set on
`:root` and overrides the whole set for `[data-theme='dark']`, which is how the
theme swap and the projector-contrast tuning stay in one file.

## Deployment

The build output in `dist/` is static and works on Vercel or a Render static
site. Both need the cross-origin isolation headers already set in
`vite.config.ts`; the platform config files land in phase 5.
