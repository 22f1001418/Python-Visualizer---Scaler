import { Button } from '@/components/ui/Button';
import { MoonIcon, PlayIcon, PresentIcon, SunIcon } from '@/components/ui/Icons';
import { useUiStore } from '@/store/uiStore';

export function TopBar() {
  const theme = useUiStore((s) => s.theme);
  const presenter = useUiStore((s) => s.presenter);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const togglePresenter = useUiStore((s) => s.togglePresenter);

  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-line bg-panel px-3">
      <div className="flex items-center gap-2">
        <Logo />
        <span className="text-[1.05em] font-semibold tracking-tight">PyLens</span>
      </div>

      <span className="h-4 w-px bg-line" />

      <span className="truncate text-[0.9em] text-muted">untitled.py</span>

      <div className="ml-auto flex items-center gap-1">
        {/* Wired up in phase 1, once the Pyodide worker exists. */}
        <Button variant="primary" icon={<PlayIcon className="size-full" />} disabled>
          Run
        </Button>
        <span className="mx-1 h-4 w-px bg-line" />
        <Button
          icon={<PresentIcon className="size-full" />}
          active={presenter}
          onClick={togglePresenter}
          title="Presenter mode"
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
