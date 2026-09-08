import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { EditorPane } from '@/components/panes/EditorPane';
import { OutputPane } from '@/components/panes/OutputPane';
import { VisualizerPane } from '@/components/panes/VisualizerPane';

/**
 * Editor on the left, visualizer over output on the right.
 *
 * The split favours the right-hand side more than a normal IDE would: in a
 * lecture the picture is the point and the code is the caption. Sizes are
 * persisted per browser via autoSaveId, so your teaching layout survives a
 * reload mid-class.
 */
export function Workspace() {
  return (
    <PanelGroup direction="horizontal" autoSaveId="pylens.layout.main" className="min-h-0 flex-1">
      <Panel id="editor" order={1} defaultSize={44} minSize={22}>
        <EditorPane />
      </Panel>

      <PanelResizeHandle className="pl-handle" />

      <Panel id="right" order={2} defaultSize={56} minSize={25}>
        <PanelGroup direction="vertical" autoSaveId="pylens.layout.right">
          <Panel id="visualizer" order={1} defaultSize={66} minSize={20}>
            <VisualizerPane />
          </Panel>

          <PanelResizeHandle className="pl-handle" />

          <Panel id="output" order={2} defaultSize={34} minSize={12} collapsible collapsedSize={0}>
            <OutputPane />
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}
