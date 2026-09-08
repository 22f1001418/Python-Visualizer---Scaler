import { useState } from 'react';
import { useFilesStore } from '@/store/filesStore';

/**
 * Pre-supplied stdin.
 *
 * Real blocking input() needs SharedArrayBuffer plumbing that arrives in phase 4.
 * For a lecture this is arguably the better interaction anyway: the inputs are
 * visible on screen the whole time instead of vanishing into a prompt.
 */
export function StdinBox() {
  const stdin = useFilesStore((s) => s.stdin);
  const setStdin = useFilesStore((s) => s.setStdin);
  const [open, setOpen] = useState(false);

  const lineCount = stdin ? stdin.replace(/\n$/, '').split('\n').length : 0;

  return (
    <div className="shrink-0 border-t border-line bg-panel">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-1.5 text-[0.78em] tracking-wide text-muted uppercase hover:text-fg"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
        Input
        <span className="ml-auto text-[0.95em] normal-case tracking-normal text-subtle">
          {lineCount === 0 ? 'empty' : `${lineCount} line${lineCount === 1 ? '' : 's'}`}
        </span>
      </button>

      {open ? (
        <div className="px-3 pb-3">
          <textarea
            value={stdin}
            onChange={(event) => setStdin(event.target.value)}
            rows={4}
            spellCheck={false}
            placeholder={'One line per input() call.\nAarav\n42'}
            className="w-full resize-y rounded-md border border-line bg-inset px-2.5 py-2 font-mono text-[0.9em] text-fg placeholder:text-subtle focus:border-accent focus:outline-none"
          />
        </div>
      ) : null}
    </div>
  );
}
