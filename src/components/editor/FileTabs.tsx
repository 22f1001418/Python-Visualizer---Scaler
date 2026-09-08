import { useState } from 'react';
import { useFilesStore } from '@/store/filesStore';

/**
 * File tabs. Every open file is written into Pyodide's filesystem before a run,
 * so a second tab named `helpers.py` really is importable from `main.py` — which
 * is how you demonstrate modules without leaving the browser.
 */
export function FileTabs() {
  const files = useFilesStore((s) => s.files);
  const activeId = useFilesStore((s) => s.activeId);
  const setActive = useFilesStore((s) => s.setActive);
  const addFile = useFilesStore((s) => s.addFile);
  const closeFile = useFilesStore((s) => s.closeFile);
  const renameFile = useFilesStore((s) => s.renameFile);

  const [renamingId, setRenamingId] = useState<string | null>(null);

  return (
    <div className="flex h-8 shrink-0 items-stretch overflow-x-auto border-b border-line bg-inset">
      {files.map((file) => {
        const isActive = file.id === activeId;

        return (
          <div
            key={file.id}
            className={[
              'group flex shrink-0 items-center gap-1.5 border-r border-line px-3 text-[0.85em]',
              isActive
                ? 'bg-panel text-fg shadow-[inset_0_2px_0_var(--c-accent)]'
                : 'text-muted hover:bg-hover hover:text-fg',
            ].join(' ')}
          >
            {renamingId === file.id ? (
              <input
                autoFocus
                defaultValue={file.name.replace(/\.py$/, '')}
                className="w-24 bg-transparent font-mono outline-none"
                onBlur={(event) => {
                  renameFile(file.id, event.target.value);
                  setRenamingId(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur();
                  if (event.key === 'Escape') setRenamingId(null);
                }}
              />
            ) : (
              <button
                type="button"
                className="font-mono"
                onClick={() => setActive(file.id)}
                onDoubleClick={() => setRenamingId(file.id)}
                title="Double-click to rename"
              >
                {file.name}
              </button>
            )}

            {files.length > 1 ? (
              <button
                type="button"
                aria-label={`Close ${file.name}`}
                className="rounded px-1 text-subtle opacity-0 transition hover:bg-active hover:text-fg group-hover:opacity-100"
                onClick={() => closeFile(file.id)}
              >
                ×
              </button>
            ) : null}
          </div>
        );
      })}

      <button
        type="button"
        aria-label="New file"
        title="New file"
        className="shrink-0 px-3 text-muted hover:bg-hover hover:text-fg"
        onClick={() => addFile()}
      >
        +
      </button>
    </div>
  );
}
