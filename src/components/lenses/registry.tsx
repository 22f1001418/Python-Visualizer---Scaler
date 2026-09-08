import type { ComponentType } from 'react';
import { GeneratorLens } from './GeneratorLens';
import { LoopLens } from './LoopLens';
import { MemoryLens } from './MemoryLens';
import { ObjectsLens } from './ObjectsLens';
import { StackLens } from './StackLens';
import { StructuresLens } from './StructuresLens';
import { analyseLoop } from '@/lib/trace/lensData';
import type { Trace } from '@/lib/trace/types';
import type { LensProps } from './types';

export type LensId = 'memory' | 'stack' | 'loop' | 'structures' | 'objects' | 'generator';

export interface LensDefinition {
  id: LensId;
  label: string;
  /** Shown as the tab's tooltip, and read aloud well enough to use in a lesson. */
  description: string;
  Component: ComponentType<LensProps>;
  /** Whether this run has anything for the lens to show. Drives the tab hints. */
  relevant: (trace: Trace) => boolean;
}

const anyStep = (trace: Trace, predicate: (kinds: Set<string>) => boolean): boolean =>
  trace.steps.some((step) => predicate(new Set(Object.values(step.heap).map((o) => o.kind))));

export const LENSES: LensDefinition[] = [
  {
    id: 'memory',
    label: 'Memory',
    description: 'Names on the left, objects on the right, arrows showing what points where.',
    Component: MemoryLens,
    relevant: (trace) => anyStep(trace, (kinds) => kinds.size > 0),
  },
  {
    id: 'stack',
    label: 'Call stack',
    description: 'Which function is running, who called it, and what each call is holding.',
    Component: StackLens,
    relevant: (trace) => trace.steps.some((step) => step.frames.length > 1),
  },
  {
    id: 'loop',
    label: 'Loop table',
    description: 'One row per pass through the loop, one column per variable.',
    Component: LoopLens,
    relevant: (trace) => analyseLoop(trace, trace.steps.length - 1) !== null,
  },
  {
    id: 'structures',
    label: 'Collections',
    description: 'Lists, tuples, sets and dictionaries drawn the way they actually behave.',
    Component: StructuresLens,
    relevant: (trace) => anyStep(trace, (kinds) => kinds.has('sequence') || kinds.has('mapping')),
  },
  {
    id: 'objects',
    label: 'Objects',
    description: 'Classes beside the objects made from them, and what each one owns.',
    Component: ObjectsLens,
    relevant: (trace) => anyStep(trace, (kinds) => kinds.has('class') || kinds.has('instance')),
  },
  {
    id: 'generator',
    label: 'Generators',
    description: 'Where a paused function stopped, and what it is still holding on to.',
    Component: GeneratorLens,
    relevant: (trace) => anyStep(trace, (kinds) => kinds.has('generator')),
  },
];

/** Falls back to the memory lens, including for ids saved by an older build. */
export function lensById(id: string): LensDefinition {
  return LENSES.find((lens) => lens.id === id) ?? LENSES[0];
}
