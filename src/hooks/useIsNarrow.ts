import { useSyncExternalStore } from 'react';

/**
 * True on screens too small for the editor to be usable — phones, and a laptop
 * window shrunk to a third of the screen.
 *
 * Below this width PyLens stops pretending to be an IDE and becomes a viewer:
 * a share link opens, runs, and scrubs, but nobody types Python on a phone.
 */
const NARROW = '(max-width: 720px)';

const query = typeof window === 'undefined' ? null : window.matchMedia(NARROW);

function subscribe(onChange: () => void): () => void {
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
}

export function useIsNarrow(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => query?.matches ?? false,
    () => false
  );
}
