import { useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { PaneFrame } from '@/components/layout/PaneFrame';
import { FileTabs } from '@/components/editor/FileTabs';
import { StdinBox } from '@/components/editor/StdinBox';
import { CodeIcon } from '@/components/ui/Icons';
import { selectActiveFile, useFilesStore } from '@/store/filesStore';
import { selectCurrentStep, useTraceStore } from '@/store/traceStore';

/**
 * The code, without an editor.
 *
 * Used on small screens, where CodeMirror's gutters, autocomplete and selection
 * handles cost more room than they earn. Everything the timeline needs is still
 * here: the line that is about to run, the same line with its values filled in,
 * and a tap target per line to jump the timeline there.
 */
export function ReadOnlyCodePane() {
  const activeFile = useFilesStore(useShallow(selectActiveFile));
  const files = useFilesStore((s) => s.files);
  const step = useTraceStore(selectCurrentStep);
  const jumpToLine = useTraceStore((s) => s.jumpToLine);

  const lines = useMemo(() => activeFile.source.split('\n'), [activeFile.source]);
  const currentLine = step && step.file === activeFile.name ? step.line : null;

  // Keep the running line on screen while the timeline plays — on a phone the
  // code panel is only a few lines tall, so it scrolls away almost at once.
  const marked = useRef<HTMLDivElement>(null);
  useEffect(() => {
    marked.current?.scrollIntoView({ block: 'nearest' });
  }, [currentLine]);

  return (
    <PaneFrame
      title="Code"
      icon={<CodeIcon className="size-full" />}
      actions={<span className="text-[0.78em] text-subtle">read-only on small screens</span>}
    >
      <div className="flex h-full min-h-0 flex-col">
        {files.length > 1 ? <FileTabs /> : null}

        <div className="min-h-0 flex-1 overflow-auto py-1 font-mono text-[0.85em] leading-6">
          {lines.map((text, index) => {
            const line = index + 1;
            const isCurrent = line === currentLine;

            return (
              <div
                key={line}
                ref={isCurrent ? marked : null}
                role="button"
                tabIndex={0}
                title="Jump to the next moment this line ran"
                onClick={() => jumpToLine(activeFile.name, line)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') jumpToLine(activeFile.name, line);
                }}
                className={
                  isCurrent
                    ? 'bg-accent-soft text-fg shadow-[inset_2px_0_0_var(--c-accent)]'
                    : 'text-muted'
                }
              >
                <div className="flex gap-3 px-3">
                  <span className="w-6 shrink-0 text-right text-subtle tabular-nums">{line}</span>
                  <span className="whitespace-pre-wrap">{text || ' '}</span>
                </div>

                {/* The substitution goes under the line rather than beside it:
                    there is no room for two columns of code on a phone. */}
                {isCurrent && step?.sub ? (
                  <div className="flex gap-3 px-3 pb-1 text-accent">
                    <span className="w-6 shrink-0 text-right">→</span>
                    <span className="whitespace-pre-wrap">{step.sub}</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <StdinBox />
      </div>
    </PaneFrame>
  );
}
