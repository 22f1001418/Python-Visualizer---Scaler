import { useEffect, useState } from 'react';
import type { Beat } from '@/lib/trace/story';

const REVEAL_MS = 550;

/**
 * The line, then the same line with its values filled in, then what it produced.
 *
 * Revealed one beat at a time, because the substitution *is* the explanation:
 * seeing `total = total + n` become `total = 12 + 15` become `total = 27` is the
 * moment the arithmetic stops being symbols. Clicking skips to the end for
 * anyone who has already got it.
 */
export function BeatStack({ beats, stepKey }: { beats: Beat[]; stepKey: number }) {
  const [shown, setShown] = useState(1);

  useEffect(() => {
    const instant =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (instant || beats.length <= 1) {
      setShown(beats.length);
      return;
    }

    setShown(1);
    const timers = beats
      .slice(1)
      .map((_beat, index) => window.setTimeout(() => setShown(index + 2), REVEAL_MS * (index + 1)));
    return () => timers.forEach(window.clearTimeout);
  }, [stepKey, beats.length, beats]);

  if (beats.length === 0) return null;

  return (
    <button
      type="button"
      onClick={() => setShown(beats.length)}
      className="flex w-full cursor-default flex-col items-start gap-2 text-left"
      aria-label="Show the whole line at once"
    >
      {beats.slice(0, shown).map((beat, index) => (
        <div key={`${stepKey}-${index}`} className="w-full">
          <p className="mb-1 text-[0.75em] tracking-wide text-subtle uppercase">{beat.label}</p>
          <p
            className={[
              'w-full overflow-x-auto rounded-lg border px-3 py-2 font-mono text-[1.15em] whitespace-pre',
              beat.kind === 'source'
                ? 'border-line bg-inset text-fg'
                : beat.kind === 'values'
                  ? 'border-accent/40 bg-accent-soft text-fg'
                  : 'border-ok/40 bg-ok-soft text-fg',
            ].join(' ')}
          >
            {beat.text}
          </p>
        </div>
      ))}

      {shown < beats.length ? <span className="text-[0.75em] text-subtle">…</span> : null}
    </button>
  );
}
