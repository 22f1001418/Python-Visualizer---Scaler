import type { ReactNode } from 'react';

interface PaneFrameProps {
  title: string;
  icon?: ReactNode;
  /** Right-aligned controls in the pane header. */
  actions?: ReactNode;
  children: ReactNode;
}

/** Every pane in the workspace wears the same chrome: a compact labelled header
 *  and a scroll container beneath it. Keeping it in one place means a lens never
 *  has to think about its own frame. */
export function PaneFrame({ title, icon, actions, children }: PaneFrameProps) {
  return (
    <section className="flex h-full min-h-0 flex-col bg-panel">
      <header className="flex h-9 shrink-0 items-center gap-2 border-b border-line px-3">
        {icon ? <span className="grid size-4 place-items-center text-subtle">{icon}</span> : null}
        <h2 className="text-[0.8em] font-semibold tracking-wide text-muted uppercase">{title}</h2>
        <div className="ml-auto flex items-center gap-1">{actions}</div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  );
}
