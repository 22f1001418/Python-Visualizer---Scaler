import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import { Prec, type Extension } from '@codemirror/state';

/**
 * CodeMirror styling, expressed entirely in the app's CSS variables.
 *
 * Because every colour is a var(), switching theme or entering presenter mode
 * restyles the editor with no React work and no editor rebuild — the browser
 * just re-resolves the variables.
 */
const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'var(--c-bg-panel)',
    color: 'var(--c-text)',
    fontSize: 'calc(13.5px * var(--ui-scale))',
  },
  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    lineHeight: '1.65',
    overflow: 'auto',
  },
  '.cm-content': {
    padding: '10px 0 40vh 0', // trailing space so the last line can sit mid-screen
    caretColor: 'var(--c-accent)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--c-bg-panel)',
    color: 'var(--c-editor-gutter)',
    border: 'none',
    paddingRight: '4px',
  },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px 0 12px', minWidth: '2.6em' },
  '.cm-activeLine': { backgroundColor: 'var(--c-editor-active-line)' },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--c-editor-active-line)',
    color: 'var(--c-text-muted)',
  },
  '.cm-cursor, .cm-dropCursor': { borderLeftWidth: '2px', borderLeftColor: 'var(--c-accent)' },
  // CodeMirror ships its own built-in default selection colours (a hardcoded
  // light-grey/lavender fallback theme, since we never opt into { dark: true })
  // via a selector like ".cm-focused > .cm-scroller > .cm-selectionLayer
  // .cm-selectionBackground" — specific enough to beat a plain override, so it
  // silently wins regardless of our --c-editor-selection variable. !important
  // settles that regardless of how CM's internals evolve.
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--c-editor-selection) !important',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
    backgroundColor: 'var(--c-accent-soft)',
    color: 'inherit',
    outline: '1px solid var(--c-accent)',
  },
  '.cm-nonmatchingBracket': { color: 'var(--c-error)' },
  '.cm-tooltip': {
    backgroundColor: 'var(--c-bg-elevated)',
    border: '1px solid var(--c-border-strong)',
    borderRadius: '6px',
    boxShadow: 'var(--shadow-panel)',
    color: 'var(--c-text)',
  },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--c-accent)',
    color: 'var(--c-accent-fg)',
  },
  '.cm-panels': { backgroundColor: 'var(--c-bg-elevated)', color: 'var(--c-text)' },
  '.cm-searchMatch': { backgroundColor: 'var(--c-warn-soft)', outline: '1px solid var(--c-warn)' },
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--c-bg-inset)',
    border: '1px solid var(--c-border)',
    color: 'var(--c-text-muted)',
  },
});

const highlightStyle = HighlightStyle.define([
  { tag: [t.keyword, t.moduleKeyword, t.controlKeyword], color: 'var(--c-syn-keyword)' },
  { tag: [t.string, t.special(t.string)], color: 'var(--c-syn-string)' },
  { tag: [t.number, t.bool, t.null], color: 'var(--c-syn-number)' },
  {
    tag: [t.comment, t.lineComment, t.blockComment],
    color: 'var(--c-syn-comment)',
    fontStyle: 'italic',
  },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--c-syn-function)' },
  { tag: [t.definition(t.variableName), t.definition(t.propertyName)], color: 'var(--c-text)' },
  { tag: [t.className, t.typeName], color: 'var(--c-syn-builtin)', fontWeight: '600' },
  { tag: [t.standard(t.variableName), t.self], color: 'var(--c-syn-builtin)' },
  { tag: [t.operator, t.operatorKeyword, t.punctuation], color: 'var(--c-syn-operator)' },
  { tag: [t.meta, t.annotation], color: 'var(--c-syn-decorator)' },
  { tag: t.invalid, color: 'var(--c-error)' },
]);

// CodeMirror's drawSelection() extension hides native text selection and
// draws its own overlay instead — except while the editor is focused, when it
// deliberately shows the real native ::selection using the browser/OS
// "Highlight" system color (Prec.highest, !important) so a11y tooling sees a
// real selection. That system color is often a bright, undimmed blue/lavender
// that ignores our theme entirely, which is exactly the "too bright" report.
//
// Both that rule and this one land in the stylesheet at Prec.highest, so
// which one wins the tie comes down to insertion order — and CM's own rule
// is inserted after ours, so it won. Rather than fight that ordering, this
// rule outguns it on plain CSS specificity by repeating each class/pseudo
// (".cm-content.cm-content", ":focus:focus"), which matches the exact same
// element but counts as more selectors — so it wins regardless of order.
const nativeSelectionColor = Prec.highest(
  EditorView.theme({
    '.cm-line.cm-line': {
      '&::selection, & ::selection': { backgroundColor: 'var(--c-editor-selection) !important' },
    },
    '.cm-content.cm-content': {
      '& :focus:focus': {
        '&::selection, & ::selection': {
          backgroundColor: 'var(--c-editor-selection) !important',
        },
      },
    },
  }),
);

export const pylensEditorTheme: Extension = [
  editorTheme,
  syntaxHighlighting(highlightStyle),
  nativeSelectionColor,
];
