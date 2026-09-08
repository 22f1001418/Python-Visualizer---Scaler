import { useMemo } from 'react';
import { HeapCard } from './shared/HeapCard';
import { LensEmpty } from './shared/LensEmpty';
import { reachableObjects, referenceCounts } from '@/lib/trace/lensData';
import type { LensProps } from './types';

/**
 * Classes and the objects made from them.
 *
 * Classes are shown apart from their instances so the split is obvious: the
 * class holds what every object of that type shares, and each instance holds
 * only its own attributes. `self` is drawn as what it is — a name for the
 * instance the method was called on.
 */
export function ObjectsLens({ step }: LensProps) {
  const objects = useMemo(() => reachableObjects(step), [step]);
  const pointers = useMemo(() => referenceCounts(step), [step]);

  const classes = objects.filter((object) => object.kind === 'class');
  const instances = objects.filter((object) => object.kind === 'instance');

  if (classes.length === 0 && instances.length === 0) {
    return (
      <LensEmpty
        headline="No classes or objects yet"
        detail="Define a class and create an object from it, and both appear here side by side."
      />
    );
  }

  const namesOf = (id: string) => (pointers.get(id) ?? []).map((binding) => binding.name);

  return (
    <div className="grid h-full gap-4 overflow-auto p-3 md:grid-cols-2">
      <section className="flex flex-col gap-2">
        <h3 className="text-[0.75em] font-semibold tracking-wide text-subtle uppercase">
          Classes — shared by every object of the type
        </h3>
        {classes.length > 0 ? (
          classes.map((object) => (
            <HeapCard key={object.id} object={object} heap={step.heap} names={namesOf(object.id)} />
          ))
        ) : (
          <p className="text-[0.82em] text-subtle italic">none at this step</p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-[0.75em] font-semibold tracking-wide text-subtle uppercase">
          Objects — each with its own attributes
        </h3>
        {instances.length > 0 ? (
          instances.map((object) => (
            <HeapCard key={object.id} object={object} heap={step.heap} names={namesOf(object.id)} />
          ))
        ) : (
          <p className="text-[0.82em] text-subtle italic">
            none yet — calling the class, like Dog(&quot;Bruno&quot;), makes one
          </p>
        )}
      </section>
    </div>
  );
}
