import { useEffect, useRef } from 'react';
import type { OutputLine } from '@/store/runStore';

interface ConsoleViewProps {
  lines: OutputLine[];
  truncated: boolean;
}

/** stdout and stderr, in the order Python emitted them. */
export function ConsoleView({ lines, truncated }: ConsoleViewProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [lines.length]);

  return (
    <div className="px-3 py-2 font-mono text-[0.88em] leading-relaxed">
      {truncated ? (
        <p className="mb-1 text-[0.85em] text-warn italic">
          Earlier output was dropped — only the last 5,000 lines are kept.
        </p>
      ) : null}

      {lines.map((line) => (
        <div
          key={line.id}
          className={`whitespace-pre-wrap ${line.channel === 'stderr' ? 'text-error' : 'text-fg'}`}
        >
          {line.text || ' '}
        </div>
      ))}

      <div ref={endRef} />
    </div>
  );
}
