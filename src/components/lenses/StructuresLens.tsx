import { useMemo } from 'react';
import { HeapCard } from './shared/HeapCard';
import { LensEmpty } from './shared/LensEmpty';
import { reachableObjects, referenceCounts } from '@/lib/trace/lensData';
import type { LensProps } from './types';

const CONTAINER_KINDS = new Set(['sequence', 'mapping']);

/**
 * Lists, tuples, sets and dictionaries, drawn the way they behave.
 *
 * A list gets numbered cells because its positions are real; a set does not,
 * because its order is an implementation detail that students otherwise learn to
 * trust. Same trace as every other lens — only the emphasis changes.
 */
export function StructuresLens({ step }: LensProps) {
  const containers = useMemo(
    () => reachableObjects(step).filter((object) => CONTAINER_KINDS.has(object.kind)),
    [step]
  );
  const pointers = useMemo(() => referenceCounts(step), [step]);

  if (containers.length === 0) {
    return (
      <LensEmpty
        headline="No collections at this step"
        detail="Build a list, tuple, set or dictionary and it is drawn here, with its positions, keys and contents laid out."
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-3">
      {containers.map((object) => (
        <HeapCard
          key={object.id}
          object={object}
          heap={step.heap}
          names={(pointers.get(object.id) ?? []).map((binding) => binding.name)}
        />
      ))}
    </div>
  );
}
