/**
 * The contract between the UI thread and the Python worker.
 *
 * Both sides import these types, so a message that changes shape breaks the
 * build rather than the classroom.
 */

export type RuntimeStatus =
  | 'idle' // worker not started yet
  | 'booting' // downloading and initialising Pyodide
  | 'ready' // interpreter is up, nothing running
  | 'running' // executing student code
  | 'error'; // the runtime itself failed to start

export interface PyFile {
  name: string;
  source: string;
}

/** A student-facing error, already stripped of PyLens' own stack frames. */
export interface PyError {
  type: string;
  message: string;
  /** 1-based line in `file`, or null when Python could not attribute one. */
  line: number | null;
  file: string | null;
  traceback: string;
}

export type StreamChannel = 'stdout' | 'stderr';

export type ToWorkerMessage =
  | {
      kind: 'boot';
      /**
       * Shared memory Pyodide polls to deliver a KeyboardInterrupt. Present only
       * when the page is cross-origin isolated; without it Stop has to fall back
       * to terminating the worker.
       */
      interruptBuffer: Uint8Array | null;
    }
  | {
      kind: 'run';
      runId: string;
      files: PyFile[];
      /** Filename of the file to execute. */
      entry: string;
      /** Pre-supplied stdin, consumed by input(). */
      stdin: string;
    };

export type FromWorkerMessage =
  | { kind: 'status'; status: RuntimeStatus }
  | { kind: 'ready'; pythonVersion: string; bootMs: number }
  | { kind: 'stream'; runId: string; channel: StreamChannel; text: string }
  | { kind: 'finished'; runId: string; durationMs: number; error: PyError | null }
  | { kind: 'fatal'; message: string };
