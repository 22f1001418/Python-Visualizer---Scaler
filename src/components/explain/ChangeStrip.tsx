import { ValueChip } from '@/components/lenses/shared/values';
import type { NameChange } from '@/lib/trace/story';
import type { HeapObject } from '@/lib/trace/types';

/**
 * What the previous line actually did.
 *
 * A memory diagram shows where things stand; it never shows what moved. This
 * strip is the difference between two moments, which is the thing a beginner is
 * trying to work out every time they press the arrow key.
 */
export function ChangeStrip({
  changes,
  heap,
}: {
  changes: NameChange[];
  heap: Record<string, HeapObject>;
}) {
  if (changes.length === 0) return null;

  return (
    <div className="rounded-lg border border-line bg-panel p-2.5">
      <p className="text-[0.75em] tracking-wide text-subtle uppercase">what just changed</p>

      <div className="mt-1.5 flex flex-col gap-1">
        {changes.map((change) => (
          <div key={`${change.frameId}:${change.name}`} className="flex items-center gap-2">
            <span className="font-mono text-[0.92em] text-fg">{change.name}</span>

            {change.before ? (
              <>
                <span className="opacity-60">
                  <ValueChip value={change.before} heap={heap} />
                </span>
                <span className="text-subtle" aria-label="becomes">
                  →
                </span>
              </>
            ) : (
              <span className="text-[0.8em] text-subtle">is new —</span>
            )}

            <ValueChip value={change.after} heap={heap} />
          </div>
        ))}
      </div>
    </div>
  );
}
