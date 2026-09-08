import { useEffect, useRef } from 'react';
import {
  EditorView,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  indentUnit,
} from '@codemirror/language';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { python } from '@codemirror/lang-python';
import { pylensEditorTheme } from './theme';
import { markedLine, setMarkedLine } from './errorLine';
import { pythonCompletions } from './completions';

interface CodeEditorProps {
  /** Remounts when this changes, so each file keeps its own undo history. */
  fileId: string;
  initialSource: string;
  onChange: (source: string) => void;
  onCursorChange: (line: number, column: number) => void;
  onRun: () => void;
  /** Clicking a line number asks the timeline to jump to that line. */
  onGutterJump: (line: number) => void;
  /** 1-based line to mark, with the CSS class to mark it with. */
  marked: { line: number; className: string } | null;
}

export function CodeEditor({
  fileId,
  initialSource,
  onChange,
  onCursorChange,
  onRun,
  onGutterJump,
  marked,
}: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);

  // Handlers are read through a ref so that a re-render never has to rebuild
  // the editor — rebuilding would drop the cursor and the undo history.
  const handlers = useRef({ onChange, onCursorChange, onRun, onGutterJump });
  handlers.current = { onChange, onCursorChange, onRun, onGutterJump };

  useEffect(() => {
    if (!host.current) return;

    const state = EditorState.create({
      doc: initialSource,
      extensions: [
        lineNumbers({
          domEventHandlers: {
            // Clicking a line number scrubs to the next moment that line ran —
            // the fastest way to answer "what happens when we get here?".
            mousedown: (view, block) => {
              handlers.current.onGutterJump(view.state.doc.lineAt(block.from).number);
              return true;
            },
          },
        }),
        foldGutter(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        highlightSpecialChars(),
        highlightSelectionMatches(),
        history(),
        drawSelection(),
        dropCursor(),
        rectangularSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion({ override: [pythonCompletions], activateOnTyping: true }),
        python(),
        indentUnit.of('    '), // PEP 8, and it matches what students are taught
        EditorState.allowMultipleSelections.of(true),
        keymap.of([
          { key: 'Mod-Enter', run: () => (handlers.current.onRun(), true), preventDefault: true },
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
          ...completionKeymap,
          ...foldKeymap,
          indentWithTab,
        ]),
        markedLine,
        pylensEditorTheme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            handlers.current.onChange(update.state.doc.toString());
          }
          if (update.selectionSet || update.docChanged) {
            const head = update.state.selection.main.head;
            const line = update.state.doc.lineAt(head);
            handlers.current.onCursorChange(line.number, head - line.from + 1);
          }
        }),
      ],
    });

    const instance = new EditorView({ state, parent: host.current });
    view.current = instance;
    instance.focus();

    return () => {
      instance.destroy();
      view.current = null;
    };
    // initialSource is intentionally excluded: it seeds the document once, and
    // re-seeding on every keystroke would fight the user for the cursor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  useEffect(() => {
    const instance = view.current;
    if (!instance) return;

    instance.dispatch({ effects: setMarkedLine.of(marked) });

    if (marked && marked.line >= 1 && marked.line <= instance.state.doc.lines) {
      const position = instance.state.doc.line(marked.line).from;
      instance.dispatch({ effects: EditorView.scrollIntoView(position, { y: 'center' }) });
    }
  }, [marked]);

  return <div ref={host} className="h-full min-h-0 overflow-hidden" />;
}
