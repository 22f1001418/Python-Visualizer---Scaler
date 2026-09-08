import { useMemo, useRef } from 'react';
import { HeapCard } from './shared/HeapCard';
import { ValueChip } from './shared/values';
import { LensEmpty } from './shared/LensEmpty';
import { useConnectors, type Connector } from './shared/useConnectors';
import { bindingsOf, heapEdges, reachableObjects, referenceCounts } from '@/lib/trace/lensData';
import { isReference } from '@/lib/trace/types';
import type { LensProps } from './types';

/**
 * Names on the left, objects on the right, arrows in between.
 *
 * This is the lens the tool exists for. A student who believes `b = a` copies
 * the list looks at two arrows landing on one box and stops believing it. Every
 * other lens is a specialisation of this picture.
 */
export function MemoryLens({ step }: LensProps) {
  const host = useRef<HTMLDivElement>(null);

  const bindings = useMemo(() => bindingsOf(step), [step]);
  const objects = useMemo(() => reachableObjects(step), [step]);
  const pointers = useMemo(() => referenceCounts(step), [step]);

  const connectors = useMemo<Connector[]>(() => {
    const fromNames: Connector[] = bindings
      .filter((binding) => isReference(binding.value))
      .map((binding) => ({
        key: `name:${binding.key}`,
        from: binding.key,
        to: (binding.value as { id: string }).id,
        emphasis: (pointers.get((binding.value as { id: string }).id)?.length ?? 0) > 1,
      }));

    // Objects point at objects too — a list of lists is a picture, not a rule.
    const fromObjects: Connector[] = heapEdges(objects).map((edge) => ({
      key: `heap:${edge.from}->${edge.to}`,
      from: `obj:${edge.from}`,
      to: edge.to,
    }));

    return [...fromNames, ...fromObjects];
  }, [bindings, objects, pointers]);

  const paths = useConnectors(host, connectors, step.i);
  const shared = [...pointers.values()].filter((names) => names.length > 1);

  if (objects.length === 0) {
    return (
      <LensEmpty
        headline="Nothing on the heap yet"
        detail="Numbers, text and booleans are stored with the name itself. Make a list, a dictionary or an object and it appears here with an arrow pointing at it."
      />
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div ref={host} className="relative min-h-full p-3">
        <svg className="pointer-events-none absolute inset-0 size-full overflow-visible">
          <defs>
            <marker
              id="pl-arrowhead"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--c-ref-arrow)" />
            </marker>
          </defs>

          {paths.map((path) => (
            <path
              key={path.key}
              d={path.d}
              fill="none"
              stroke="var(--c-ref-arrow)"
              strokeWidth={path.emphasis ? 2.2 : 1.4}
              strokeOpacity={path.emphasis ? 1 : 0.55}
              markerEnd="url(#pl-arrowhead)"
            />
          ))}
        </svg>

        <div className="relative grid grid-cols-[minmax(9rem,1fr)_minmax(11rem,1.35fr)] gap-x-10 gap-y-3">
          <div className="flex flex-col gap-2">
            <h3 className="text-[0.75em] font-semibold tracking-wide text-subtle uppercase">
              Names
            </h3>

            {step.frames.map((frame) => (
              <section key={frame.id} className="rounded-lg border border-line bg-panel">
                <header className="border-b border-line px-2.5 py-1 font-mono text-[0.8em] text-frame">
                  {frame.module ? frame.file : `${frame.name}()`}
                </header>
                <div className="flex flex-col gap-1 p-2">
                  {frame.locals.map(([name, value]) => (
                    <div
                      key={name}
                      data-anchor={`src:${frame.id}:${name}`}
                      className="flex items-baseline justify-between gap-2 rounded px-1 py-0.5"
                    >
                      <span className="font-mono text-[0.85em] text-fg">{name}</span>
                      {isReference(value) ? (
                        <span className="text-[0.8em] text-subtle">points at</span>
                      ) : (
                        <ValueChip value={value} heap={step.heap} />
                      )}
                    </div>
                  ))}
                  {frame.locals.length === 0 ? (
                    <p className="text-[0.78em] text-subtle italic">no variables yet</p>
                  ) : null}
                </div>
              </section>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-[0.75em] font-semibold tracking-wide text-subtle uppercase">
              Objects
            </h3>

            {objects.map((object) => (
              <div key={object.id} data-anchor={`src:obj:${object.id}`}>
                <HeapCard
                  object={object}
                  heap={step.heap}
                  names={(pointers.get(object.id) ?? []).map((binding) => binding.name)}
                  anchored
                />
              </div>
            ))}
          </div>
        </div>

        {shared.length > 0 ? (
          <p className="relative mt-3 rounded border border-frame/40 bg-frame-soft px-2.5 py-1.5 text-[0.82em] text-frame">
            {shared.map((names) => names.map((binding) => binding.name).join(' and ')).join('; ')}{' '}
            point at the same object. Change it through one name and the other sees the change too.
          </p>
        ) : null}
      </div>
    </div>
  );
}
