'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import type {
  Referral,
  ReferralStats,
  ReferralGame,
  ReferralGameLeaderboardEntry,
} from '@/lib/types/database';
import { Copy, Check, Share2, Users, Trophy, Link2 } from 'lucide-react';

function statusBadge(status: string) {
  const map: Record<string, 'success' | 'warning' | 'muted' | 'default'> = {
    registered: 'muted',
    pending: 'warning',
    verified: 'default',
    qualified: 'success',
    rewarded: 'success',
  };
  return (
    <Badge variant={map[status] ?? 'muted'} className="capitalize">
      {status}
    </Badge>
  );
}

export function ReferralClient({
  code,
  siteUrl,
  stats,
  referrals,
  game,
  leaderboard,
  myRank,
  myQualifiedInGame,
}: {
  code: string;
  siteUrl: string;
  stats: ReferralStats;
  referrals: Referral[];
  game: ReferralGame | null;
  leaderboard: ReferralGameLeaderboardEntry[];
  myRank: number | null;
  myQualifiedInGame: number;
}) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const link = useMemo(
    () => `${siteUrl.replace(/\/$/, '')}/register?ref=${encodeURIComponent(code)}`,
    [siteUrl, code]
  );

  async function copy(kind: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(kind === 'code' ? code : link);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me',
          text: `Use my referral code ${code}`,
          url: link,
        });
      } catch {
        /* cancelled */
      }
    } else {
      copy('link');
    }
  }

  const now = Date.now();
  const gameState = !game
    ? 'none'
    : !game.is_enabled
      ? 'disabled'
      : now < new Date(game.starts_at).getTime()
        ? 'upcoming'
        : now > new Date(game.ends_at).getTime()
          ? 'ended'
          : 'live';

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Qualified', value: stats.qualified },
          { label: 'Rewarded', value: stats.rewarded },
          {
            label: 'Earned',
            value: `LKR ${stats.earnings_lkr.toLocaleString()}`,
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <CardTitle>Your referral code</CardTitle>
          </div>
          <CardDescription>Share with friends — you earn when they verify</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center">
            <p className="text-3xl font-semibold tracking-widest text-primary">
              {code || '—'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 min-w-[120px]"
              onClick={() => copy('code')}
              disabled={!code}
            >
              {copied === 'code' ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              Copy code
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1 min-w-[120px]"
              onClick={() => copy('link')}
              disabled={!code}
            >
              {copied === 'link' ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              Copy link
            </Button>
            <Button
              type="button"
              className="flex-1 min-w-[120px]"
              onClick={share}
              disabled={!code}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
          <p className="break-all text-xs text-muted-foreground">{link}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Your referrals</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <EmptyState
              title="No referrals yet"
              description="Share your code. When friends sign up and get verified, they appear here."
              icon={<Users className="h-6 w-6" />}
            />
          ) : (
            <ul className="divide-y divide-border">
              {referrals.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {r.referred_profile?.display_name || 'Learner'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined{' '}
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {statusBadge(r.status)}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <CardTitle>
              {game?.title || 'Referral Game'}
            </CardTitle>
          </div>
          <CardDescription>
            {gameState === 'none' && 'No active referral game right now'}
            {gameState === 'upcoming' &&
              `Starts ${new Date(game!.starts_at).toLocaleString()}`}
            {gameState === 'live' &&
              `Ends ${new Date(game!.ends_at).toLocaleString()}`}
            {gameState === 'ended' && 'This game has ended'}
            {gameState === 'disabled' && 'Temporarily unavailable'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {game && gameState !== 'none' && gameState !== 'disabled' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Your qualified</p>
                <p className="text-xl font-semibold">{myQualifiedInGame}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Your rank</p>
                <p className="text-xl font-semibold">
                  {myRank ? `#${myRank}` : '—'}
                </p>
              </div>
            </div>
          )}
          {leaderboard.length === 0 ? (
            <EmptyState
              title="No leaderboard yet"
              description="Qualified referrals during the game window will rank here."
              icon={<Trophy className="h-6 w-6" />}
            />
          ) : (
            <ul className="divide-y divide-border">
              {leaderboard.map((row) => (
                <li
                  key={row.user_id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 text-sm font-semibold text-muted-foreground">
                      #{row.rank}
                    </span>
                    <span className="truncate font-medium">
                      {row.display_name || 'Player'}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {row.qualified_count} · {row.score} pts
                  </span>
                </li>
              ))}
            </ul>
          )}
          {game?.prize_enabled && Number(game.prize_amount_lkr) > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Prize pool up to LKR{' '}
              {Number(game.prize_amount_lkr).toLocaleString()} ·{' '}
              {game.max_winners} winner(s)
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
