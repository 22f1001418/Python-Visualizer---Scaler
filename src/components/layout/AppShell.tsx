import { useEffect } from 'react';
import { StatusBar } from './StatusBar';
import { TopBar } from './TopBar';
import { Workspace } from './Workspace';
import { TransportBar } from '@/components/trace/TransportBar';
import { HelpOverlay } from '@/components/teach/HelpOverlay';
import { LessonDrawer } from '@/components/teach/LessonDrawer';
import { NoteRail } from '@/components/teach/NoteRail';
import { useSharedWorkspace } from '@/hooks/useSharedWorkspace';
import { applyDocumentChrome } from '@/lib/applyDocumentChrome';
import { useAppShortcuts } from '@/hooks/useAppShortcuts';
import { useRunStore } from '@/store/runStore';
import { useUiStore } from '@/store/uiStore';

export function AppShell() {
  const theme = useUiStore((s) => s.theme);
  const presenter = useUiStore((s) => s.presenter);

  useAppShortcuts();
  useSharedWorkspace();

  useEffect(() => {
    applyDocumentChrome(theme, presenter);
  }, [theme, presenter]);

  // Start downloading the interpreter immediately. It takes a couple of seconds,
  // and nobody wants that wait to begin when they press Run in front of a class.
  useEffect(() => {
    useRunStore.getState().boot();
  }, []);

  return (
    <div className="flex h-full flex-col bg-app">
      {/* Presenter mode drops the top bar: on a projector every row of chrome
          is a row of code the back of the room cannot read. */}
      {!presenter ? <TopBar /> : null}
      {/* The timeline sits above the workspace and outlives the top bar: in
          presenter mode it is the only control that still matters. */}
      <TransportBar />
      <NoteRail />
      <main className="relative flex min-h-0 flex-1 flex-col gap-px bg-line">
        <Workspace />
        <LessonDrawer />
        <HelpOverlay />
      </main>
      <StatusBar />
    </div>
  );
}
