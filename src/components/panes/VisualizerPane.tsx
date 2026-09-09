import { PaneFrame } from '@/components/layout/PaneFrame';
import { LensIcon } from '@/components/ui/Icons';
import { LensPicker } from '@/components/lenses/LensPicker';
import { lensById } from '@/components/lenses/registry';
import { StoryView } from '@/components/explain/StoryView';
import { PanePlaceholder } from './PanePlaceholder';
import { selectCurrentStep, useTraceStore } from '@/store/traceStore';
import { useUiStore, type VisualMode } from '@/store/uiStore';

const MODES: Array<{ id: VisualMode; label: string; hint: string }> = [
  { id: 'explain', label: 'Explain', hint: 'What this line does, in words' },
  { id: 'inspect', label: 'Inspect', hint: 'The diagrams: memory, stack, collections' },
];

export function VisualizerPane() {
  const trace = useTraceStore((s) => s.trace);
  const stepIndex = useTraceStore((s) => s.stepIndex);
  const stdout = useTraceStore((s) => s.stdout);
  const step = useTraceStore(selectCurrentStep);
  const lensId = useUiStore((s) => s.lens);
  const mode = useUiStore((s) => s.mode);
  const setMode = useUiStore((s) => s.setMode);

  if (!trace || !step) {
    return (
      <PaneFrame title="Visualizer" icon={<LensIcon className="size-full" />}>
        <PanePlaceholder
          headline="Run something and this explains it"
          detail="Explain mode walks through each line in plain words. Inspect mode has the diagrams — memory and references, the call stack, collections, objects."
          phase="Press Run to start"
        />
      </PaneFrame>
    );
  }

  const lens = lensById(lensId);

  return (
    <PaneFrame
      title="Visualizer"
      icon={<LensIcon className="size-full" />}
      actions={
        <div className="flex items-center gap-0.5 rounded-md bg-inset p-0.5" role="tablist">
          {MODES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={mode === entry.id}
              title={entry.hint}
              onClick={() => setMode(entry.id)}
              className={`rounded px-2 py-0.5 text-[0.8em] transition-colors ${
                mode === entry.id
                  ? 'bg-accent text-accent-fg'
                  : 'text-muted hover:bg-hover hover:text-fg'
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        {mode === 'explain' ? (
          <StoryView step={step} trace={trace} stepIndex={stepIndex} stdout={stdout} />
        ) : (
          <>
            <LensPicker trace={trace} />
            <div className="min-h-0 flex-1">
              <lens.Component step={step} trace={trace} stepIndex={stepIndex} />
            </div>
          </>
        )}
      </div>
    </PaneFrame>
  );
}
