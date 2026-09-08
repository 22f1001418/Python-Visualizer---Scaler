import type { HeapObject } from './types';

/** A one-glance description of a heap object: `list[3]`, `dict{2}`, `Dog`. */
export function summarise(object: HeapObject | undefined): string {
  if (!object) return '?';

  switch (object.kind) {
    case 'sequence':
      return object.type === 'set' || object.type === 'frozenset'
        ? `${object.type}{${object.length}}`
        : `${object.type}[${object.length}]`;
    case 'mapping':
      return `${object.type}{${object.length}}`;
    case 'class':
      return `class ${object.name}`;
    case 'function':
      return `${object.name}()`;
    case 'generator':
      return `${object.name}(…)`;
    case 'instance':
      return object.type;
    default:
      return object.type;
  }
}
