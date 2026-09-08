import { PaneFrame } from '@/components/layout/PaneFrame';
import { LensIcon } from '@/components/ui/Icons';
import { PanePlaceholder } from './PanePlaceholder';

export function VisualizerPane() {
  return (
    <PaneFrame title="Visualizer" icon={<LensIcon className="size-full" />}>
      <PanePlaceholder
        headline="The concept lenses live here"
        detail="Call stack, heap graph with reference arrows, loop tables, recursion trees — all rendered from one recorded trace."
        phase="Phase 3"
      />
    </PaneFrame>
  );
}
