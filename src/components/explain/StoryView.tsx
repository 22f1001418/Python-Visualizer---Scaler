import { useMemo } from 'react';
import { BeatStack } from './BeatStack';
import { ChangeStrip } from './ChangeStrip';
import { LoopStrip } from './LoopStrip';
import { analyseLoop } from '@/lib/trace/lensData';
import { buildBeats, changesAt, narrate } from '@/lib/trace/story';
import type { Trace, TraceStep } from '@/lib/trace/types';

/**
 * Explain mode.
 *
 * The default view, and deliberately not a diagram. It answers the two questions
 * a first-timer actually has — what is this line about to do, and what just
 * changed — in words and in the code itself, rather than in boxes and arrows
 * whose vocabulary has to be taught before they mean anything.
 *
 * Inspect mode still has the diagrams for later in the course.
 */
export function StoryView({
  step,
  trace,
  stepIndex,
  stdout,
}: {
  step: TraceStep;
  trace: Trace;
  stepIndex: number;
  stdout: string;
}) {
  const beats = useMemo(() => buildBeats(trace, stepIndex, stdout), [trace, stepIndex, stdout]);
  const sentence = useMemo(() => narrate(trace, stepIndex), [trace, stepIndex]);
  // On a call step the beats already list the arguments; repeating them as
  // "changes" would say the same thing twice in two different vocabularies.
  const changes = useMemo(
    () => (step.e === 'call' ? [] : changesAt(trace, stepIndex)),
    [trace, stepIndex, step.e]
  );

  // The loop strip only appears while a loop is what the student is looking at.
  const loop = useMemo(() => analyseLoop(trace, stepIndex), [trace, stepIndex]);
  const loopTarget = useMemo(() => {
    if (!loop) return null;
    const header = trace.steps.find(
      (entry) => entry.line === loop.line && entry.k === 'for' && entry.tg?.length
    );
    return header?.tg?.[0] ?? null;
  }, [loop, trace]);

  const inLoop =
    loop !== null &&
    loopTarget !== null &&
    stepIndex >= loop.rows[0].stepIndex &&
    stepIndex <= loop.rows[loop.rows.length - 1].stepIndex;

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <p className="text-[1.02em] leading-snug text-fg">{sentence}</p>

      <BeatStack beats={beats} stepKey={stepIndex} />

      {inLoop && loop && loopTarget ? (
        <LoopStrip analysis={loop} target={loopTarget} trace={trace} stepIndex={stepIndex} />
      ) : null}

      <ChangeStrip changes={changes} heap={step.heap} />

      {beats.length === 0 && changes.length === 0 ? (
        <p className="text-[0.85em] text-subtle italic">
          Nothing visible happens on this step — press the right arrow to carry on.
        </p>
      ) : null}
    </div>
  );
}
