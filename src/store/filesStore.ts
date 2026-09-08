import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EditorFile {
  id: string;
  name: string;
  source: string;
}

const WELCOME = `# Welcome to PyLens. Press Run, or Ctrl/Cmd + Enter.

def greet(name):
    return f"Hello, {name}!"


students = ["Aarav", "Diya", "Kabir"]

for student in students:
    print(greet(student))

# Two names, one list. Watch what happens to 'students'.
roster = students
roster.append("Meera")
print(len(students), "students on the roster")
`;

const newId = () => `file-${Math.random().toString(36).slice(2, 9)}`;

interface FilesState {
  files: EditorFile[];
  activeId: string;
  /** Lines fed to input() when the program runs. */
  stdin: string;

  setSource: (id: string, source: string) => void;
  setActive: (id: string) => void;
  addFile: (name?: string) => void;
  renameFile: (id: string, name: string) => void;
  closeFile: (id: string) => void;
  setStdin: (stdin: string) => void;
}

/** Filenames have to be importable Python module names, plus the .py. */
export function normaliseFileName(raw: string, taken: string[]): string {
  let name = raw.trim().replace(/\.py$/i, '');
  name = name.replace(/[^A-Za-z0-9_]/g, '_').replace(/^(\d)/, '_$1');
  if (!name) name = 'untitled';

  let candidate = `${name}.py`;
  let counter = 2;
  while (taken.includes(candidate)) candidate = `${name}_${counter++}.py`;
  return candidate;
}

const firstFile: EditorFile = { id: newId(), name: 'main.py', source: WELCOME };

export const useFilesStore = create<FilesState>()(
  persist(
    (set, get) => ({
      files: [firstFile],
      activeId: firstFile.id,
      stdin: '',

      setSource: (id, source) =>
        set((state) => ({
          files: state.files.map((file) => (file.id === id ? { ...file, source } : file)),
        })),

      setActive: (activeId) => set({ activeId }),

      addFile: (name) =>
        set((state) => {
          const file: EditorFile = {
            id: newId(),
            name: normaliseFileName(
              name ?? `module_${state.files.length}`,
              state.files.map((f) => f.name)
            ),
            source: '',
          };
          return { files: [...state.files, file], activeId: file.id };
        }),

      renameFile: (id, name) =>
        set((state) => ({
          files: state.files.map((file) =>
            file.id === id
              ? {
                  ...file,
                  name: normaliseFileName(
                    name,
                    state.files.filter((f) => f.id !== id).map((f) => f.name)
                  ),
                }
              : file
          ),
        })),

      closeFile: (id) => {
        const { files, activeId } = get();
        // Never leave the workspace with nothing to edit.
        if (files.length === 1) return;

        const index = files.findIndex((file) => file.id === id);
        const remaining = files.filter((file) => file.id !== id);
        set({
          files: remaining,
          activeId:
            activeId === id
              ? (remaining[Math.min(index, remaining.length - 1)]?.id ?? '')
              : activeId,
        });
      },

      setStdin: (stdin) => set({ stdin }),
    }),
    { name: 'pylens.files', version: 1 }
  )
);

/** The file the Run button executes. */
export function selectActiveFile(state: FilesState): EditorFile {
  return state.files.find((file) => file.id === state.activeId) ?? state.files[0];
}
