'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { KanjiWriter } from '@/components/kanji/kanji-writer';
import { createClient } from '@/lib/supabase/client';
import { extractYoutubeId } from '@/lib/kanji/types';
import type { KanjiEntry, KanjiLesson } from '@/lib/kanji/types';
import { cn } from '@/lib/utils/cn';

interface Props {
  lesson: KanjiLesson;
  entries: KanjiEntry[];
  userId: string;
  introDone: boolean;
  completedIds: string[];
  bookId: string;
}

export function KanjiLessonClient({
  lesson,
  entries,
  userId,
  introDone: initialIntroDone,
  completedIds,
  bookId,
}: Props) {
  const router = useRouter();
  const [introDone, setIntroDone] = useState(initialIntroDone);
  const [pending, startTransition] = useTransition();
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);

  const firstIncomplete = entries.findIndex((e) => !completedSet.has(e.id));
  const [index, setIndex] = useState(
    firstIncomplete >= 0 ? firstIncomplete : 0
  );
  const [writingDone, setWritingDone] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(
    entries.length > 0 && entries.every((e) => completedSet.has(e.id))
  );

  const total = entries.length;
  const current = entries[index];
  const progressCount = entries.filter((e) => completedSet.has(e.id)).length;
  const youtubeId = extractYoutubeId(lesson.intro_youtube_url);

  async function markIntro(skipped: boolean) {
    const supabase = createClient();
    await supabase.from('kanji_intro_progress').upsert(
      {
        user_id: userId,
        module_id: lesson.id,
        watched: !skipped,
        skipped,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,module_id' }
    );
    setIntroDone(true);
  }

  async function markEntryComplete(entryId: string) {
    const supabase = createClient();
    await supabase.from('kanji_entry_progress').upsert(
      {
        user_id: userId,
        module_id: lesson.id,
        kanji_entry_id: entryId,
        completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,kanji_entry_id' }
    );
    completedSet.add(entryId);
  }

  function handleWritingComplete() {
    setWritingDone(true);
  }

  function goPrev() {
    if (index <= 0) return;
    setIndex((i) => i - 1);
    setWritingDone(completedSet.has(entries[index - 1]?.id));
  }

  async function goNext() {
    if (!current) return;
    startTransition(async () => {
      if (!completedSet.has(current.id)) {
        await markEntryComplete(current.id);
      }
      if (index >= total - 1) {
        setLessonComplete(true);
      } else {
        const nextIdx = index + 1;
        setIndex(nextIdx);
        setWritingDone(completedSet.has(entries[nextIdx]?.id));
      }
    });
  }

  function reviewLesson() {
    setLessonComplete(false);
    setIndex(0);
    setWritingDone(completedSet.has(entries[0]?.id));
  }

  if (!introDone) {
    return (
      <div className="mx-auto max-w-lg space-y-5 animate-fade-in">
        <div>
          <p className="text-sm font-medium text-[#c99a2e]">Introduction</p>
          <h1 className="text-xl font-bold text-[#123f6b]">{lesson.title}</h1>
        </div>
        <div className="aspect-video overflow-hidden rounded-2xl border border-[#123f6b]/15 bg-black shadow-lg">
          {youtubeId ? (
            <iframe
              title="Lesson introduction"
              src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-white/80">
              Introduction video not set yet. Continue to the lesson.
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="flex-1 rounded-full bg-[#123f6b] hover:bg-[#0e3256]"
            onClick={() => markIntro(false)}
          >
            Next → Start lesson
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-full"
            onClick={() => markIntro(true)}
          >
            Skip introduction
          </Button>
        </div>
      </div>
    );
  }

  if (lessonComplete || total === 0) {
    return (
      <div className="mx-auto max-w-md space-y-6 py-10 text-center animate-fade-in">
        <div className="text-5xl" aria-hidden>
          🎉
        </div>
        <h2 className="text-2xl font-bold text-[#123f6b]">Lesson Completed</h2>
        <p className="font-medium text-slate-700">{lesson.title}</p>
        <p className="text-muted-foreground">
          {total} / {total} Kanji completed
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" className="rounded-full" onClick={reviewLesson}>
            Review lesson
          </Button>
          <Button
            className="rounded-full bg-[#123f6b] hover:bg-[#0e3256]"
            onClick={() => router.push(`/learning/kanji/${bookId}`)}
          >
            Back to lessons
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 animate-fade-in">
      <div className="space-y-2">
        <p className="text-sm font-medium text-[#c99a2e]">Lesson: {lesson.title}</p>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-[#123f6b]">
            Kanji {index + 1} / {total}
          </h1>
          <span className="text-xs text-muted-foreground">
            Done {progressCount}/{total}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#123f6b] to-[#c99a2e] transition-all duration-500"
            style={{
              width: `${((index + (writingDone ? 1 : 0)) / Math.max(total, 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[#123f6b]/10 bg-white p-4 shadow-sm sm:p-6">
        <KanjiWriter
          key={current.id}
          kanji={current.kanji}
          onComplete={handleWritingComplete}
        />

        <div className="mt-6 space-y-1 border-t border-slate-100 pt-5 text-center">
          <p className="text-2xl font-semibold tracking-wide text-[#123f6b]">
            {current.reading || '—'}
          </p>
          <p className="text-base text-slate-700">
            {current.meaning_si || current.meaning_en || ''}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="min-h-[48px] flex-1 rounded-full"
          disabled={index <= 0 || pending}
          onClick={goPrev}
        >
          ← Previous
        </Button>
        <Button
          className={cn(
            'min-h-[48px] flex-1 rounded-full text-base',
            writingDone || completedSet.has(current.id)
              ? 'bg-[#123f6b] hover:bg-[#0e3256]'
              : 'bg-slate-200 text-slate-400'
          )}
          disabled={
            (!writingDone && !completedSet.has(current.id)) || pending
          }
          onClick={goNext}
        >
          {index >= total - 1 ? 'Finish lesson' : 'Next →'}
        </Button>
      </div>
    </div>
  );
}
