import { useRunStore } from '@/store/runStore';
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

export function StatusBar() {
  const presenter = useUiStore((s) => s.presenter);
  const cursor = useUiStore((s) => s.cursor);
  const status = useRunStore((s) => s.status);
  const pythonVersion = useRunStore((s) => s.pythonVersion);
  const bootMs = useRunStore((s) => s.bootMs);

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
        {presenter ? <span className="font-medium text-accent">Presenter</span> : null}
        <span>
          Ln {cursor.line}, Col {cursor.column}
        </span>
        <span>Step —/—</span>
      </span>
    </footer>
  );
}
