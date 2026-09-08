import { useEffect } from 'react';
import { StatusBar } from './StatusBar';
import { TopBar } from './TopBar';
import { Workspace } from './Workspace';
import { applyDocumentChrome } from '@/lib/applyDocumentChrome';
import { useAppShortcuts } from '@/hooks/useAppShortcuts';
import { useUiStore } from '@/store/uiStore';

export function AppShell() {
  const theme = useUiStore((s) => s.theme);
  const presenter = useUiStore((s) => s.presenter);

  useAppShortcuts();

  useEffect(() => {
    applyDocumentChrome(theme, presenter);
  }, [theme, presenter]);

  return (
    <div className="flex h-full flex-col bg-app">
      {/* Presenter mode drops the top bar: on a projector every row of chrome
          is a row of code the back of the room cannot read. */}
      {!presenter ? <TopBar /> : null}
      <main className="flex min-h-0 flex-1 flex-col gap-px bg-line">
        <Workspace />
      </main>
      <StatusBar />
    </div>
  );
}
