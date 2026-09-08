import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/Button';
import { MoonIcon, PlayIcon, PresentIcon, StopIcon, SunIcon } from '@/components/ui/Icons';
import { selectActiveFile, useFilesStore } from '@/store/filesStore';
import { useRunStore } from '@/store/runStore';
import { useUiStore } from '@/store/uiStore';

export function TopBar() {
  const theme = useUiStore((s) => s.theme);
  const presenter = useUiStore((s) => s.presenter);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const togglePresenter = useUiStore((s) => s.togglePresenter);

  const activeFile = useFilesStore(useShallow(selectActiveFile));
  const status = useRunStore((s) => s.status);
  const start = useRunStore((s) => s.start);
  const stop = useRunStore((s) => s.stop);

  const isRunning = status === 'running';
  const isBooting = status === 'booting';

  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-line bg-panel px-3">
      <div className="flex items-center gap-2">
        <Logo />
        <span className="text-[1.05em] font-semibold tracking-tight">PyLens</span>
      </div>

      <span className="h-4 w-px bg-line" />

      <span className="truncate font-mono text-[0.85em] text-muted">{activeFile.name}</span>

      <div className="ml-auto flex items-center gap-1">
        {isRunning ? (
          <Button variant="primary" icon={<StopIcon className="size-full" />} onClick={stop}>
            Stop
          </Button>
        ) : (
          <Button
            variant="primary"
            icon={<PlayIcon className="size-full" />}
            onClick={start}
            disabled={isBooting}
            title="Run (Ctrl/Cmd + Enter)"
          >
            {isBooting ? 'Starting…' : 'Run'}
          </Button>
        )}

        <span className="mx-1 h-4 w-px bg-line" />

        <Button
          icon={<PresentIcon className="size-full" />}
          active={presenter}
          onClick={togglePresenter}
          title="Presenter mode (Ctrl/Cmd + Shift + P)"
          aria-label="Toggle presenter mode"
        />
        <Button
          icon={
            theme === 'dark' ? (
              <SunIcon className="size-full" />
            ) : (
              <MoonIcon className="size-full" />
            )
          }
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-label="Toggle colour theme"
        />
      </div>
    </header>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="var(--c-accent)" strokeWidth="2" />
      <path d="m15.5 15.5 5 5" stroke="var(--c-accent)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10.5" cy="10.5" r="2.4" fill="var(--c-frame)" />
    </svg>
  );
}
