import { useMemo } from 'react';
import { LENSES } from './registry';
import type { Trace } from '@/lib/trace/types';
import { useUiStore } from '@/store/uiStore';

/**
 * Which lens the visualizer is showing.
 *
 * Lenses with nothing to show in this particular run are dimmed rather than
 * hidden: a tab that disappears is a tab a teacher cannot plan a lesson around.
 */
export function LensPicker({ trace }: { trace: Trace }) {
  const lens = useUiStore((s) => s.lens);
  const setLens = useUiStore((s) => s.setLens);

  const relevance = useMemo(
    () => new Map(LENSES.map((entry) => [entry.id, entry.relevant(trace)])),
    [trace]
  );

  return (
    <div
      className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-line bg-inset px-2 py-1.5"
      role="tablist"
      aria-label="Concept lens"
    >
      {LENSES.map((entry) => {
        const selected = entry.id === lens;
        const hasContent = relevance.get(entry.id) ?? false;

        return (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => setLens(entry.id)}
            title={hasContent ? entry.description : `${entry.description} (nothing in this run)`}
            className={[
              'shrink-0 rounded-md px-2.5 py-1 text-[0.82em] transition-colors',
              selected
                ? 'bg-accent text-accent-fg'
                : hasContent
                  ? 'text-muted hover:bg-hover hover:text-fg'
                  : 'text-subtle/70 hover:bg-hover',
            ].join(' ')}
          >
            {entry.label}
          </button>
        );
      })}
    </div>
  );
}
