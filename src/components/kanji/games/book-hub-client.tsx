'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, PlayCircle, Layers } from 'lucide-react';
import { IntroGate } from '@/components/kanji/games/intro-gate';
import { createClient } from '@/lib/supabase/client';
import type { KanjiBook, KanjiLesson } from '@/lib/kanji/types';
import type { BookIntroSettings, KanjiGame } from '@/lib/services/kanji-games';

interface Props {
  book: KanjiBook;
  lessons: KanjiLesson[];
  games: KanjiGame[];
  bookId: string;
  userId: string;
  introSettings: BookIntroSettings;
  introDone: boolean;
}

export function BookHubClient({
  book,
  lessons,
  games,
  bookId,
  userId,
  introSettings,
  introDone: initialDone,
}: Props) {
  const [introDone, setIntroDone] = useState(
    initialDone || !introSettings.enabled
  );

  async function finishIntro(skipped: boolean) {
    const supabase = createClient();
    await supabase.from('kanji_book_intro_progress').upsert(
      {
        user_id: userId,
        collection_id: bookId,
        watched: !skipped,
        skipped,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,collection_id' }
    );
    setIntroDone(true);
  }

  if (!introDone && introSettings.enabled) {
    return (
      <IntroGate
        title={book.title}
        youtubeUrl={introSettings.youtube_url}
        onContinue={finishIntro}
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Link
          href="/learning/kanji"
          className="inline-flex items-center gap-1 text-sm text-[#123f6b] hover:underline"
        >
          <ChevronLeft className="h-4 w-4" /> All books
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#123f6b]">
          {book.title}
        </h1>
        {book.description && (
          <p className="text-sm text-muted-foreground">{book.description}</p>
        )}
      </div>

      {/* Lessons */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#c99a2e]">
          <Layers className="h-4 w-4" /> Lessons
        </h2>
        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No lessons published yet.</p>
        ) : (
          <div className="grid gap-3">
            {lessons.map((l, i) => (
              <Link key={l.id} href={`/learning/kanji/${bookId}/${l.id}`}>
                <div className="flex items-center gap-3 rounded-2xl border border-[#123f6b]/10 bg-white p-4 shadow-sm transition hover:shadow-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c99a2e]/15 text-sm font-bold text-[#c99a2e]">
                    {l.lesson_number ?? i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[#123f6b]">{l.title}</h3>
                    <p className="text-xs text-muted-foreground">Writing practice</p>
                  </div>
                  <PlayCircle className="h-5 w-5 text-[#123f6b]/40" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Games */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#c99a2e]">
          Games
        </h2>
        {games.length === 0 ? (
          <p className="text-sm text-muted-foreground">No games enabled yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {games.map((g) => {
              const href =
                g.game_key === 'flash_card'
                  ? `/learning/kanji/${bookId}/games/flash-card`
                  : g.game_key === 'choose_correct'
                    ? `/learning/kanji/${bookId}/games/choose-correct`
                    : '#';
              const emoji = g.game_key === 'flash_card' ? '🎴' : '🎯';
              return (
                <Link key={g.id} href={href}>
                  <div className="h-full rounded-2xl border border-[#123f6b]/10 bg-gradient-to-br from-white to-[#f0f5fa] p-5 shadow-sm transition hover:shadow-md active:scale-[0.99]">
                    <div className="text-3xl">{emoji}</div>
                    <h3 className="mt-2 font-bold text-[#123f6b]">
                      {g.title_si || g.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {g.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
