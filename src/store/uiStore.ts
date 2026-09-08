import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// Type-only import: erased at build time, so the store never pulls the lens
// components into its module graph.
import type { LensId } from '@/components/lenses/registry';

export type Theme = 'light' | 'dark';

interface UiState {
  theme: Theme;
  /** Presenter mode: bigger type, hidden chrome, projector contrast. */
  presenter: boolean;
  lens: LensId;
  /** Editor caret position, shown in the status bar. */
  cursor: { line: number; column: number };
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setPresenter: (on: boolean) => void;
  togglePresenter: () => void;
  setLens: (lens: LensId) => void;
  setCursor: (line: number, column: number) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'dark',
      presenter: false,
      lens: 'memory',
      cursor: { line: 1, column: 1 },
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setPresenter: (presenter) => set({ presenter }),
      togglePresenter: () => set((s) => ({ presenter: !s.presenter })),
      setLens: (lens) => set({ lens }),
      setCursor: (line, column) => set({ cursor: { line, column } }),
    }),
    {
      name: 'pylens.ui',
      // Presenter mode is a per-session decision, not something to restore on
      // the next launch — you don't want yesterday's lecture layout at your desk.
      partialize: ({ theme, lens }) => ({ theme, lens }),
    }
  )
);
