import type { HeapObject, PyValue } from '@/lib/trace/types';
import { isReference } from '@/lib/trace/types';
import { summarise } from '@/lib/trace/describe';

/** Colour by Python type, reusing the editor's syntax palette so the two agree. */
function primitiveClass(type: string): string {
  if (type === 'str') return 'text-[var(--c-syn-string)]';
  if (type === 'NoneType' || type === 'bool') return 'text-[var(--c-syn-keyword)]';
  if (type === 'int' || type === 'float' || type === 'complex') return 'text-[var(--c-syn-number)]';
  return 'text-fg';
}

interface ValueChipProps {
  value: PyValue;
  heap: Record<string, HeapObject>;
  /** Marks this chip as the tail of a reference arrow. */
  anchor?: string;
}

/**
 * One value, rendered the way its type deserves.
 *
 * Immutable scalars are printed in place; anything on the heap becomes a pill
 * that says what it points at, because "points at" is the idea being taught.
 */
export function ValueChip({ value, heap, anchor }: ValueChipProps) {
  if (!isReference(value)) {
    return <span className={`font-mono text-[0.88em] ${primitiveClass(value.t)}`}>{value.r}</span>;
  }

  const object = heap[value.id];

  return (
    <span
      data-anchor={anchor}
      className="inline-flex items-center gap-1 rounded border border-heap/40 bg-heap-soft px-1.5 py-0.5 font-mono text-[0.8em] text-heap"
    >
      <span aria-hidden="true">→</span>
      {summarise(object)}
    </span>
  );
}

/** `name = value` row, used inside frames and object cards alike. */
export function NameValueRow({
  name,
  value,
  heap,
  anchor,
  highlighted = false,
}: {
  name: string;
  value: PyValue;
  heap: Record<string, HeapObject>;
  anchor?: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline gap-2 rounded px-1.5 py-0.5 ${
        highlighted ? 'bg-accent-soft' : ''
      }`}
    >
      <span className="font-mono text-[0.85em] text-fg">{name}</span>
      <span className="text-subtle">=</span>
      <ValueChip value={value} heap={heap} anchor={anchor} />
    </div>
  );
}
