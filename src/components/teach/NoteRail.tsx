import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useNotesStore } from '@/store/notesStore';
import { useTraceStore } from '@/store/traceStore';
import { useUiStore } from '@/store/uiStore';

/**
 * The caption rail.
 *
 * A prepared lecture is a program plus the sentence you say at a particular
 * moment in it. Scrub past that moment and the sentence appears — no notes app
 * open on a second screen, no remembering what the point of step 41 was.
 */
export function NoteRail() {
  const stepIndex = useTraceStore((s) => s.stepIndex);
  const hasTrace = useTraceStore((s) => s.trace !== null);
  const notes = useNotesStore((s) => s.notes);
  const setNote = useNotesStore((s) => s.setNote);
  const removeNote = useNotesStore((s) => s.removeNote);
  const editing = useUiStore((s) => s.noteEditing);
  const setEditing = useUiStore((s) => s.setNoteEditing);

  const note = notes[stepIndex];
  const [draft, setDraft] = useState('');
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) return;
    setDraft(note ?? '');
    field.current?.focus();
  }, [editing, note]);

  // Moving the scrubber abandons an unsaved note rather than carrying it to a
  // step it was not written about.
  useEffect(() => setEditing(false), [stepIndex, setEditing]);

  if (!hasTrace) return null;

  if (editing) {
    const save = () => {
      setNote(stepIndex, draft);
      setEditing(false);
    };

    return (
      <div className="flex shrink-0 items-start gap-2 border-b border-line bg-warn-soft px-3 py-2">
        <span className="mt-1 shrink-0 font-mono text-[0.75em] text-warn">
          step {stepIndex + 1}
        </span>

        <textarea
          ref={field}
          value={draft}
          rows={2}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              save();
            }
            if (event.key === 'Escape') setEditing(false);
          }}
          placeholder="What are you saying at this moment? Enter to save, Shift+Enter for a new line."
          className="min-w-0 flex-1 resize-none rounded border border-line bg-panel px-2 py-1 text-[0.88em] text-fg placeholder:text-subtle focus:border-accent focus:outline-none"
        />

        <div className="flex shrink-0 items-center gap-1">
          <Button variant="primary" onClick={save}>
            Save
          </Button>
          {note ? (
            <Button
              onClick={() => {
                removeNote(stepIndex);
                setEditing(false);
              }}
            >
              Delete
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="flex shrink-0 items-baseline gap-2 border-b border-line bg-warn-soft px-3 py-1.5">
      <span className="shrink-0 font-mono text-[0.75em] text-warn">step {stepIndex + 1}</span>
      <p className="min-w-0 flex-1 text-[0.95em] leading-snug text-fg">{note}</p>
      <Button className="shrink-0" onClick={() => setEditing(true)}>
        Edit
      </Button>
    </div>
  );
}
