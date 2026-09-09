import { ValueChip } from '@/components/lenses/shared/values';
import { currentPass, type LoopAnalysis } from '@/lib/trace/lensData';
import type { Trace } from '@/lib/trace/types';
import { useTraceStore } from '@/store/traceStore';

/**
 * Every pass of the loop, laid out at once, with the current one lit.
 *
 * A slider hides the shape of a loop — you can only ever see one moment of it.
 * Seeing all the values the loop variable will take, side by side, is what turns
 * "it repeats somehow" into "it walks along these, one at a time".
 */
export function LoopStrip({
  analysis,
  target,
  trace,
  stepIndex,
}: {
  analysis: LoopAnalysis;
  target: string;
  trace: Trace;
  stepIndex: number;
}) {
  const goTo = useTraceStore((s) => s.goTo);

  const passes = analysis.rows.filter((row) => row.iteration > 0 && row.values[target]);
  if (passes.length === 0) return null;

  // Once every pass has settled the loop is over, and nothing should look live.
  const current = currentPass(analysis, stepIndex);
  const finished = current > passes.length;

  return (
    <div className="rounded-lg border border-line bg-panel p-2.5">
      <p className="text-[0.75em] tracking-wide text-subtle uppercase">
        the loop walks along these, one at a time
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {passes.map((row) => {
          const isCurrent = !finished && row.iteration === current;
          const isPast = finished || row.iteration < current;

          return (
            <button
              key={row.stepIndex}
              type="button"
              onClick={() => goTo(row.stepIndex)}
              title={`Pass ${row.iteration} — jump here`}
              className={[
                'flex flex-col items-center gap-0.5 rounded-md border px-2 py-1 transition-colors',
                isCurrent
                  ? 'border-accent bg-accent-soft'
                  : isPast
                    ? 'border-line bg-inset opacity-55'
                    : 'border-line bg-inset',
              ].join(' ')}
            >
              <ValueChip value={row.values[target]!} heap={trace.steps[row.stepIndex].heap} />
              <span className="font-mono text-[0.68em] text-subtle">{row.iteration}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[0.8em] text-subtle">
        {finished ? (
          <>Every one has been used, so the loop stops and the program carries on below it.</>
        ) : (
          <>
            <span className="font-mono text-fg">{target}</span> is the name given to whichever one
            the loop is holding right now.
          </>
        )}
      </p>
    </div>
  );
}
