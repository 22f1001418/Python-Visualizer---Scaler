import { PaneFrame } from '@/components/layout/PaneFrame';
import { TerminalIcon } from '@/components/ui/Icons';
import { PanePlaceholder } from './PanePlaceholder';

export function OutputPane() {
  return (
    <PaneFrame title="Output" icon={<TerminalIcon className="size-full" />}>
      <PanePlaceholder
        headline="stdout, stderr, and friendly errors"
        detail="Output is replayed up to the current step, so it stays in sync when you scrub backwards."
        phase="Phase 1"
      />
    </PaneFrame>
  );
}
