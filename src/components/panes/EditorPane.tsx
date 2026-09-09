import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { PaneFrame } from '@/components/layout/PaneFrame';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { FileTabs } from '@/components/editor/FileTabs';
import { StdinBox } from '@/components/editor/StdinBox';
import { CodeIcon } from '@/components/ui/Icons';
import { selectActiveFile, useFilesStore } from '@/store/filesStore';
import { useRunStore } from '@/store/runStore';
import { selectCurrentStep, useTraceStore } from '@/store/traceStore';
import { useUiStore } from '@/store/uiStore';

export function EditorPane() {
  const activeFile = useFilesStore(useShallow(selectActiveFile));
  const setSource = useFilesStore((s) => s.setSource);
  const setCursor = useUiStore((s) => s.setCursor);
  const start = useRunStore((s) => s.start);
  const error = useRunStore((s) => s.error);
  const step = useTraceStore(selectCurrentStep);
  const jumpToLine = useTraceStore((s) => s.jumpToLine);

  /**
   * One line can be marked at a time, and the scrubber wins.
   *
   * While a trace is being read, the current step is what the room is looking
   * at; the error line only takes over once there is no timeline to follow.
   */
  /** Thonny's trick: the same line with the names replaced by their values. */
  const inline = useMemo(() => {
    if (!step || step.file !== activeFile.name || !step.sub) return null;
    return { line: step.line, text: `→ ${step.sub}` };
  }, [step, activeFile.name]);

  const marked = useMemo(() => {
    if (step && step.file === activeFile.name) {
      return { line: step.line, className: 'pl-current-line' };
    }
    if (!step && error && error.file === activeFile.name && error.line !== null) {
      return { line: error.line, className: 'pl-error-line' };
    }
    return null;
  }, [step, error, activeFile.name]);

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
            onGutterJump={(line) => jumpToLine(activeFile.name, line)}
            marked={marked}
            inline={inline}
          />
        </div>
        <StdinBox />
      </div>
    </PaneFrame>
  );
}
