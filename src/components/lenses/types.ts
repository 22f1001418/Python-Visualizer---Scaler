import type { Trace, TraceStep } from '@/lib/trace/types';

/** Every lens renders one recorded step. None of them re-run anything. */
export interface LensProps {
  step: TraceStep;
  trace: Trace;
  stepIndex: number;
}
