import { useMemo } from 'react';
import { HeapCard } from './shared/HeapCard';
import { ValueChip } from './shared/values';
import { LensEmpty } from './shared/LensEmpty';
import { reachableObjects, referenceCounts } from '@/lib/trace/lensData';
import type { PyValue } from '@/lib/trace/types';
import type { LensProps } from './types';

/**
 * Generators: functions that pause instead of finishing.
 *
 * The useful thing to show is that the paused frame's variables are still there
 * between one `next()` and the next — that is what makes a generator lazy rather
 * than just a list built slowly. Values handed out so far are listed alongside,
 * so the student can see them arrive one at a time.
 */
export function GeneratorLens({ step, trace, stepIndex }: LensProps) {
  const generators = useMemo(
    () => reachableObjects(step).filter((object) => object.kind === 'generator'),
    [step]
  );
  const pointers = useMemo(() => referenceCounts(step), [step]);

  const yieldsByName = useMemo(() => {
    const collected = new Map<string, PyValue[]>();

    // In CPython each yield surfaces as a return event from the generator's
    // frame, so the trace already holds every value it has handed out.
    for (const past of trace.steps) {
      if (past.i > stepIndex || past.e !== 'return' || !past.ret) continue;
      const frame = past.frames[past.frames.length - 1];
      if (!frame || frame.module) continue;

      const list = collected.get(frame.name) ?? [];
      list.push(past.ret);
      collected.set(frame.name, list);
    }

    return collected;
  }, [trace, stepIndex]);

  if (generators.length === 0) {
    return (
      <LensEmpty
        headline="No generators at this step"
        detail="A function with a yield in it produces a generator. Create one and this shows where it is paused and which variables it is still holding."
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-3">
      {generators.map((generator) => {
        if (generator.kind !== 'generator') return null;
        const handed = yieldsByName.get(generator.name) ?? [];

        return (
          <div key={generator.id} className="flex flex-col gap-2">
            <HeapCard
              object={generator}
              heap={step.heap}
              names={(pointers.get(generator.id) ?? []).map((binding) => binding.name)}
            />

            <div className="rounded-lg border border-line bg-panel p-2.5">
              <h4 className="text-[0.75em] font-semibold tracking-wide text-subtle uppercase">
                Handed out so far
              </h4>

              {handed.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {handed.map((value, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      {index > 0 ? <span className="text-subtle">·</span> : null}
                      <ValueChip value={value} heap={step.heap} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-[0.82em] text-subtle italic">
                  nothing yet — the body has not run at all until something asks for a value
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
