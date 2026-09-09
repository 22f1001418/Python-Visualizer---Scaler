import { useMemo } from 'react';
import { ValueChip } from './shared/values';
import { LensEmpty } from './shared/LensEmpty';
import { analyseLoop, currentPass, passCount } from '@/lib/trace/lensData';
import { useTraceStore } from '@/store/traceStore';
import type { LensProps } from './types';

/**
 * The trace table, built for you.
 *
 * This is the table a teacher draws on a whiteboard one row at a time, except
 * it is already filled in and every row is clickable: click it and the whole app
 * scrubs to that iteration.
 */
export function LoopLens({ trace, stepIndex }: LensProps) {
  const analysis = useMemo(() => analyseLoop(trace, stepIndex), [trace, stepIndex]);
  const goTo = useTraceStore((s) => s.goTo);

  if (!analysis) {
    return (
      <LensEmpty
        headline="No loop in this run"
        detail="Write a for or while loop and this becomes a trace table: one row per iteration, one column per variable."
      />
    );
  }

  // The pass in flight, or the last one once the loop is over.
  const currentRow = Math.min(currentPass(analysis, stepIndex), passCount(analysis));

  return (
    <div className="flex h-full flex-col overflow-auto">
      <p className="shrink-0 px-3 pt-3 text-[0.82em] text-muted">
        The loop on line <span className="font-mono text-fg">{analysis.line}</span> of{' '}
        <span className="font-mono text-fg">{analysis.frameLabel}</span> ran{' '}
        {analysis.rows.length - 1} time{analysis.rows.length === 2 ? '' : 's'}. Values are shown as
        they stood at the end of each pass.
      </p>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <table className="w-full border-collapse text-[0.85em]">
          <thead>
            <tr>
              <th className="sticky top-0 border-b border-line bg-panel px-2 py-1.5 text-left font-medium text-subtle">
                pass
              </th>
              {analysis.columns.map((column) => (
                <th
                  key={column}
                  className="sticky top-0 border-b border-line bg-panel px-2 py-1.5 text-left font-mono font-medium text-fg"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {analysis.rows.map((row, index) => {
              const step = trace.steps[row.stepIndex];
              const isCurrent = index === currentRow;

              return (
                <tr
                  key={row.stepIndex}
                  onClick={() => goTo(row.stepIndex)}
                  className={`cursor-pointer border-b border-line/60 ${
                    isCurrent ? 'bg-accent-soft' : 'hover:bg-hover'
                  }`}
                  title="Jump to this pass"
                >
                  <td className="px-2 py-1 text-subtle tabular-nums">
                    {row.iteration === 0 ? 'before' : row.iteration}
                  </td>
                  {analysis.columns.map((column) => {
                    const value = row.values[column];
                    return (
                      <td key={column} className="px-2 py-1">
                        {value ? (
                          <ValueChip value={value} heap={step.heap} />
                        ) : (
                          <span className="text-subtle">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
