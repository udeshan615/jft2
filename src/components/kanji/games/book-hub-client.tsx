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

type ListItem = {
  key: string;
  href: string;
  title: string;
  subtitle: string;
  badge: string | number;
  sort: number;
};

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

  // Single Lessons list: writing lessons + games (no separate Games section)
  const items: ListItem[] = [
    ...lessons.map((l, i) => ({
      key: `lesson-${l.id}`,
      href: `/learning/kanji/${bookId}/${l.id}`,
      title: l.title,
      subtitle: 'Writing practice',
      badge: l.lesson_number ?? i + 1,
      sort: (l.sort_order ?? i) * 10,
    })),
    ...games.map((g, i) => {
      const href =
        g.game_key === 'flash_card'
          ? `/learning/kanji/${bookId}/games/flash-card`
          : g.game_key === 'choose_correct'
            ? `/learning/kanji/${bookId}/games/choose-correct`
            : '#';
      const emoji = g.game_key === 'flash_card' ? '🎴' : '🎯';
      return {
        key: `game-${g.id}`,
        href,
        title: `${emoji} ${g.title_si || g.title}`,
        subtitle: g.description || 'Practice game',
        badge: emoji,
        sort: 1000 + (g.sort_order ?? i),
      };
    }),
  ].sort((a, b) => a.sort - b.sort);

  return (
    <div className="space-y-6 animate-fade-in">
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

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#c99a2e]">
          <Layers className="h-4 w-4" /> Lessons
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No lessons published yet.</p>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <Link key={item.key} href={item.href}>
                <div className="flex items-center gap-3 rounded-2xl border border-[#123f6b]/10 bg-white p-4 shadow-sm transition hover:shadow-md active:scale-[0.99]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c99a2e]/15 text-sm font-bold text-[#c99a2e]">
                    {item.badge}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[#123f6b]">{item.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.subtitle}
                    </p>
                  </div>
                  <PlayCircle className="h-5 w-5 text-[#123f6b]/40" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
