/** What a lens shows when this particular step has nothing for it. */
export function LensEmpty({ headline, detail }: { headline: string; detail: string }) {
  return (
    <div className="grid h-full place-items-center p-6">
      <div className="max-w-sm text-center">
        <p className="text-[0.92em] text-muted">{headline}</p>
        <p className="mt-1.5 text-[0.85em] leading-relaxed text-subtle">{detail}</p>
      </div>
    </div>
  );
}
