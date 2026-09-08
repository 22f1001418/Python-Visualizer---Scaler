import type { HeapObject } from '@/lib/trace/types';
import { NameValueRow, ValueChip } from './values';

interface HeapCardProps {
  object: HeapObject;
  heap: Record<string, HeapObject>;
  /** Variable names currently bound to this object. */
  names?: string[];
  /** Renders as the head of an arrow when the memory lens is drawing them. */
  anchored?: boolean;
}

/**
 * One object on the heap.
 *
 * The header always says how many names point at it. That number is the point:
 * a card labelled "2 names" is the moment aliasing stops being abstract.
 */
export function HeapCard({ object, heap, names = [], anchored = false }: HeapCardProps) {
  const shared = names.length > 1;

  return (
    <div
      data-anchor={anchored ? `dst:${object.id}` : undefined}
      className={`rounded-lg border bg-panel ${
        shared ? 'border-frame shadow-[0_0_0_2px_var(--c-frame-soft)]' : 'border-line'
      }`}
    >
      <div className="flex items-baseline gap-2 border-b border-line px-2.5 py-1.5">
        <span className="font-mono text-[0.85em] font-semibold text-heap">{headline(object)}</span>
        {names.length > 0 ? (
          <span
            className={`ml-auto rounded px-1.5 py-0.5 text-[0.72em] ${
              shared ? 'bg-frame-soft font-medium text-frame' : 'text-subtle'
            }`}
          >
            {shared ? `${names.length} names: ` : ''}
            {names.join(', ')}
          </span>
        ) : null}
      </div>

      <div className="p-2">
        <ObjectBody object={object} heap={heap} />
      </div>
    </div>
  );
}

function headline(object: HeapObject): string {
  switch (object.kind) {
    case 'class':
      return `class ${object.name}`;
    case 'function':
      return `def ${object.name}`;
    case 'generator':
      return `generator ${object.name}`;
    case 'instance':
      return `${object.type} object`;
    default:
      return object.type;
  }
}

function ObjectBody({ object, heap }: { object: HeapObject; heap: Record<string, HeapObject> }) {
  switch (object.kind) {
    case 'sequence':
      return <SequenceBody object={object} heap={heap} />;

    case 'mapping':
      return (
        <div className="flex flex-col gap-0.5">
          {object.entries.map(([key, value], index) => (
            <div key={index} className="flex items-baseline gap-2">
              <ValueChip value={key} heap={heap} />
              <span className="text-subtle">:</span>
              <ValueChip value={value} heap={heap} />
            </div>
          ))}
          {object.truncated ? <Ellipsis total={object.length} /> : null}
          {object.entries.length === 0 ? <Empty label="empty dictionary" /> : null}
        </div>
      );

    case 'instance':
      return (
        <div className="flex flex-col gap-0.5">
          {object.attrs.map(([name, value]) => (
            <NameValueRow key={name} name={`self.${name}`} value={value} heap={heap} />
          ))}
          {object.attrs.length === 0 ? <Empty label="no attributes yet" /> : null}
        </div>
      );

    case 'class':
      return (
        <div className="flex flex-col gap-0.5">
          {object.bases.length > 0 ? (
            <p className="pb-1 text-[0.8em] text-muted">inherits from {object.bases.join(', ')}</p>
          ) : null}
          {object.attrs.map(([name, value]) => (
            <NameValueRow key={name} name={name} value={value} heap={heap} />
          ))}
          {object.attrs.length === 0 ? <Empty label="no class attributes" /> : null}
        </div>
      );

    case 'generator':
      return (
        <div className="flex flex-col gap-1">
          <p className="text-[0.8em] text-muted">
            {object.state === 'suspended'
              ? `paused at line ${object.line}`
              : object.state === 'created'
                ? 'not started yet'
                : object.state === 'closed'
                  ? 'finished'
                  : 'running'}
          </p>
          {object.locals.map(([name, value]) => (
            <NameValueRow key={name} name={name} value={value} heap={heap} />
          ))}
        </div>
      );

    case 'function':
      return <p className="font-mono text-[0.82em] text-muted">a function object</p>;

    default:
      return <p className="font-mono text-[0.82em] break-all text-muted">{object.repr}</p>;
  }
}

function SequenceBody({
  object,
  heap,
}: {
  object: Extract<HeapObject, { kind: 'sequence' }>;
  heap: Record<string, HeapObject>;
}) {
  if (object.items.length === 0) return <Empty label={`empty ${object.type}`} />;

  return (
    <div>
      <div className="flex flex-wrap items-start gap-1">
        {object.items.map((item, index) => (
          <div key={index} className="flex flex-col items-center gap-0.5">
            <div className="min-w-9 rounded border border-line bg-inset px-1.5 py-1 text-center">
              <ValueChip value={item} heap={heap} />
            </div>
            {/* Indices are drawn only where they mean something. A set has no
                order, and labelling it 0,1,2 would teach the wrong thing. */}
            {object.ordered ? (
              <span className="font-mono text-[0.68em] text-subtle">{index}</span>
            ) : null}
          </div>
        ))}
        {object.truncated ? <Ellipsis total={object.length} /> : null}
      </div>

      {!object.ordered ? (
        <p className="pt-1.5 text-[0.75em] text-subtle italic">
          A {object.type} has no order — the arrangement here means nothing.
        </p>
      ) : null}
      {object.type === 'tuple' ? (
        <p className="pt-1.5 text-[0.75em] text-subtle italic">
          A tuple cannot be changed once it exists.
        </p>
      ) : null}
    </div>
  );
}

const Ellipsis = ({ total }: { total: number }) => (
  <span className="self-center px-1 text-[0.78em] text-subtle">… {total} in total</span>
);

const Empty = ({ label }: { label: string }) => (
  <p className="text-[0.8em] text-subtle italic">{label}</p>
);
