import { Button } from '@/components/ui/Button';
import { CloseIcon } from '@/components/ui/Icons';
import { useUiStore } from '@/store/uiStore';

const SHORTCUTS: Array<[string, string]> = [
  ['Ctrl/Cmd + Enter', 'Run the file'],
  ['left / right', 'Previous / next step'],
  ['Home / End', 'First / last step'],
  ['Space', 'Play or pause the timeline'],
  ['N', 'Write a note on this step'],
  ['P', 'Predict the output'],
  ['L', 'Open the lessons'],
  ['Ctrl/Cmd + Shift + P', 'Presenter mode'],
  ['Ctrl/Cmd + Shift + L', 'Light / dark theme'],
  ['?', 'This list'],
  ['Escape', 'Close, or leave presenter mode'],
];

/**
 * The shortcut list.
 *
 * Presenter mode hides the buttons, so the keys have to be discoverable some
 * other way — one keystroke, and nothing to remember before the class starts.
 */
export function HelpOverlay() {
  const open = useUiStore((s) => s.helpOpen);
  const setOpen = useUiStore((s) => s.setHelpOpen);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 grid place-items-center p-6">
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden />

      <div
        role="dialog"
        aria-label="Keyboard shortcuts"
        className="relative w-full max-w-md rounded-xl border border-line bg-panel shadow-panel"
      >
        <header className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <h2 className="text-[0.95em] font-semibold">Keyboard</h2>
          <Button
            className="ml-auto"
            icon={<CloseIcon className="size-full" />}
            onClick={() => setOpen(false)}
            aria-label="Close"
          />
        </header>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 p-4">
          {SHORTCUTS.map(([keys, meaning]) => (
            <div key={keys} className="contents">
              <dt className="rounded border border-line bg-inset px-1.5 py-0.5 text-right font-mono text-[0.78em] text-muted">
                {keys}
              </dt>
              <dd className="self-center text-[0.85em] text-fg">{meaning}</dd>
            </div>
          ))}
        </dl>

        <p className="border-t border-line px-4 py-2.5 text-[0.8em] text-subtle">
          Single-letter keys work whenever the editor does not have focus.
        </p>
      </div>
    </div>
  );
}
