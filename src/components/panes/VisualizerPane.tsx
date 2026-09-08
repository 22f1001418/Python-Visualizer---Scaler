import { PaneFrame } from '@/components/layout/PaneFrame';
import { LensIcon } from '@/components/ui/Icons';
import { PanePlaceholder } from './PanePlaceholder';
import { frameLabel } from '@/lib/trace/types';
import { selectCurrentStep, useTraceStore } from '@/store/traceStore';

const EVENT_LABEL: Record<string, string> = {
  call: 'entering',
  line: 'about to run',
  return: 'returning from',
  exception: 'raising in',
};

export function VisualizerPane() {
  const step = useTraceStore(selectCurrentStep);

  return (
    <PaneFrame title="Visualizer" icon={<LensIcon className="size-full" />}>
      {step ? (
        <div className="p-4">
          {/* Phase 2 proves the timeline works; phase 3 replaces this block with
              the lenses that render the same step properly. */}
          <p className="text-[0.85em] text-muted">
            {EVENT_LABEL[step.e] ?? step.e} line{' '}
            <span className="font-mono text-fg">{step.line}</span> of{' '}
            <span className="font-mono text-fg">{step.file}</span>
          </p>

          <ol className="mt-3 flex flex-col gap-1">
            {step.frames.map((frame, index) => (
              <li
                key={frame.id}
                className="flex items-baseline gap-2 rounded border border-line bg-inset px-2.5 py-1.5"
                style={{ marginLeft: `${index * 12}px` }}
              >
                <span className="font-mono text-[0.88em] text-frame">{frameLabel(frame)}</span>
                <span className="text-[0.78em] text-subtle">line {frame.line}</span>
                <span className="ml-auto text-[0.78em] text-subtle">
                  {frame.locals.length} variable{frame.locals.length === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-4 text-[0.82em] text-subtle">
            The lenses — memory and references, loop tables, recursion trees — render this same step
            in phase 3.
          </p>
        </div>
      ) : (
        <PanePlaceholder
          headline="The concept lenses live here"
          detail="Run a program and the timeline appears above. Call stack, heap graph with reference arrows, loop tables and recursion trees all render from that one recording."
          phase="Phase 3"
        />
      )}
    </PaneFrame>
  );
}
