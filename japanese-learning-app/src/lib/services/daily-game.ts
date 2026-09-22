import { createClient } from '@/lib/supabase/server';
import type {
  DailyGame,
  DailyGameQuestion,
  DailyGameAttempt,
  LeaderboardEntry,
} from '@/lib/types/database';

export async function getActiveOrUpcomingGames(): Promise<DailyGame[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('daily_games')
    .select('*')
    .eq('is_enabled', true)
    .in('status', ['published', 'live', 'ended'])
    .order('starts_at', { ascending: false })
    .limit(10);
  return (data as DailyGame[]) ?? [];
}

export async function getCurrentDailyGame(): Promise<DailyGame | null> {
  const games = await getActiveOrUpcomingGames();
  const now = Date.now();
  // Prefer live
  const live = games.find(
    (g) =>
      new Date(g.starts_at).getTime() <= now &&
      new Date(g.ends_at).getTime() >= now
  );
  if (live) return live;
  // Next upcoming
  const upcoming = games
    .filter((g) => new Date(g.starts_at).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    )[0];
  if (upcoming) return upcoming;
  // Latest ended
  return games[0] ?? null;
}

export async function getGameById(id: string): Promise<DailyGame | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('daily_games')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data as DailyGame) ?? null;
}

/** Questions for player — strip correct answers */
export async function getGameQuestionsForPlayer(
  gameId: string
): Promise<Omit<DailyGameQuestion, 'correct_option_id'>[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('daily_game_questions')
    .select(
      'id, game_id, question_text, question_type, image_url, options, points, sort_order, created_at, updated_at'
    )
    .eq('game_id', gameId)
    .order('sort_order', { ascending: true });
  return (data as Omit<DailyGameQuestion, 'correct_option_id'>[]) ?? [];
}

export async function getGameQuestionsAdmin(
  gameId: string
): Promise<DailyGameQuestion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('daily_game_questions')
    .select('*')
    .eq('game_id', gameId)
    .order('sort_order', { ascending: true });
  return (data as DailyGameQuestion[]) ?? [];
}

export async function getUserAttempt(
  gameId: string,
  userId: string
): Promise<DailyGameAttempt | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('daily_game_attempts')
    .select('*')
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .eq('status', 'submitted')
    .maybeSingle();
  return (data as DailyGameAttempt) ?? null;
}

export async function getLeaderboard(
  gameId: string,
  limit = 10
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('daily_game_attempts')
    .select(
      `
      id, user_id, score, duration_ms, submitted_at,
      profiles:user_id ( display_name )
    `
    )
    .eq('game_id', gameId)
    .eq('status', 'submitted')
    .order('score', { ascending: false })
    .order('duration_ms', { ascending: true })
    .order('submitted_at', { ascending: true })
    .limit(limit);

  if (!data) return [];

  return data.map((row, i) => {
    const r = row as {
      id: string;
      user_id: string;
      score: number;
      duration_ms: number | null;
      submitted_at: string | null;
      profiles?: { display_name?: string | null } | null;
    };
    return {
      rank: i + 1,
      user_id: r.user_id,
      display_name: r.profiles?.display_name ?? null,
      score: r.score,
      duration_ms: r.duration_ms,
      submitted_at: r.submitted_at,
      attempt_id: r.id,
    };
  });
}

export async function getAllGamesAdmin(): Promise<DailyGame[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('daily_games')
    .select('*')
    .order('starts_at', { ascending: false });
  return (data as DailyGame[]) ?? [];
}
