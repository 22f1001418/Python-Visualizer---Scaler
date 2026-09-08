import { Decoration, EditorView } from '@codemirror/view';
import { StateEffect, StateField } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import type { DecorationSet } from '@codemirror/view';

/**
 * Marks a single line in the editor.
 *
 * Phase 1 uses it for the line an exception came from. Phase 2 reuses the same
 * field for the line the trace scrubber is sitting on, which is why it takes a
 * CSS class rather than hardcoding the error styling.
 */
export const setMarkedLine = StateEffect.define<{ line: number; className: string } | null>();

const markedLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, transaction) {
    decorations = decorations.map(transaction.changes);

    for (const effect of transaction.effects) {
      if (!effect.is(setMarkedLine)) continue;

      if (effect.value === null) {
        decorations = Decoration.none;
        continue;
      }

      const { line, className } = effect.value;
      if (line < 1 || line > transaction.state.doc.lines) {
        decorations = Decoration.none;
        continue;
      }

      const from = transaction.state.doc.line(line).from;
      decorations = Decoration.set([Decoration.line({ class: className }).range(from)]);
    }

    return decorations;
  },
  provide: (field) => EditorView.decorations.from(field),
});

const markedLineTheme = EditorView.baseTheme({
  '.pl-error-line': {
    backgroundColor: 'var(--c-error-line)',
    boxShadow: 'inset 3px 0 0 var(--c-error)',
  },
  // The line the scrubber is on. Read from the back of a room, so it gets a
  // solid band rather than a tint.
  '.pl-current-line': {
    backgroundColor: 'var(--c-line-highlight)',
    boxShadow: 'inset 3px 0 0 var(--c-line-highlight-edge)',
  },
});

export const markedLine: Extension = [markedLineField, markedLineTheme];
