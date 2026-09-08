import { useEffect } from 'react';
import { useTraceStore } from '@/store/traceStore';
import { useUiStore } from '@/store/uiStore';

/**
 * Global keys for the shell and the timeline.
 *
 * Presenter mode and stepping both get keys because reaching for a mouse in
 * front of a class is exactly the friction this app exists to remove.
 *
 *   Ctrl/Cmd + Shift + P   presenter mode
 *   Ctrl/Cmd + Shift + L   light / dark
 *   left / right           previous / next step
 *   Home / End             first / last step
 *   Space                  play / pause
 *   Escape                 leave presenter mode
 */

/** Typing in the editor or a text box must never scrub the timeline. */
function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest('.cm-editor, input:not([type="range"]), textarea, [contenteditable="true"]') !==
      null
  );
}

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
        return;
      }

      const trace = useTraceStore.getState();
      if (!trace.trace || mod || event.altKey || isTyping(event.target)) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          trace.pause();
          trace.stepBy(-1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          trace.pause();
          trace.stepBy(1);
          break;
        case 'Home':
          event.preventDefault();
          trace.toStart();
          break;
        case 'End':
          event.preventDefault();
          trace.toEnd();
          break;
        case ' ':
          event.preventDefault();
          trace.togglePlay();
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
