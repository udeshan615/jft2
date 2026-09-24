import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/services/auth';
import { getKanjiBook } from '@/lib/services/kanji-learning';
import {
  getKanjiGame,
  getBookKanjiCards,
  getGameIntroProgress,
} from '@/lib/services/kanji-games';
import { ChooseCorrectGame } from '@/components/kanji/games/choose-correct-game';

export const metadata = { title: 'හරියට තෝරන්න' };

export default async function ChooseCorrectPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [book, game, cards] = await Promise.all([
    getKanjiBook(bookId),
    getKanjiGame(bookId, 'choose_correct'),
    getBookKanjiCards(bookId),
  ]);
  if (!book || !game || !game.is_enabled) notFound();

  const intro = await getGameIntroProgress(user.id, game.id);
  const introDone = !!(intro?.watched || intro?.skipped);

  return (
    <div className="space-y-4">
      <Link
        href={`/learning/kanji/${bookId}`}
        className="inline-flex items-center gap-1 text-sm text-[#123f6b] hover:underline"
      >
        <ChevronLeft className="h-4 w-4" /> {book.title}
      </Link>
      <ChooseCorrectGame
        game={game}
        cards={cards}
        userId={user.id}
        introDone={introDone}
      />
    </div>
  );
}
