import { create } from 'zustand';
import type { Trace, TraceStep } from '@/lib/trace/types';

/** Steps per second at 1× — slow enough to narrate over. */
export const BASE_STEPS_PER_SECOND = 5;
export const SPEEDS = [0.5, 1, 2, 4] as const;
export type Speed = (typeof SPEEDS)[number];

interface TraceState {
  trace: Trace | null;
  /** Complete stdout of the run, replayed up to the current step. */
  stdout: string;
  stepIndex: number;
  playing: boolean;
  speed: Speed;

  setResult: (trace: Trace | null, stdout: string) => void;
  clear: () => void;
  goTo: (index: number) => void;
  stepBy: (delta: number) => void;
  toStart: () => void;
  toEnd: () => void;
  /** Move to the next step on `line`, wrapping around. */
  jumpToLine: (file: string, line: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: Speed) => void;
}

export const useTraceStore = create<TraceState>()((set, get) => ({
  trace: null,
  stdout: '',
  stepIndex: 0,
  playing: false,
  speed: 1,

  setResult: (trace, stdout) =>
    set({
      trace,
      stdout,
      // Land on the end of the run: that is where the output and the final state
      // are, and scrubbing backwards from there is the natural way to explain it.
      stepIndex: trace ? Math.max(0, trace.steps.length - 1) : 0,
      playing: false,
    }),

  clear: () => set({ trace: null, stdout: '', stepIndex: 0, playing: false }),

  goTo: (index) => {
    const { trace } = get();
    if (!trace || trace.steps.length === 0) return;
    set({ stepIndex: Math.min(Math.max(index, 0), trace.steps.length - 1) });
  },

  stepBy: (delta) => {
    const { trace, stepIndex } = get();
    if (!trace) return;
    const next = Math.min(Math.max(stepIndex + delta, 0), trace.steps.length - 1);
    set({ stepIndex: next, playing: next === trace.steps.length - 1 ? false : get().playing });
  },

  toStart: () => set({ stepIndex: 0, playing: false }),

  toEnd: () => {
    const { trace } = get();
    if (!trace) return;
    set({ stepIndex: Math.max(0, trace.steps.length - 1), playing: false });
  },

  jumpToLine: (file, line) => {
    const { trace, stepIndex } = get();
    if (!trace) return;

    const matches = trace.steps.filter((step) => step.file === file && step.line === line);
    if (matches.length === 0) return;

    const next = matches.find((step) => step.i > stepIndex) ?? matches[0];
    set({ stepIndex: next.i, playing: false });
  },

  play: () => {
    const { trace, stepIndex } = get();
    if (!trace || trace.steps.length === 0) return;
    // Replaying from the end would look broken, so start over.
    const atEnd = stepIndex >= trace.steps.length - 1;
    set({ playing: true, stepIndex: atEnd ? 0 : stepIndex });
  },

  pause: () => set({ playing: false }),

  togglePlay: () => (get().playing ? get().pause() : get().play()),

  setSpeed: (speed) => set({ speed }),
}));

/** The step the scrubber is sitting on. */
export function selectCurrentStep(state: TraceState): TraceStep | null {
  return state.trace?.steps[state.stepIndex] ?? null;
}

/**
 * Output as it stood at the current step.
 *
 * At the very end of the timeline the whole buffer is shown — when tracing was
 * capped the program kept printing past the last recorded step, and hiding that
 * tail would look like lost output.
 */
export function selectVisibleStdout(state: TraceState): string {
  const { trace, stdout, stepIndex } = state;
  if (!trace || trace.steps.length === 0) return stdout;
  if (stepIndex >= trace.steps.length - 1) return stdout;
  return stdout.slice(0, trace.steps[stepIndex].out);
}
