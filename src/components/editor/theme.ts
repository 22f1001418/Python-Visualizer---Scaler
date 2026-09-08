import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import type { Extension } from '@codemirror/state';

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
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--c-editor-selection)',
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

export const pylensEditorTheme: Extension = [editorTheme, syntaxHighlighting(highlightStyle)];
