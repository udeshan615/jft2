import { createClient } from '@/lib/supabase/server';
import type {
  Referral,
  ReferralStats,
  ReferralGame,
  ReferralGameLeaderboardEntry,
  ReferralGameWinner,
} from '@/lib/types/database';

export async function getMyReferralCode(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', userId)
    .maybeSingle();
  return data?.referral_code ?? null;
}

export async function getMyReferrals(userId: string): Promise<Referral[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('referrals')
    .select(
      `
      *,
      referred_profile:profiles!referrals_referred_id_fkey (
        display_name, verification_status, created_at
      )
    `
    )
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });
  return (data as Referral[]) ?? [];
}

export async function getMyReferralStats(userId: string): Promise<ReferralStats> {
  const list = await getMyReferrals(userId);
  const stats: ReferralStats = {
    total: list.length,
    registered: 0,
    verified: 0,
    qualified: 0,
    rewarded: 0,
    earnings_lkr: 0,
  };
  for (const r of list) {
    const s = r.status;
    if (s === 'registered' || s === 'pending') stats.registered += 1;
    if (s === 'verified') stats.verified += 1;
    if (s === 'qualified') stats.qualified += 1;
    if (s === 'rewarded') {
      stats.rewarded += 1;
      stats.qualified += 1;
      stats.earnings_lkr += Number(r.reward_amount_lkr) || 0;
    }
  }
  return stats;
}

export async function getCurrentReferralGame(): Promise<ReferralGame | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('referral_games')
    .select('*')
    .eq('is_enabled', true)
    .in('status', ['published', 'live', 'ended'])
    .order('starts_at', { ascending: false })
    .limit(10);
  const games = (data as ReferralGame[]) ?? [];
  const now = Date.now();
  const live = games.find(
    (g) =>
      new Date(g.starts_at).getTime() <= now &&
      new Date(g.ends_at).getTime() >= now
  );
  if (live) return live;
  const upcoming = games
    .filter((g) => new Date(g.starts_at).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    )[0];
  if (upcoming) return upcoming;
  return games[0] ?? null;
}

export async function getReferralGameById(
  id: string
): Promise<ReferralGame | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('referral_games')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data as ReferralGame) ?? null;
}

export async function getReferralGameLeaderboard(
  gameId: string,
  limit = 10
): Promise<ReferralGameLeaderboardEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('referral_game_leaderboard', {
    p_game_id: gameId,
    p_limit: limit,
  });
  if (error || !data) return [];
  return (data as ReferralGameLeaderboardEntry[]).map((row) => ({
    rank: Number(row.rank),
    user_id: row.user_id,
    display_name: row.display_name,
    qualified_count: Number(row.qualified_count),
    score: Number(row.score),
    first_qualified_at: row.first_qualified_at,
  }));
}

export async function getReferralGameWinners(
  gameId: string
): Promise<ReferralGameWinner[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('referral_game_winners')
    .select('*, profiles:user_id ( display_name )')
    .eq('game_id', gameId)
    .order('rank', { ascending: true });
  return (data as ReferralGameWinner[]) ?? [];
}

export async function getAllReferralGamesAdmin(): Promise<ReferralGame[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('referral_games')
    .select('*')
    .order('starts_at', { ascending: false });
  return (data as ReferralGame[]) ?? [];
}

export async function getAdminReferralOverview() {
  const supabase = await createClient();
  const { count: total } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true });
  const { count: qualified } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .in('status', ['qualified', 'rewarded']);
  const { count: rewarded } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'rewarded');
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const { count: today } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', since.toISOString());

  return {
    total: total ?? 0,
    qualified: qualified ?? 0,
    rewarded: rewarded ?? 0,
    today: today ?? 0,
  };
}

export async function getAdminReferralsList(limit = 50): Promise<Referral[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('referrals')
    .select(
      `
      *,
      referred_profile:profiles!referrals_referred_id_fkey (
        display_name, verification_status, created_at
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data as Referral[]) ?? [];
}
