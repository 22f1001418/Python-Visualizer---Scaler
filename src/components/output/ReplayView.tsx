/**
 * Output as it stood at the current step.
 *
 * Rendered from the recorded buffer rather than the live stream, so scrubbing
 * backwards genuinely un-prints the lines that had not happened yet.
 */
export function ReplayView({ text, atEnd }: { text: string; atEnd: boolean }) {
  return (
    <div className="px-3 py-2 font-mono text-[0.88em] leading-relaxed whitespace-pre-wrap">
      {text}
      {!atEnd ? (
        <span
          className="ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.15em] bg-accent"
          aria-hidden="true"
        />
      ) : null}
      {text === '' && atEnd ? (
        <span className="text-subtle italic">This program printed nothing.</span>
      ) : null}
    </div>
  );
}
