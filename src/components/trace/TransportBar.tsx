import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
  PauseIcon,
  PlayIcon,
  SkipEndIcon,
  SkipStartIcon,
  StepBackIcon,
  StepForwardIcon,
} from '@/components/ui/Icons';
import { activeFrame, frameLabel } from '@/lib/trace/types';
import {
  BASE_STEPS_PER_SECOND,
  SPEEDS,
  selectCurrentStep,
  useTraceStore,
} from '@/store/traceStore';

/**
 * The timeline for a finished run.
 *
 * It spans the whole window rather than living inside a pane, because it drives
 * every pane at once: the editor's highlighted line, the output shown so far,
 * and — from phase 3 — whichever lens is open.
 */
export function TransportBar() {
  const trace = useTraceStore((s) => s.trace);
  const stepIndex = useTraceStore((s) => s.stepIndex);
  const playing = useTraceStore((s) => s.playing);
  const speed = useTraceStore((s) => s.speed);
  const step = useTraceStore(selectCurrentStep);

  const goTo = useTraceStore((s) => s.goTo);
  const stepBy = useTraceStore((s) => s.stepBy);
  const toStart = useTraceStore((s) => s.toStart);
  const toEnd = useTraceStore((s) => s.toEnd);
  const togglePlay = useTraceStore((s) => s.togglePlay);
  const setSpeed = useTraceStore((s) => s.setSpeed);

  usePlayback();

  if (!trace || trace.steps.length === 0) return null;

  const lastIndex = trace.steps.length - 1;
  const frame = step ? activeFrame(step) : undefined;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-panel px-3 py-2">
      <div className="flex items-center gap-0.5">
        <Button
          icon={<SkipStartIcon className="size-full" />}
          onClick={toStart}
          disabled={stepIndex === 0}
          title="First step (Home)"
          aria-label="First step"
        />
        <Button
          icon={<StepBackIcon className="size-full" />}
          onClick={() => stepBy(-1)}
          disabled={stepIndex === 0}
          title="Previous step (left arrow)"
          aria-label="Previous step"
        />
        <Button
          variant="primary"
          icon={playing ? <PauseIcon className="size-full" /> : <PlayIcon className="size-full" />}
          onClick={togglePlay}
          title={playing ? 'Pause (Space)' : 'Play (Space)'}
          aria-label={playing ? 'Pause' : 'Play'}
        />
        <Button
          icon={<StepForwardIcon className="size-full" />}
          onClick={() => stepBy(1)}
          disabled={stepIndex === lastIndex}
          title="Next step (right arrow)"
          aria-label="Next step"
        />
        <Button
          icon={<SkipEndIcon className="size-full" />}
          onClick={toEnd}
          disabled={stepIndex === lastIndex}
          title="Last step (End)"
          aria-label="Last step"
        />
      </div>

      <input
        type="range"
        className="pl-scrubber min-w-40 flex-1"
        min={0}
        max={lastIndex}
        value={stepIndex}
        onChange={(event) => goTo(Number(event.target.value))}
        aria-label="Step through the run"
        aria-valuetext={`Step ${stepIndex + 1} of ${trace.steps.length}`}
      />

      <div className="flex items-center gap-2 font-mono text-[0.8em] text-muted tabular-nums">
        <span>
          {stepIndex + 1}
          <span className="text-subtle"> / {trace.steps.length}</span>
        </span>
        {frame ? (
          <span className="text-subtle">
            line {step?.line} · {frameLabel(frame)}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-0.5" role="group" aria-label="Playback speed">
        {SPEEDS.map((value) => (
          <Button
            key={value}
            active={speed === value}
            onClick={() => setSpeed(value)}
            className="px-1.5 font-mono text-[0.78em]"
            title={`${value * BASE_STEPS_PER_SECOND} steps per second`}
          >
            {value}x
          </Button>
        ))}
      </div>

      {trace.capped ? (
        <span
          className="rounded border border-warn/40 bg-warn-soft px-2 py-0.5 text-[0.75em] text-warn"
          title="The program ran to the end — only the recording stopped early."
        >
          {trace.capReason === 'time'
            ? 'Recording stopped after 20s'
            : `Recording stopped at ${trace.steps.length} steps`}
        </span>
      ) : null}
    </div>
  );
}

/** Drives playback while `playing` is set. */
function usePlayback(): void {
  const playing = useTraceStore((s) => s.playing);
  const speed = useTraceStore((s) => s.speed);

  useEffect(() => {
    if (!playing) return;

    const interval = window.setInterval(
      () => {
        const { trace, stepIndex, pause, goTo } = useTraceStore.getState();
        if (!trace) return;

        if (stepIndex >= trace.steps.length - 1) {
          pause();
          return;
        }
        goTo(stepIndex + 1);
      },
      1000 / (BASE_STEPS_PER_SECOND * speed)
    );

    return () => window.clearInterval(interval);
  }, [playing, speed]);
}
