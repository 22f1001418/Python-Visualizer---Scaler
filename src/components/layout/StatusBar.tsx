import { useUiStore } from '@/store/uiStore';

/** The strip along the bottom. In phase 0 it reports the shell's own state;
 *  phase 1 replaces the runtime pill with real Pyodide status, and phase 2 fills
 *  in the step counter from the trace timeline. */
export function StatusBar() {
  const presenter = useUiStore((s) => s.presenter);

  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t border-line bg-panel px-3 text-[0.78em] text-subtle">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-subtle" />
        Runtime not loaded
      </span>
      <span className="h-3 w-px bg-line" />
      <span>Python 3.12 · Pyodide</span>
      <span className="ml-auto flex items-center gap-3">
        {presenter ? <span className="font-medium text-accent">Presenter</span> : null}
        <span>Ln 1, Col 1</span>
        <span>Step —/—</span>
      </span>
    </footer>
  );
}
