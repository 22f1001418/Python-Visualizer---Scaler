import { PaneFrame } from '@/components/layout/PaneFrame';
import { CodeIcon } from '@/components/ui/Icons';
import { PanePlaceholder } from './PanePlaceholder';

export function EditorPane() {
  return (
    <PaneFrame title="Editor" icon={<CodeIcon className="size-full" />}>
      <PanePlaceholder
        headline="CodeMirror 6 lands here"
        detail="Python syntax, autocomplete, and the current-line highlight that the trace scrubber drives."
        phase="Phase 1"
      />
    </PaneFrame>
  );
}
