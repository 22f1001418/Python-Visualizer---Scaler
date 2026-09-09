import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { buildShareUrl } from '@/lib/share';
import { useFilesStore } from '@/store/filesStore';
import { useNotesStore } from '@/store/notesStore';
import { useUiStore } from '@/store/uiStore';

/**
 * Copies a link that contains the whole lesson.
 *
 * Files, stdin, notes and the chosen lens all travel in the URL fragment, which
 * never leaves the browser. Paste it into a class chat and everyone opens the
 * exact program you are teaching from, annotations included.
 */
export function ShareButton({ icon }: { icon: ReactNode }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const share = async () => {
    const { files, stdin } = useFilesStore.getState();
    const { notes } = useNotesStore.getState();
    const { lens } = useUiStore.getState();

    try {
      const url = await buildShareUrl({
        v: 1,
        files: files.map((file) => ({ n: file.name, s: file.source })),
        i: stdin || undefined,
        t: Object.keys(notes).length > 0 ? (notes as unknown as Record<string, string>) : undefined,
        l: lens,
      });

      await navigator.clipboard.writeText(url);
      setState('copied');
    } catch {
      // Clipboard access can be refused; say so rather than looking like it worked.
      setState('failed');
    }

    window.setTimeout(() => setState('idle'), 2200);
  };

  return (
    <Button icon={icon} onClick={share} title="Copy a link to this lesson">
      <span className="max-[720px]:hidden">
        {state === 'copied' ? 'Link copied' : state === 'failed' ? 'Copy failed' : 'Share'}
      </span>
    </Button>
  );
}
