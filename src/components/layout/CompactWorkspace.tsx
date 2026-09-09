import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { OutputPane } from '@/components/panes/OutputPane';
import { ReadOnlyCodePane } from '@/components/panes/ReadOnlyCodePane';
import { VisualizerPane } from '@/components/panes/VisualizerPane';

/**
 * The small-screen layout: one column, no editor.
 *
 * A share link often gets opened on a phone after class, and a side-by-side IDE
 * is unreadable there. So the code becomes a read-only listing and the room goes
 * to the two things worth reading back: the explanation and the output.
 */
export function CompactWorkspace() {
  return (
    <PanelGroup direction="vertical" autoSaveId="pylens.layout.compact" className="min-h-0 flex-1">
      <Panel id="code" order={1} defaultSize={28} minSize={12} collapsible collapsedSize={0}>
        <ReadOnlyCodePane />
      </Panel>

      <PanelResizeHandle className="pl-handle" />

      <Panel id="visualizer" order={2} defaultSize={44} minSize={20}>
        <VisualizerPane />
      </Panel>

      <PanelResizeHandle className="pl-handle" />

      <Panel id="output" order={3} defaultSize={28} minSize={12} collapsible collapsedSize={0}>
        <OutputPane />
      </Panel>
    </PanelGroup>
  );
}
