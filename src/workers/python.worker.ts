/// <reference lib="webworker" />

import runnerSource from '@/python/runner.py?raw';
import type { FromWorkerMessage, PyError, ToWorkerMessage } from '@/lib/runtime/protocol';

/**
 * The Python worker.
 *
 * Pyodide is a 13 MB WebAssembly interpreter; booting it on the UI thread would
 * freeze the tab for seconds, and a student's `while True:` would freeze it
 * forever. Both live here instead, where the main thread can abandon them by
 * terminating the worker.
 */

/** The slice of Pyodide's API we actually use. */
interface PyodideApi {
  runPythonAsync(code: string): Promise<unknown>;
  setStdout(options: { batched: (text: string) => void }): void;
  setStderr(options: { batched: (text: string) => void }): void;
  globals: { set(name: string, value: unknown): void };
  setInterruptBuffer(buffer: Uint8Array): void;
  FS: { mkdirTree(path: string): void };
  version: string;
}

type LoadPyodide = (options: { indexURL: string }) => Promise<PyodideApi>;

let pyodide: PyodideApi | null = null;
let currentRunId: string | null = null;
let interruptBuffer: Uint8Array | null = null;

function post(message: FromWorkerMessage): void {
  self.postMessage(message);
}

function stream(channel: 'stdout' | 'stderr', text: string): void {
  if (!currentRunId) return;
  post({ kind: 'stream', runId: currentRunId, channel, text });
}

async function boot(): Promise<void> {
  if (pyodide) return;

  post({ kind: 'status', status: 'booting' });
  const startedAt = performance.now();

  // Loaded from /pyodide/ at runtime rather than bundled: it keeps 13 MB out of
  // the app chunk, and the browser caches it across reloads and across lessons.
  const moduleUrl = new URL('/pyodide/pyodide.mjs', self.location.origin).href;
  const { loadPyodide } = (await import(/* @vite-ignore */ moduleUrl)) as {
    loadPyodide: LoadPyodide;
  };

  pyodide = await loadPyodide({ indexURL: '/pyodide/' });

  pyodide.setStdout({ batched: (text) => stream('stdout', text) });
  pyodide.setStderr({ batched: (text) => stream('stderr', text) });

  if (interruptBuffer) pyodide.setInterruptBuffer(interruptBuffer);

  pyodide.FS.mkdirTree('/home/pylens');
  await pyodide.runPythonAsync(runnerSource);

  const pythonVersion = String(
    await pyodide.runPythonAsync('".".join(str(p) for p in __import__("sys").version_info[:3])')
  );

  post({ kind: 'ready', pythonVersion, bootMs: Math.round(performance.now() - startedAt) });
  post({ kind: 'status', status: 'ready' });
}

async function run(message: Extract<ToWorkerMessage, { kind: 'run' }>): Promise<void> {
  await boot();
  if (!pyodide) return;

  currentRunId = message.runId;
  // Clear any interrupt left over from a previous Stop, or the new run would
  // die the instant it started.
  if (interruptBuffer) interruptBuffer[0] = 0;
  post({ kind: 'status', status: 'running' });
  const startedAt = performance.now();

  let error: PyError | null = null;

  try {
    const payload = JSON.stringify({
      files: Object.fromEntries(message.files.map((file) => [file.name, file.source])),
      entry: message.entry,
      stdin: message.stdin,
    });

    pyodide.globals.set('__pylens_payload', payload);
    const raw = String(await pyodide.runPythonAsync('run_json(__pylens_payload)'));
    const result = JSON.parse(raw) as { ok: boolean; error?: PyError };
    if (!result.ok && result.error) error = result.error;
  } catch (thrown) {
    // Reaching here means the driver itself broke, not the student's program.
    error = {
      type: 'RuntimeError',
      message: thrown instanceof Error ? thrown.message : String(thrown),
      line: null,
      file: null,
      traceback: '',
    };
  }

  post({
    kind: 'finished',
    runId: message.runId,
    durationMs: Math.round(performance.now() - startedAt),
    error,
  });
  post({ kind: 'status', status: 'ready' });
  currentRunId = null;
}

self.onmessage = (event: MessageEvent<ToWorkerMessage>) => {
  const message = event.data;
  if (message.kind === 'boot') interruptBuffer = message.interruptBuffer;
  const handler = message.kind === 'boot' ? boot() : run(message);

  handler.catch((thrown: unknown) => {
    post({
      kind: 'fatal',
      message: thrown instanceof Error ? thrown.message : String(thrown),
    });
    post({ kind: 'status', status: 'error' });
  });
};
