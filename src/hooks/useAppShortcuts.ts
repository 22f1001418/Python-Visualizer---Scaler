import { useEffect } from 'react';
import { useUiStore } from '@/store/uiStore';

/**
 * Global keys for the shell. Presenter mode gets one because reaching for a
 * mouse in front of a class is exactly the friction this app exists to remove.
 *
 *   Ctrl/Cmd + Shift + P   presenter mode
 *   Ctrl/Cmd + Shift + L   light / dark
 *   Escape                 leave presenter mode
 */
export function useAppShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      const { presenter, togglePresenter, toggleTheme, setPresenter } = useUiStore.getState();

      if (mod && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        togglePresenter();
        return;
      }

      if (mod && event.shiftKey && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        toggleTheme();
        return;
      }

      if (event.key === 'Escape' && presenter) {
        setPresenter(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
