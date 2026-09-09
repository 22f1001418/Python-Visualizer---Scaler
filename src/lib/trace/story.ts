import type { PyValue, StatementKind, Trace, TraceStep } from './types';

/**
 * The beginner-facing reading of a step.
 *
 * Everything here is derived from the recording — nothing is re-executed and
 * nothing is guessed at that the trace does not already know. The goal is to
 * answer the two questions a first-timer actually has, which the memory diagram
 * never answers: *what is this line about to do*, and *what just changed*.
 */

export interface Beat {
  /** 'source' is the line as written, 'values' has the names filled in, 'result' is what it produced. */
  kind: 'source' | 'values' | 'result';
  text: string;
  /** A short label shown above the beat. */
  label: string;
}

export interface NameChange {
  frameId: number;
  name: string;
  before?: PyValue;
  after: PyValue;
  isNew: boolean;
}

const sameValue = (a: PyValue | undefined, b: PyValue | undefined): boolean => {
  if (!a || !b) return a === b;
  if (a.k !== b.k) return false;
  if (a.k === 'ref' && b.k === 'ref') return a.id === b.id;
  return a.k === 'prim' && b.k === 'prim' && a.r === b.r;
};

const activeFrameOf = (step: TraceStep) => step.frames[step.frames.length - 1];

const localsMap = (step: TraceStep, frameId: number): Map<string, PyValue> => {
  const frame = step.frames.find((entry) => entry.id === frameId);
  return new Map(frame?.locals ?? []);
};

/**
 * What the previous step changed.
 *
 * A line step is recorded *before* that line runs, so the difference between
 * step i-1 and step i is exactly the work the previous line did — which is what
 * the diagram on screen is showing.
 */
export function changesAt(trace: Trace, index: number): NameChange[] {
  const step = trace.steps[index];
  const previous = trace.steps[index - 1];
  if (!step || !previous) return [];

  const changes: NameChange[] = [];

  for (const frame of step.frames) {
    const before = localsMap(previous, frame.id);
    const wasPresent = previous.frames.some((entry) => entry.id === frame.id);

    for (const [name, after] of frame.locals) {
      const prior = before.get(name);
      if (sameValue(prior, after)) continue;

      // A brand-new frame's variables are its arguments, not "changes".
      changes.push({
        frameId: frame.id,
        name,
        before: prior,
        after,
        isNew: prior === undefined && wasPresent,
      });
    }
  }

  return changes;
}

/** Keys of the form `frameId:name`, for highlighting rows in the lenses. */
export function changedKeys(trace: Trace, index: number): Set<string> {
  return new Set(changesAt(trace, index).map((change) => `${change.frameId}:${change.name}`));
}

/**
 * The line, then the line with its values filled in, then what it produced.
 *
 * The third beat is read from the *next* recorded step: a line step happens
 * before the line runs, so the outcome is sitting in the step after it. Nothing
 * has to be evaluated twice to show it.
 */
export function buildBeats(trace: Trace, index: number, stdout: string): Beat[] {
  const step = trace.steps[index];
  if (!step) return [];

  if (step.e === 'call') {
    const frame = activeFrameOf(step);
    if (!frame) return [];
    const args = frame.locals.map(([name, value]) => `${name} = ${describe(value)}`).join(', ');
    return [
      {
        kind: 'source',
        label: 'starting',
        text: `${frame.name}(${frame.locals.map(([, value]) => describe(value)).join(', ')})`,
      },
      ...(args
        ? [{ kind: 'result' as const, label: 'its own variables', text: args }]
        : [{ kind: 'result' as const, label: 'its own variables', text: 'none' }]),
    ];
  }

  if (step.e === 'return') {
    const frame = activeFrameOf(step);
    return [
      {
        kind: 'result',
        label: 'hands back',
        text: `${frame ? `${frame.name}() → ` : ''}${step.ret ? describe(step.ret) : 'None'}`,
      },
    ];
  }

  if (!step.src) return [];

  const beats: Beat[] = [{ kind: 'source', label: 'the line', text: step.src }];
  if (step.sub) beats.push({ kind: 'values', label: 'with the values filled in', text: step.sub });

  const result = resultBeat(trace, index, stdout);
  if (result) beats.push(result);

  return beats;
}

function resultBeat(trace: Trace, index: number, stdout: string): Beat | null {
  const step = trace.steps[index];
  const next = trace.steps[index + 1];

  // Anything printed after this step began came from this line. On the very last
  // step there is no next step to compare against, so the tail of the output is
  // what this line produced.
  const printedUpTo = next ? next.out : stdout.length;
  if (printedUpTo > step.out) {
    const printed = stdout.slice(step.out, printedUpTo).replace(/\n$/, '');
    return { kind: 'result', label: 'shows in the output', text: printed };
  }

  if (!next) return null;

  const targets = step.tg ?? [];
  if (targets.length > 0 && (step.k === 'assign' || step.k === 'augassign' || step.k === 'for')) {
    const frameId = activeFrameOf(step)?.id ?? -1;
    const before = localsMap(step, frameId);
    const after = localsMap(next, frameId);

    // A for-loop's final visit hands out nothing: the name still holds the last
    // item, and claiming it was just set would teach the wrong thing.
    const moved = targets.filter(
      (name) => after.has(name) && !sameValue(before.get(name), after.get(name))
    );

    if (moved.length > 0) {
      return {
        kind: 'result',
        label: 'so now',
        text: moved.map((name) => `${name} = ${describe(after.get(name)!)}`).join(', '),
      };
    }

    if (step.k === 'for') {
      return { kind: 'result', label: 'so now', text: 'there is nothing left — the loop ends' };
    }
  }

  if (step.k === 'return' && next.e === 'return' && next.ret) {
    return { kind: 'result', label: 'hands back', text: describe(next.ret) };
  }

  if (step.k === 'if' || step.k === 'while') {
    // The next line tells us which way the check went: straight into the block,
    // or past it. Teaching code is shaped simply enough for this to hold.
    const wentInside = next.file === step.file && next.line === step.line + 1;
    return {
      kind: 'result',
      label: 'the check was',
      text: wentInside ? 'True — so it goes inside' : 'False — so it skips ahead',
    };
  }

  return null;
}

/** One sentence about what this step is doing. */
export function narrate(trace: Trace, index: number): string {
  const step = trace.steps[index];
  if (!step) return '';

  const frame = activeFrameOf(step);
  const where = frame && !frame.module ? `${frame.name}()` : 'the file';

  if (step.e === 'call' && frame) {
    return frame.locals.length > 0
      ? `${frame.name}() starts running, with its own copy of the values it was given.`
      : `${frame.name}() starts running with no values passed in.`;
  }

  if (step.e === 'return' && frame) {
    return `${frame.name}() is finished. It hands its answer back to whoever called it.`;
  }

  if (step.e === 'exception' && step.exc) {
    return `Something went wrong here: ${step.exc.type}.`;
  }

  const target = step.tg?.[0];

  const sentences: Record<StatementKind, string> = {
    assign: `Work out the right-hand side first, then put the name ${target ?? 'here'} on the answer.`,
    augassign: `Take what ${target ?? 'the variable'} holds, change it, and store the answer back under the same name.`,
    for: forSentence(trace, index, target),
    while: 'Check whether the loop should run again. While the answer is True, it keeps going.',
    if: 'Check this condition. Only if it is True does the indented block below run.',
    return: `Send a value back out of ${where}. Nothing after this line in ${where} will run.`,
    call: 'Run this line — it calls a function and hands it the values in the brackets.',
    def: `Remember this function under the name ${target ?? 'shown'}. Nothing inside it runs yet.`,
    class: `Create the class ${target ?? 'shown'} — a blueprint that objects will be made from.`,
    import: 'Bring in code that was written somewhere else.',
    expr: 'Work out this expression.',
    other: 'Run this line.',
  };

  return sentences[step.k ?? 'other'];
}

function forSentence(trace: Trace, index: number, target: string | undefined): string {
  const step = trace.steps[index];
  const next = trace.steps[index + 1];
  const name = target ?? 'the loop variable';

  if (!next) return `Take the next item and call it ${name}.`;

  const after = localsMap(next, activeFrameOf(step)?.id ?? -1);
  const before = localsMap(step, activeFrameOf(step)?.id ?? -1);

  if (!after.has(name)) return `There is nothing left to take, so the loop ends.`;
  if (!before.has(name)) return `Take the first item from the sequence and call it ${name}.`;
  if (sameValue(before.get(name), after.get(name))) {
    return `There is nothing left to take, so the loop ends.`;
  }
  return `Take the next item from the sequence and call it ${name}.`;
}

/** A short, readable rendering of a value for use inside a sentence. */
export function describe(value: PyValue): string {
  return value.k === 'prim' ? value.r : 'the object it points at';
}
