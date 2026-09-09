import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { CloseIcon } from '@/components/ui/Icons';
import { LESSONS, lessonsByTopic, type Lesson } from '@/lessons/lessons';
import { useFilesStore } from '@/store/filesStore';
import { useNotesStore } from '@/store/notesStore';
import { useRunStore } from '@/store/runStore';
import { useTraceStore } from '@/store/traceStore';
import { useUiStore } from '@/store/uiStore';

/**
 * The lesson deck.
 *
 * Prepared snippets, grouped the way a foundations course runs, so the sidebar
 * doubles as a syllabus. Picking one loads it, clears the previous run, and
 * switches to the lens it was written for — one click between topics mid-class.
 */
export function LessonDrawer() {
  const open = useUiStore((s) => s.lessonsOpen);
  const setOpen = useUiStore((s) => s.setLessonsOpen);
  const setLens = useUiStore((s) => s.setLens);
  const loadWorkspace = useFilesStore((s) => s.loadWorkspace);
  const clearNotes = useNotesStore((s) => s.clear);
  const clearOutput = useRunStore((s) => s.clearOutput);
  const clearTrace = useTraceStore((s) => s.clear);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) panel.current?.focus();
  }, [open]);

  if (!open) return null;

  const openLesson = (lesson: Lesson) => {
    loadWorkspace([{ name: 'main.py', source: lesson.source }], lesson.stdin ?? '');
    clearTrace();
    clearOutput();
    clearNotes();
    if (lesson.lens) setLens(lesson.lens);
    setOpen(false);
  };

  return (
    <div className="absolute inset-0 z-30 flex">
      {/* Click-away, but only over the workspace — the transport bar stays live
          so a lesson can be picked without losing your place in the timeline. */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-label="Lessons"
        onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
        className="relative flex h-full w-[22rem] max-w-[85vw] flex-col border-r border-line bg-panel shadow-panel outline-none"
      >
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-3">
          <h2 className="text-[0.95em] font-semibold">Lessons</h2>
          <span className="text-[0.78em] text-subtle">{LESSONS.length} snippets</span>
          <Button
            className="ml-auto"
            icon={<CloseIcon className="size-full" />}
            onClick={() => setOpen(false)}
            aria-label="Close lessons"
          />
        </header>

        <div className="min-h-0 flex-1 overflow-auto p-2">
          {lessonsByTopic().map((group) => (
            <section key={group.topic} className="mb-3">
              <h3 className="px-2 py-1 text-[0.72em] font-semibold tracking-wide text-subtle uppercase">
                {group.topic}
              </h3>

              <div className="flex flex-col gap-1">
                {group.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => openLesson(lesson)}
                    className="rounded-md border border-transparent px-2 py-1.5 text-left hover:border-line hover:bg-hover"
                  >
                    <span className="block text-[0.88em] font-medium text-fg">{lesson.title}</span>
                    <span className="mt-0.5 block text-[0.8em] leading-snug text-subtle">
                      {lesson.blurb}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="shrink-0 border-t border-line px-3 py-2 text-[0.78em] text-subtle">
          Opening a lesson replaces what is in the editor.
        </footer>
      </aside>
    </div>
  );
}
