import type { HeapObject, PyValue, Trace, TraceFrame, TraceStep } from './types';
import { isReference } from './types';

/**
 * Derived views over a step, shared by the lenses.
 *
 * Everything here is computed from a single recorded step — no lens re-runs
 * anything, and two lenses looking at the same step always agree.
 */

export interface NameBinding {
  /** Unique across the step, so an arrow can anchor to it. */
  key: string;
  frameId: number;
  frameLabel: string;
  name: string;
  value: PyValue;
}

/** Every variable in every frame, flattened, in stack order. */
export function bindingsOf(step: TraceStep): NameBinding[] {
  return step.frames.flatMap((frame) =>
    frame.locals.map(([name, value]) => ({
      key: `${frame.id}:${name}`,
      frameId: frame.id,
      frameLabel: frame.module ? frame.file : `${frame.name}()`,
      name,
      value,
    }))
  );
}

/**
 * How many names point at each heap object.
 *
 * Two or more is the whole aliasing lesson, so the memory lens leans on this to
 * decide what to call out.
 */
export function referenceCounts(step: TraceStep): Map<string, NameBinding[]> {
  const counts = new Map<string, NameBinding[]>();

  for (const binding of bindingsOf(step)) {
    if (!isReference(binding.value)) continue;
    const existing = counts.get(binding.value.id);
    if (existing) existing.push(binding);
    else counts.set(binding.value.id, [binding]);
  }

  return counts;
}

/** Heap objects a variable can reach, in the order the frames introduce them. */
export function reachableObjects(step: TraceStep): HeapObject[] {
  const ordered: HeapObject[] = [];
  const seen = new Set<string>();

  const visit = (value: PyValue) => {
    if (!isReference(value) || seen.has(value.id)) return;
    const object = step.heap[value.id];
    if (!object) return;

    seen.add(value.id);
    ordered.push(object);

    for (const child of childValues(object)) visit(child);
  };

  for (const binding of bindingsOf(step)) visit(binding.value);
  return ordered;
}

/** The values nested directly inside a heap object. */
export function childValues(object: HeapObject): PyValue[] {
  switch (object.kind) {
    case 'sequence':
      return object.items;
    case 'mapping':
      return object.entries.flat();
    case 'instance':
      return object.attrs.map(([, value]) => value);
    case 'class':
      return object.attrs.map(([, value]) => value);
    case 'generator':
      return object.locals.map(([, value]) => value);
    default:
      return [];
  }
}

/** References that point from one heap object to another. */
export function heapEdges(objects: HeapObject[]): Array<{ from: string; to: string }> {
  return objects.flatMap((object) =>
    childValues(object)
      .filter(isReference)
      .map((value) => ({ from: object.id, to: value.id }))
  );
}

// ---------------------------------------------------------------------------
// Loops
// ---------------------------------------------------------------------------

export interface LoopRow {
  /** 0 is the state before the first iteration. */
  iteration: number;
  stepIndex: number;
  values: Record<string, PyValue | undefined>;
}

export interface LoopAnalysis {
  /** The line the loop header sits on. */
  line: number;
  file: string;
  frameLabel: string;
  columns: string[];
  rows: LoopRow[];
}

/**
 * Rebuilds the trace table a teacher would draw on a whiteboard.
 *
 * The loop is found from the recording rather than by parsing the code: within
 * one frame, the line that runs most often is the loop header, and each time it
 * runs a new iteration begins. Values are read at the *end* of each iteration,
 * which is what makes the accumulator column tell a story.
 */
export function analyseLoop(trace: Trace, stepIndex: number): LoopAnalysis | null {
  const steps = trace.steps;
  const current = steps[stepIndex];
  if (!current) return null;

  const frame = pickLoopFrame(trace, current);
  if (frame === null) return null;

  const frameSteps = steps.filter(
    (step) => step.frames[step.frames.length - 1]?.id === frame && step.e === 'line'
  );
  if (frameSteps.length < 3) return null;

  const header = busiestLine(frameSteps);
  if (header === null) return null;

  const visits = frameSteps
    .map((_step, index) => index)
    .filter((index) => frameSteps[index].line === header);
  if (visits.length < 2) return null;

  /**
   * Which lines belong to the loop body.
   *
   * Taken from the gaps between two visits to the header, because those can only
   * contain body lines. The final visit is the one that discovers the loop is
   * over, and what follows it is the rest of the program — this set is how the
   * two are told apart.
   */
  const bodyLines = new Set<number>();
  for (let i = 0; i + 1 < visits.length; i += 1) {
    for (let j = visits[i] + 1; j < visits[i + 1]; j += 1) {
      if (frameSteps[j].line !== header) bodyLines.add(frameSteps[j].line);
    }
  }
  if (bodyLines.size === 0) return null;

  const valuesOf = (step: TraceStep): Record<string, PyValue> =>
    Object.fromEntries(step.frames[step.frames.length - 1]?.locals ?? []);

  const seenColumns: string[] = [];
  const noteColumns = (step: TraceStep) => {
    for (const [name] of step.frames[step.frames.length - 1]?.locals ?? []) {
      if (!seenColumns.includes(name)) seenColumns.push(name);
    }
  };

  // Row 0: the state as the loop is entered, before any pass has run.
  const rows: LoopRow[] = [];
  noteColumns(frameSteps[visits[0]]);
  rows.push({
    iteration: 0,
    stepIndex: frameSteps[visits[0]].i,
    values: valuesOf(frameSteps[visits[0]]),
  });

  for (let i = 0; i < visits.length; i += 1) {
    const from = visits[i];
    const to = i + 1 < visits.length ? visits[i + 1] : frameSteps.length - 1;

    const ranBody = frameSteps
      .slice(from + 1, to + 1)
      .some((step) => bodyLines.has(step.line) && step.line !== header);
    if (!ranBody) continue;

    /**
     * The state *after* the pass, not during it.
     *
     * A line step is recorded before that line runs, so reading the last step of
     * the body would show the accumulator one update behind — exactly the
     * off-by-one that makes a trace table useless. The first step after the pass
     * has the finished values.
     */
    const settled = frameSteps[to];
    noteColumns(settled);
    rows.push({ iteration: rows.length, stepIndex: settled.i, values: valuesOf(settled) });
  }

  if (rows.length < 2) return null;

  /**
   * Only the variables that actually move.
   *
   * At module level everything defined above the loop — every function, every
   * class — is technically in scope, and a table forty columns wide teaches
   * nothing. A column earns its place by changing.
   */
  const columns = seenColumns.filter((name) => {
    const first = rows[0].values[name];
    return rows.some((row) => !sameValue(row.values[name], first));
  });

  const frameInfo = current.frames.find((entry) => entry.id === frame) ?? current.frames[0];

  return {
    line: header,
    file: frameSteps[0].file,
    frameLabel: frameInfo.module ? frameInfo.file : `${frameInfo.name}()`,
    columns: columns.length > 0 ? columns : seenColumns,
    rows,
  };
}

/** Two values look the same to a reader when they print the same or point alike. */
function sameValue(a: PyValue | undefined, b: PyValue | undefined): boolean {
  if (!a || !b) return a === b;
  if (a.k !== b.k) return false;
  return a.k === 'ref' && b.k === 'ref'
    ? a.id === b.id
    : a.k === 'prim' && b.k === 'prim' && a.r === b.r;
}

/** Prefer the frame the scrubber is in; fall back to whichever frame loops. */
function pickLoopFrame(trace: Trace, current: TraceStep): number | null {
  const active = current.frames[current.frames.length - 1];
  if (active && hasRepeatedLine(trace, active.id)) return active.id;

  const seen = new Set<number>();
  for (const step of trace.steps) {
    const frame = step.frames[step.frames.length - 1];
    if (!frame || seen.has(frame.id)) continue;
    seen.add(frame.id);
    if (hasRepeatedLine(trace, frame.id)) return frame.id;
  }

  return null;
}

function hasRepeatedLine(trace: Trace, frameId: number): boolean {
  const counts = new Map<number, number>();

  for (const step of trace.steps) {
    if (step.e !== 'line' || step.frames[step.frames.length - 1]?.id !== frameId) continue;
    const next = (counts.get(step.line) ?? 0) + 1;
    if (next >= 2) return true;
    counts.set(step.line, next);
  }

  return false;
}

/** The most-executed line — for a loop, that is its header. */
function busiestLine(steps: TraceStep[]): number | null {
  const counts = new Map<number, number>();
  for (const step of steps) counts.set(step.line, (counts.get(step.line) ?? 0) + 1);

  let best: number | null = null;
  let bestCount = 1;

  for (const [line, count] of counts) {
    // Ties go to the earlier line: the header of a loop always precedes its body.
    if (count > bestCount || (count === bestCount && best !== null && line < best)) {
      best = line;
      bestCount = count;
    }
  }

  return bestCount >= 2 ? best : null;
}

/**
 * Which pass of the loop is happening right now.
 *
 * Rows hold the state *after* a pass, so the pass in flight is the one after the
 * last row that has settled. Highlighting the settled row instead would point at
 * the pass that already finished, which is never the one being talked about.
 * Returns one past the last pass once the loop is over, so callers can tell
 * "running the final pass" from "finished".
 */
export function currentPass(analysis: LoopAnalysis, stepIndex: number): number {
  const passes = analysis.rows.filter((row) => row.iteration > 0);
  return passes.filter((row) => row.stepIndex <= stepIndex).length + 1;
}

/** How many passes the loop makes in total. */
export function passCount(analysis: LoopAnalysis): number {
  return analysis.rows.filter((row) => row.iteration > 0).length;
}

/** Frames that are not the module — the ones a call-stack lens draws as calls. */
export function callFrames(step: TraceStep): TraceFrame[] {
  return step.frames.filter((frame) => !frame.module);
}
