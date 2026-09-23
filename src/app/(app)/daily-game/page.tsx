import { getCurrentUser } from '@/lib/services/auth';
import { redirect } from 'next/navigation';
import {
  getCurrentDailyGame,
  getGameById,
  getGameQuestionsForPlayer,
  getUserAttempt,
  getLeaderboard,
} from '@/lib/services/daily-game';
import { DailyGameClient } from '@/components/daily-game/daily-game-client';

export const metadata = { title: 'Daily Game' };

export default async function DailyGamePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  let game = params.id
    ? await getGameById(params.id)
    : await getCurrentDailyGame();

  if (game && !game.is_enabled && user.role !== 'admin') {
    game = null;
  }

  const [questions, attempt, leaderboard] = game
    ? await Promise.all([
        getGameQuestionsForPlayer(game.id),
        getUserAttempt(game.id, user.id),
        getLeaderboard(game.id, game.leaderboard_size || 10),
      ])
    : [[], null, []];

  return (
    <DailyGameClient
      game={game}
      questions={questions}
      existingAttempt={attempt}
      leaderboard={leaderboard}
      userId={user.id}
      isVerified={user.profile?.verification_status === 'verified'}
    />
  );
}
