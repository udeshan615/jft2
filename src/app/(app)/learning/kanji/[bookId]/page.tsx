import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft, PlayCircle, Gamepad2, Layers } from 'lucide-react';
import { getCurrentUser } from '@/lib/services/auth';
import { getKanjiBook, getKanjiLessons } from '@/lib/services/kanji-learning';
import {
  getBookIntroSettings,
  getBookIntroProgress,
  getKanjiGames,
} from '@/lib/services/kanji-games';
import { BookHubClient } from '@/components/kanji/games/book-hub-client';

export const metadata = { title: 'Kanji Book' };

export default async function KanjiBookPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const book = await getKanjiBook(bookId);
  if (!book) notFound();

  const [lessons, games, introSettings, introProgress] = await Promise.all([
    getKanjiLessons(bookId),
    getKanjiGames(bookId),
    getBookIntroSettings(bookId),
    getBookIntroProgress(user.id, bookId),
  ]);

  const introDone = !!(introProgress?.watched || introProgress?.skipped);

  return (
    <BookHubClient
      book={book}
      lessons={lessons}
      games={games}
      bookId={bookId}
      userId={user.id}
      introSettings={introSettings}
      introDone={introDone}
    />
  );
}
