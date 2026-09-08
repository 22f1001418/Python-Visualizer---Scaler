interface PanePlaceholderProps {
  headline: string;
  detail: string;
  /** Which build phase fills this pane in — visible while the shell is bare. */
  phase: string;
}

export function PanePlaceholder({ headline, detail, phase }: PanePlaceholderProps) {
  return (
    <div className="grid h-full place-items-center p-6">
      <div className="max-w-sm text-center">
        <p className="text-[0.95em] font-medium text-muted">{headline}</p>
        <p className="mt-1.5 text-[0.85em] leading-relaxed text-subtle">{detail}</p>
        <p className="mt-3 inline-block rounded-full border border-line bg-inset px-2.5 py-0.5 text-[0.75em] text-subtle">
          {phase}
        </p>
      </div>
    </div>
  );
}
