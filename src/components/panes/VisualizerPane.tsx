import { PaneFrame } from '@/components/layout/PaneFrame';
import { LensIcon } from '@/components/ui/Icons';
import { LensPicker } from '@/components/lenses/LensPicker';
import { lensById } from '@/components/lenses/registry';
import { PanePlaceholder } from './PanePlaceholder';
import { selectCurrentStep, useTraceStore } from '@/store/traceStore';
import { useUiStore } from '@/store/uiStore';

const EVENT_LABEL: Record<string, string> = {
  call: 'entering',
  line: 'about to run',
  return: 'returning from',
  exception: 'raising in',
};

export function VisualizerPane() {
  const trace = useTraceStore((s) => s.trace);
  const stepIndex = useTraceStore((s) => s.stepIndex);
  const step = useTraceStore(selectCurrentStep);
  const lensId = useUiStore((s) => s.lens);

  if (!trace || !step) {
    return (
      <PaneFrame title="Visualizer" icon={<LensIcon className="size-full" />}>
        <PanePlaceholder
          headline="The concept lenses live here"
          detail="Run a program and the timeline appears above. Every lens draws the same recorded step — memory and references, the call stack, loop tables, collections, objects, generators."
          phase="Press Run to start"
        />
      </PaneFrame>
    );
  }

  const lens = lensById(lensId);

  return (
    <PaneFrame
      title="Visualizer"
      icon={<LensIcon className="size-full" />}
      actions={
        <span className="font-mono text-[0.75em] text-subtle">
          {EVENT_LABEL[step.e] ?? step.e} line {step.line}
        </span>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <LensPicker trace={trace} />
        <div className="min-h-0 flex-1">
          <lens.Component step={step} trace={trace} stepIndex={stepIndex} />
        </div>
      </div>
    </PaneFrame>
  );
}
