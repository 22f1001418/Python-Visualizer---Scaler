import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Notes pinned to steps of the timeline.
 *
 * A prepared lecture is a program plus the sentences you say at particular
 * moments in it. Keying by step index means a note is tied to *when* something
 * happens rather than to a line, which is what you want when a line runs twenty
 * times and only the fourth one matters.
 */
interface NotesState {
  notes: Record<number, string>;
  setNote: (stepIndex: number, text: string) => void;
  removeNote: (stepIndex: number) => void;
  replaceAll: (notes: Record<number, string>) => void;
  clear: () => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: {},

      setNote: (stepIndex, text) =>
        set((state) => {
          const trimmed = text.trim();
          const next = { ...state.notes };
          if (trimmed) next[stepIndex] = trimmed;
          else delete next[stepIndex];
          return { notes: next };
        }),

      removeNote: (stepIndex) =>
        set((state) => {
          const next = { ...state.notes };
          delete next[stepIndex];
          return { notes: next };
        }),

      replaceAll: (notes) => set({ notes }),
      clear: () => set({ notes: {} }),
    }),
    { name: 'pylens.notes', version: 1 }
  )
);

/** Step indices that carry a note, in order — used to mark the scrubber. */
export function annotatedSteps(notes: Record<number, string>): number[] {
  return Object.keys(notes)
    .map(Number)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
}
