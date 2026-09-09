import { useEffect } from 'react';
import { decodeShare, readShareToken } from '@/lib/share';
import { useFilesStore } from '@/store/filesStore';
import { useNotesStore } from '@/store/notesStore';
import { useRunStore } from '@/store/runStore';
import { useTraceStore } from '@/store/traceStore';
import { useUiStore } from '@/store/uiStore';

/**
 * Opens a shared lesson when the page carries one in its URL.
 *
 * Runs on load, and again whenever the fragment changes: pasting a link into a
 * tab that already has PyLens open is a same-document navigation, so without the
 * hashchange listener the link would appear to do nothing at all.
 *
 * A link always wins over the saved workspace, which is what someone clicking
 * one expects.
 */
export function useSharedWorkspace(): void {
  useEffect(() => {
    let applied: string | null = null;
    let cancelled = false;

    const apply = async () => {
      const token = readShareToken();
      if (!token || token === applied) return;

      const payload = await decodeShare(token);
      if (cancelled || !payload) return;
      applied = token;

      useFilesStore.getState().loadWorkspace(
        payload.files.map((file) => ({ name: file.n, source: file.s })),
        payload.i ?? ''
      );

      const notes: Record<number, string> = {};
      for (const [key, text] of Object.entries(payload.t ?? {})) notes[Number(key)] = text;
      useNotesStore.getState().replaceAll(notes);

      // The previous run belongs to the previous program.
      useTraceStore.getState().clear();
      useRunStore.getState().clearOutput();

      if (payload.l) useUiStore.getState().setLens(payload.l as never);
    };

    void apply();
    const onHashChange = () => void apply();
    window.addEventListener('hashchange', onHashChange);

    return () => {
      cancelled = true;
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);
}
