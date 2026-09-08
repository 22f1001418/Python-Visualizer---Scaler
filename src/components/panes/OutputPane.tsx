import { PaneFrame } from '@/components/layout/PaneFrame';
import { ConsoleView } from '@/components/output/ConsoleView';
import { ErrorCard } from '@/components/output/ErrorCard';
import { Button } from '@/components/ui/Button';
import { TerminalIcon } from '@/components/ui/Icons';
import { useRunStore } from '@/store/runStore';

export function OutputPane() {
  const lines = useRunStore((s) => s.lines);
  const truncated = useRunStore((s) => s.truncated);
  const error = useRunStore((s) => s.error);
  const durationMs = useRunStore((s) => s.durationMs);
  const status = useRunStore((s) => s.status);
  const fatal = useRunStore((s) => s.fatal);
  const clearOutput = useRunStore((s) => s.clearOutput);

  const isEmpty = lines.length === 0 && !error && !fatal;

  return (
    <PaneFrame
      title="Output"
      icon={<TerminalIcon className="size-full" />}
      actions={
        <>
          {durationMs !== null && !error ? (
            <span className="mr-1 font-mono text-[0.78em] text-subtle">
              finished in {formatDuration(durationMs)}
            </span>
          ) : null}
          <Button onClick={clearOutput} disabled={isEmpty}>
            Clear
          </Button>
        </>
      }
    >
      {fatal ? (
        <div className="m-3 rounded-lg border border-error/40 bg-error-soft p-3">
          <p className="text-[0.95em] font-semibold text-error">The Python runtime stopped</p>
          <p className="pt-1 text-[0.88em] text-fg">{fatal}</p>
          <p className="pt-1.5 text-[0.85em] text-muted">Reload the page to start it again.</p>
        </div>
      ) : null}

      {isEmpty && !fatal ? (
        <p className="p-3 text-[0.88em] text-subtle">
          {status === 'booting'
            ? 'Starting Python…'
            : 'Nothing yet. Press Run, or Ctrl/Cmd + Enter in the editor.'}
        </p>
      ) : null}

      {lines.length > 0 ? <ConsoleView lines={lines} truncated={truncated} /> : null}
      {error ? <ErrorCard error={error} /> : null}
    </PaneFrame>
  );
}

function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`;
}
