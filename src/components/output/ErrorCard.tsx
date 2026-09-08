import { useState } from 'react';
import { explainError } from '@/lib/friendlyErrors';
import type { PyError } from '@/lib/runtime/protocol';

/**
 * The error, said twice: once in plain English, and once as the real traceback
 * behind a disclosure.
 *
 * Students need the first to fix the bug today and the second to survive outside
 * PyLens, so neither one is allowed to replace the other.
 */
export function ErrorCard({ error }: { error: PyError }) {
  const friendly = explainError(error);
  const [showTraceback, setShowTraceback] = useState(false);
  const stopped = error.type === 'KeyboardInterrupt';

  return (
    <div
      className={`m-3 overflow-hidden rounded-lg border ${
        stopped ? 'border-warn/40 bg-warn-soft' : 'border-error/40 bg-error-soft'
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-3 pt-2.5">
        <span className={`text-[0.95em] font-semibold ${stopped ? 'text-warn' : 'text-error'}`}>
          {friendly.title}
        </span>
        {error.line !== null ? (
          <span className="text-[0.82em] text-muted">
            {error.file ? `${error.file}, ` : ''}line {error.line}
          </span>
        ) : null}
        <span className="ml-auto rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[0.75em] text-muted">
          {error.type}
        </span>
      </div>

      <p className="px-3 pt-1.5 text-[0.9em] leading-relaxed text-fg">{friendly.plain}</p>

      {friendly.hint ? (
        <p className="px-3 pt-1.5 text-[0.85em] leading-relaxed text-muted">{friendly.hint}</p>
      ) : null}

      {error.traceback ? (
        <div className="px-3 pt-2 pb-2.5">
          <button
            type="button"
            className="text-[0.8em] text-muted underline underline-offset-2 hover:text-fg"
            onClick={() => setShowTraceback((value) => !value)}
          >
            {showTraceback ? 'Hide' : 'Show'} the real traceback
          </button>

          {showTraceback ? (
            <pre className="mt-2 overflow-x-auto rounded border border-line bg-panel p-2.5 font-mono text-[0.8em] leading-relaxed whitespace-pre text-muted">
              {error.traceback}
            </pre>
          ) : null}
        </div>
      ) : (
        <div className="pb-2.5" />
      )}
    </div>
  );
}
