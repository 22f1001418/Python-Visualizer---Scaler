import { Button } from '@/components/ui/Button';

/**
 * Predict-the-output.
 *
 * The console is covered until someone commits to an answer. It is a one-button
 * change that turns a demonstration the class watches into a question the class
 * answers, which is most of the difference between the two.
 */
export function PredictCard({ onReveal }: { onReveal: () => void }) {
  return (
    <div className="grid h-full place-items-center p-6">
      <div className="max-w-sm text-center">
        <p className="text-[1.05em] font-medium text-fg">What does this print?</p>
        <p className="mt-1.5 text-[0.85em] leading-relaxed text-subtle">
          Take a guess before looking. Everything else on screen still works — the code, the
          timeline, and the lenses.
        </p>
        <Button variant="primary" className="mt-3" onClick={onReveal}>
          Reveal the output
        </Button>
      </div>
    </div>
  );
}
