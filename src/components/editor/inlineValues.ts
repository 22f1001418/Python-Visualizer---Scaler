import { Decoration, EditorView, WidgetType } from '@codemirror/view';
import { StateEffect, StateField } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import type { DecorationSet } from '@codemirror/view';

/**
 * The current line, shown again with its values filled in, right where the code
 * is.
 *
 * Without this the student's eyes travel between the editor and a panel on the
 * far side of the window for every single step. The whole point of substitution
 * is lost if you have to go and look for it.
 */
export const setInlineValues = StateEffect.define<{ line: number; text: string } | null>();

class ValuesWidget extends WidgetType {
  readonly text: string;

  constructor(text: string) {
    super();
    this.text = text;
  }

  eq(other: ValuesWidget) {
    return other.text === this.text;
  }

  toDOM() {
    const element = document.createElement('span');
    element.className = 'pl-inline-values';
    element.textContent = `  ${this.text}`;
    return element;
  }

  ignoreEvent() {
    return true;
  }
}

const inlineValuesField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, transaction) {
    decorations = decorations.map(transaction.changes);

    for (const effect of transaction.effects) {
      if (!effect.is(setInlineValues)) continue;

      if (effect.value === null || effect.value.line < 1) {
        decorations = Decoration.none;
        continue;
      }

      const { line, text } = effect.value;
      if (line > transaction.state.doc.lines) {
        decorations = Decoration.none;
        continue;
      }

      const target = transaction.state.doc.line(line);
      decorations = Decoration.set([
        Decoration.widget({ widget: new ValuesWidget(text), side: 1 }).range(target.to),
      ]);
    }

    return decorations;
  },
  provide: (field) => EditorView.decorations.from(field),
});

const inlineValuesTheme = EditorView.baseTheme({
  '.pl-inline-values': {
    color: 'var(--c-accent)',
    backgroundColor: 'var(--c-accent-soft)',
    borderRadius: '4px',
    padding: '0 6px',
    marginLeft: '10px',
    fontStyle: 'normal',
    whiteSpace: 'pre',
  },
});

export const inlineValues: Extension = [inlineValuesField, inlineValuesTheme];
