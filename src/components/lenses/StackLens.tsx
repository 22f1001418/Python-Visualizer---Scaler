import { NameValueRow } from './shared/values';
import { LensEmpty } from './shared/LensEmpty';
import type { LensProps } from './types';

/**
 * The call stack, newest call at the bottom.
 *
 * Frames are drawn as a stack rather than a list because that is the mental
 * model being built: calls pile up, and each one keeps its own variables until
 * it returns. When the same function appears twice, the lens says so — that is
 * recursion, seen rather than described.
 */
export function StackLens({ step }: LensProps) {
  const counts = new Map<string, number>();
  for (const frame of step.frames) {
    if (!frame.module) counts.set(frame.name, (counts.get(frame.name) ?? 0) + 1);
  }
  const recursive = [...counts.entries()].filter(([, count]) => count > 1);

  return (
    <div className="flex h-full flex-col gap-2 overflow-auto p-3">
      {recursive.length > 0 ? (
        <p className="rounded border border-frame/40 bg-frame-soft px-2.5 py-1.5 text-[0.82em] text-frame">
          {recursive.map(([name, count]) => `${name}() is on the stack ${count} times`).join(' · ')}{' '}
          — it called itself, and each call kept its own variables.
        </p>
      ) : null}

      {step.frames.map((frame, index) => {
        const active = index === step.frames.length - 1;

        return (
          <section
            key={frame.id}
            className={`rounded-lg border bg-panel ${
              active ? 'border-frame shadow-[0_0_0_2px_var(--c-frame-soft)]' : 'border-line'
            }`}
          >
            <header className="flex items-baseline gap-2 border-b border-line px-2.5 py-1.5">
              <span className="font-mono text-[0.88em] font-semibold text-frame">
                {frame.module ? frame.file : `${frame.name}()`}
              </span>
              <span className="text-[0.78em] text-subtle">
                {frame.module ? 'the file itself' : `called from line ${callerLine(step, index)}`}
              </span>
              <span className="ml-auto font-mono text-[0.78em] text-subtle">
                {active ? `line ${frame.line} · running` : `waiting at line ${frame.line}`}
              </span>
            </header>

            <div className="flex flex-col gap-0.5 p-2">
              {frame.locals.map(([name, value]) => (
                <NameValueRow key={name} name={name} value={value} heap={step.heap} />
              ))}
              {frame.locals.length === 0 ? (
                <p className="text-[0.8em] text-subtle italic">no variables yet</p>
              ) : null}
            </div>
          </section>
        );
      })}

      {step.frames.length === 0 ? (
        <LensEmpty headline="Nothing on the stack" detail="This step is outside any frame." />
      ) : null}
    </div>
  );
}

function callerLine(step: LensProps['step'], index: number): number | string {
  return step.frames[index - 1]?.line ?? '?';
}
