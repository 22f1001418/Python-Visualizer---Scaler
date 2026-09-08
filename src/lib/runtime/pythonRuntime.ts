import type { FromWorkerMessage, PyFile, ToWorkerMessage } from './protocol';

type Listener = (message: FromWorkerMessage) => void;

/**
 * Main-thread handle on the Python worker.
 *
 * Owns the worker's lifecycle and the interrupt buffer, and broadcasts every
 * worker message to subscribers. The React layer never touches postMessage.
 */
class PythonRuntime {
  private worker: Worker | null = null;
  private listeners = new Set<Listener>();
  private interruptBuffer: Uint8Array | null = null;
  private runCounter = 0;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(message: FromWorkerMessage): void {
    for (const listener of this.listeners) listener(message);
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;

    this.worker = new Worker(new URL('../../workers/python.worker.ts', import.meta.url), {
      type: 'module',
      name: 'pylens-python',
    });

    this.worker.onmessage = (event: MessageEvent<FromWorkerMessage>) => this.emit(event.data);
    this.worker.onerror = (event) => {
      this.emit({ kind: 'fatal', message: event.message || 'The Python worker crashed.' });
      this.emit({ kind: 'status', status: 'error' });
    };

    // SharedArrayBuffer only exists when the page is cross-origin isolated. With
    // it, Stop delivers a KeyboardInterrupt and the interpreter survives;
    // without it, Stop has to terminate and re-boot the worker.
    if (typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated) {
      this.interruptBuffer = new Uint8Array(new SharedArrayBuffer(1));
    }

    this.post({ kind: 'boot', interruptBuffer: this.interruptBuffer });
    return this.worker;
  }

  private post(message: ToWorkerMessage): void {
    this.ensureWorker().postMessage(message);
  }

  /** Start downloading the interpreter without running anything yet. */
  boot(): void {
    this.ensureWorker();
  }

  run(files: PyFile[], entry: string, stdin: string): string {
    const runId = `run-${++this.runCounter}`;
    this.post({ kind: 'run', runId, files, entry, stdin });
    return runId;
  }

  /** True when Stop can interrupt without losing the booted interpreter. */
  get canInterrupt(): boolean {
    return this.interruptBuffer !== null;
  }

  stop(): void {
    if (this.interruptBuffer) {
      this.interruptBuffer[0] = 2; // SIGINT — Pyodide raises KeyboardInterrupt
      return;
    }

    this.worker?.terminate();
    this.worker = null;
    this.emit({ kind: 'status', status: 'idle' });
  }
}

export const pythonRuntime = new PythonRuntime();
