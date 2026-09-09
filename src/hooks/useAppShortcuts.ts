import { useEffect } from 'react';
import { useTraceStore } from '@/store/traceStore';
import { useUiStore } from '@/store/uiStore';

/**
 * Global keys for the shell, the timeline and the teaching tools.
 *
 * Presenter mode hides the buttons, so everything that matters mid-class has a
 * key. Single letters are deliberately unmodified — they are meant to be
 * reachable one-handed while talking.
 *
 *   Ctrl/Cmd + Shift + P   presenter mode        left / right   step
 *   Ctrl/Cmd + Shift + L   light / dark          Home / End     first / last
 *   N  note this step      P  predict            Space          play / pause
 *   L  lessons             ?  shortcuts          Escape         close
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
      const ui = useUiStore.getState();

      if (mod && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        ui.togglePresenter();
        return;
      }

      if (mod && event.shiftKey && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        ui.toggleTheme();
        return;
      }

      // Escape unwinds one layer at a time, innermost first.
      if (event.key === 'Escape') {
        if (ui.helpOpen) ui.setHelpOpen(false);
        else if (ui.lessonsOpen) ui.setLessonsOpen(false);
        else if (ui.noteEditing) ui.setNoteEditing(false);
        else if (ui.presenter) ui.setPresenter(false);
        return;
      }

      if (mod || event.altKey || isTyping(event.target)) return;

      const trace = useTraceStore.getState();

      switch (event.key) {
        case '?':
          event.preventDefault();
          ui.toggleHelp();
          return;
        case 'l':
        case 'L':
          event.preventDefault();
          ui.setLessonsOpen(!ui.lessonsOpen);
          return;
        case 'p':
        case 'P':
          event.preventDefault();
          ui.togglePredict();
          return;
        case 'n':
        case 'N':
          if (!trace.trace) return;
          event.preventDefault();
          ui.setNoteEditing(true);
          return;
      }

      if (!trace.trace) return;

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
