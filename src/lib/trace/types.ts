/**
 * The recorded shape of a run.
 *
 * Field names are short because a two-thousand-step trace is serialised on every
 * run and the JSON crosses a worker boundary; the accessors below give them
 * readable names on this side. Every lens in phase 3 reads these types, so treat
 * changes here as breaking.
 */

/** A value small and immutable enough to show inline, next to its variable. */
export interface PrimitiveValue {
  k: 'prim';
  /** Python type name: int, str, NoneType, … */
  t: string;
  /** Python's own repr, truncated. */
  r: string;
}

/** A pointer into the heap. Two of these with the same id are the same object. */
export interface ReferenceValue {
  k: 'ref';
  id: string;
}

export type PyValue = PrimitiveValue | ReferenceValue;

interface HeapBase {
  id: string;
  /** Python type name: list, dict, Dog, … */
  type: string;
}

export interface SequenceObject extends HeapBase {
  kind: 'sequence';
  /** false for sets, whose order means nothing and must not be drawn as if it did. */
  ordered: boolean;
  items: PyValue[];
  truncated: boolean;
  length: number;
}

export interface MappingObject extends HeapBase {
  kind: 'mapping';
  entries: Array<[PyValue, PyValue]>;
  truncated: boolean;
  length: number;
}

export interface InstanceObject extends HeapBase {
  kind: 'instance';
  attrs: Array<[string, PyValue]>;
}

export interface ClassObject extends HeapBase {
  kind: 'class';
  name: string;
  bases: string[];
  attrs: Array<[string, PyValue]>;
}

export interface FunctionObject extends HeapBase {
  kind: 'function';
  name: string;
}

export interface OpaqueObject extends HeapBase {
  kind: 'opaque';
  repr: string;
}

export type HeapObject =
  SequenceObject | MappingObject | InstanceObject | ClassObject | FunctionObject | OpaqueObject;

export interface TraceFrame {
  id: number;
  /** Function name, or '<module>' for the top level. */
  name: string;
  file: string;
  line: number;
  module: boolean;
  locals: Array<[string, PyValue]>;
}

export type TraceEvent = 'call' | 'line' | 'return' | 'exception';

export interface TraceStep {
  i: number;
  e: TraceEvent;
  file: string;
  /** 1-based line that is *about to* execute. */
  line: number;
  /** Outermost first; the last entry is the frame currently executing. */
  frames: TraceFrame[];
  /** Only the objects reachable from this step's frames. */
  heap: Record<string, HeapObject>;
  /** Characters of stdout written by this point — used to replay output. */
  out: number;
  /** The returned value, on a 'return' step. */
  ret?: PyValue;
  exc?: { type: string; message: string };
}

export interface Trace {
  steps: TraceStep[];
  /** True when recording stopped early; the program still ran to the end. */
  capped: boolean;
  capReason: 'steps' | 'time' | null;
  entry: string;
}

/** The frame that is executing at this step. */
export function activeFrame(step: TraceStep): TraceFrame | undefined {
  return step.frames[step.frames.length - 1];
}

/** Human label for a frame: `greet()` or `main.py`. */
export function frameLabel(frame: TraceFrame): string {
  return frame.module ? frame.file : `${frame.name}()`;
}

export function isReference(value: PyValue): value is ReferenceValue {
  return value.k === 'ref';
}
