import { create } from 'zustand';
import { pythonRuntime } from '@/lib/runtime/pythonRuntime';
import type { PyError, RuntimeStatus, StreamChannel } from '@/lib/runtime/protocol';
import { selectActiveFile, useFilesStore } from './filesStore';
import { useTraceStore } from './traceStore';

export interface OutputLine {
  id: number;
  channel: StreamChannel;
  text: string;
}

/** A runaway print loop must not take the tab down with it. */
const MAX_LINES = 5000;

interface RunState {
  status: RuntimeStatus;
  pythonVersion: string | null;
  bootMs: number | null;
  lines: OutputLine[];
  /** True once output was dropped to stay under MAX_LINES. */
  truncated: boolean;
  error: PyError | null;
  durationMs: number | null;
  fatal: string | null;

  boot: () => void;
  start: () => void;
  stop: () => void;
  clearOutput: () => void;
}

let lineCounter = 0;

export const useRunStore = create<RunState>()((set, get) => ({
  status: 'idle',
  pythonVersion: null,
  bootMs: null,
  lines: [],
  truncated: false,
  error: null,
  durationMs: null,
  fatal: null,

  boot: () => {
    if (get().status === 'idle') pythonRuntime.boot();
  },

  start: () => {
    const files = useFilesStore.getState();
    const entry = selectActiveFile(files);
    if (!entry) return;

    set({ lines: [], truncated: false, error: null, durationMs: null, fatal: null });
    useTraceStore.getState().clear();
    pythonRuntime.run(
      files.files.map(({ name, source }) => ({ name, source })),
      entry.name,
      files.stdin
    );
  },

  stop: () => pythonRuntime.stop(),

  clearOutput: () => {
    set({ lines: [], truncated: false, error: null, durationMs: null });
    useTraceStore.getState().clear();
  },
}));

// One subscription for the app's lifetime; the worker is a singleton too.
pythonRuntime.subscribe((message) => {
  switch (message.kind) {
    case 'status':
      useRunStore.setState({ status: message.status });
      break;

    case 'ready':
      useRunStore.setState({ pythonVersion: message.pythonVersion, bootMs: message.bootMs });
      break;

    case 'stream': {
      useRunStore.setState((state) => {
        const next = [
          ...state.lines,
          { id: ++lineCounter, channel: message.channel, text: message.text },
        ];
        const overflow = next.length - MAX_LINES;
        return overflow > 0
          ? { lines: next.slice(overflow), truncated: true }
          : { lines: next, truncated: state.truncated };
      });
      break;
    }

    case 'finished':
      useRunStore.setState({ error: message.error, durationMs: message.durationMs });
      useTraceStore.getState().setResult(message.trace, message.stdout);
      break;

    case 'fatal':
      useRunStore.setState({ fatal: message.message });
      break;
  }
});
