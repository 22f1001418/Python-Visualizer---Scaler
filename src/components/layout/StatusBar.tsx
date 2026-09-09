import { useRunStore } from '@/store/runStore';
import { useTraceStore } from '@/store/traceStore';
import { useUiStore } from '@/store/uiStore';
import type { RuntimeStatus } from '@/lib/runtime/protocol';

const STATUS_LABEL: Record<RuntimeStatus, string> = {
  idle: 'Runtime not started',
  booting: 'Starting Python…',
  ready: 'Python ready',
  running: 'Running',
  error: 'Runtime failed',
};

const STATUS_DOT: Record<RuntimeStatus, string> = {
  idle: 'bg-subtle',
  booting: 'bg-warn animate-pulse',
  ready: 'bg-ok',
  running: 'bg-accent animate-pulse',
  error: 'bg-error',
};

/**
 * Cross-origin isolation is what makes SharedArrayBuffer — and therefore a Stop
 * that interrupts instead of killing the interpreter — available. It depends on
 * response headers, so it can only break at deploy time, in a way nothing else
 * on screen would show. Hence the badge: one glance at a fresh deployment says
 * whether the headers in vercel.json / render.yaml actually landed.
 */
const isolated = typeof window !== 'undefined' && window.crossOriginIsolated;

export function StatusBar() {
  const presenter = useUiStore((s) => s.presenter);
  const cursor = useUiStore((s) => s.cursor);
  const status = useRunStore((s) => s.status);
  const pythonVersion = useRunStore((s) => s.pythonVersion);
  const bootMs = useRunStore((s) => s.bootMs);
  const trace = useTraceStore((s) => s.trace);
  const stepIndex = useTraceStore((s) => s.stepIndex);

  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t border-line bg-panel px-3 text-[0.78em] text-subtle">
      <span className="flex items-center gap-1.5">
        <span className={`size-2 rounded-full ${STATUS_DOT[status]}`} />
        {STATUS_LABEL[status]}
      </span>

      <span className="h-3 w-px bg-line" />

      <span>
        {pythonVersion ? `Python ${pythonVersion} · Pyodide` : 'Pyodide'}
        {bootMs !== null ? ` · booted in ${(bootMs / 1000).toFixed(1)}s` : ''}
      </span>

      <span className="ml-auto flex items-center gap-3">
        {!isolated ? (
          <span
            className="text-warn"
            title="Cross-origin isolation is off, so Stop has to restart Python instead of interrupting it. Check the COOP/COEP headers for this deployment."
          >
            Isolation off
          </span>
        ) : null}
        {presenter ? <span className="font-medium text-accent">Presenter</span> : null}
        <span>
          Ln {cursor.line}, Col {cursor.column}
        </span>
        <span className="tabular-nums">
          {trace && trace.steps.length > 0
            ? `Step ${stepIndex + 1}/${trace.steps.length}`
            : 'Step —/—'}
        </span>
      </span>
    </footer>
  );
}
