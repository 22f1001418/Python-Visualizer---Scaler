import { useShallow } from 'zustand/react/shallow';
import { PaneFrame } from '@/components/layout/PaneFrame';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { FileTabs } from '@/components/editor/FileTabs';
import { StdinBox } from '@/components/editor/StdinBox';
import { CodeIcon } from '@/components/ui/Icons';
import { selectActiveFile, useFilesStore } from '@/store/filesStore';
import { useRunStore } from '@/store/runStore';
import { useUiStore } from '@/store/uiStore';

export function EditorPane() {
  const activeFile = useFilesStore(useShallow(selectActiveFile));
  const setSource = useFilesStore((s) => s.setSource);
  const setCursor = useUiStore((s) => s.setCursor);
  const start = useRunStore((s) => s.start);
  const error = useRunStore((s) => s.error);

  // Only flag the line when the failure happened in the file on screen.
  const errorLine = error && error.file === activeFile.name ? error.line : null;

  return (
    <PaneFrame title="Editor" icon={<CodeIcon className="size-full" />}>
      <div className="flex h-full min-h-0 flex-col">
        <FileTabs />
        <div className="min-h-0 flex-1">
          <CodeEditor
            fileId={activeFile.id}
            initialSource={activeFile.source}
            onChange={(source) => setSource(activeFile.id, source)}
            onCursorChange={setCursor}
            onRun={start}
            errorLine={errorLine}
          />
        </div>
        <StdinBox />
      </div>
    </PaneFrame>
  );
}
