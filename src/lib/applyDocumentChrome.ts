import type { Theme } from '@/store/uiStore';

/** The two theme knobs live on <html> as attributes so plain CSS can react to
 *  them without React re-rendering the tree. */
export function applyDocumentChrome(theme: Theme, presenter: boolean): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  if (presenter) root.dataset.presenter = 'on';
  else delete root.dataset.presenter;
}
