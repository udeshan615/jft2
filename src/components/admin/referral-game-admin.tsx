'use client';

import { formatLkr } from '@/lib/utils/format';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type {
  ReferralGame,
  ReferralGameLeaderboardEntry,
  ReferralGameWinner,
} from '@/lib/types/database';

type GameForm = {
  id?: string;
  title: string;
  description: string;
  status: ReferralGame['status'];
  is_enabled: boolean;
  starts_at: string;
  ends_at: string;
  points_per_qualified: number;
  min_qualified_for_leaderboard: number;
  leaderboard_size: number;
  prize_amount_lkr: number;
  max_winners: number;
  prize_enabled: boolean;
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function emptyForm(): GameForm {
  const start = new Date();
  const end = new Date(Date.now() + 7 * 864e5);
  return {
    title: 'Referral Challenge',
    description: '',
    status: 'draft',
    is_enabled: false,
    starts_at: toLocalInput(start.toISOString()),
    ends_at: toLocalInput(end.toISOString()),
    points_per_qualified: 1,
    min_qualified_for_leaderboard: 1,
    leaderboard_size: 10,
    prize_amount_lkr: 1000,
    max_winners: 1,
    prize_enabled: true,
  };
}

export function ReferralGameAdmin({
  games: initial,
}: {
  games: ReferralGame[];
}) {
  const router = useRouter();
  const [games, setGames] = useState(initial);
  const [edit, setEdit] = useState<GameForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [lb, setLb] = useState<ReferralGameLeaderboardEntry[]>([]);
  const [winners, setWinners] = useState<ReferralGameWinner[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function refreshGames() {
    const supabase = createClient();
    const { data } = await supabase
      .from('referral_games')
      .select('*')
      .order('starts_at', { ascending: false });
    setGames((data as ReferralGame[]) || []);
    router.refresh();
  }

  async function saveGame() {
    if (!edit?.title) return;
    setSaving(true);
    setMsg(null);
    const supabase = createClient();
    const payload = {
      title: edit.title,
      description: edit.description || null,
      status: edit.status,
      is_enabled: edit.is_enabled,
      starts_at: new Date(edit.starts_at).toISOString(),
      ends_at: new Date(edit.ends_at).toISOString(),
      points_per_qualified: Number(edit.points_per_qualified) || 1,
      min_qualified_for_leaderboard:
        Number(edit.min_qualified_for_leaderboard) || 1,
      leaderboard_size: Number(edit.leaderboard_size) || 10,
      prize_amount_lkr: Number(edit.prize_amount_lkr) || 0,
      max_winners: Number(edit.max_winners) || 1,
      prize_enabled: edit.prize_enabled,
      updated_at: new Date().toISOString(),
    };
    let error;
    if (edit.id) {
      ({ error } = await supabase
        .from('referral_games')
        .update(payload)
        .eq('id', edit.id));
    } else {
      ({ error } = await supabase.from('referral_games').insert(payload));
    }
    setSaving(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setEdit(null);
    await refreshGames();
  }

  async function openLb(gameId: string) {
    setViewId(gameId);
    setMsg(null);
    const supabase = createClient();
    const { data } = await supabase.rpc('referral_game_leaderboard', {
      p_game_id: gameId,
      p_limit: 50,
    });
    setLb(
      ((data as ReferralGameLeaderboardEntry[]) || []).map((r) => ({
        ...r,
        rank: Number(r.rank),
        qualified_count: Number(r.qualified_count),
        score: Number(r.score),
      }))
    );
    const { data: w } = await supabase
      .from('referral_game_winners')
      .select('*, profiles:user_id ( display_name )')
      .eq('game_id', gameId)
      .order('rank');
    setWinners((w as ReferralGameWinner[]) || []);
  }

  async function selectWinner(userId: string, rank: number) {
    if (!viewId) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc('select_referral_game_winner', {
      p_game_id: viewId,
      p_user_id: userId,
      p_rank: rank,
      p_note: null,
    });
    setSaving(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg('Winner selected');
    await openLb(viewId);
  }

  async function awardPrize(winnerId: string) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc('award_referral_game_prize', {
      p_winner_id: winnerId,
    });
    setSaving(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg('Prize awarded');
    if (viewId) await openLb(viewId);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setEdit(emptyForm())}>New game</Button>
      </div>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}

      {edit && (
        <Card>
          <CardHeader>
            <CardTitle>{edit.id ? 'Edit game' : 'Create game'}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Title</Label>
              <Input
                value={edit.title}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={edit.description}
                onChange={(e) =>
                  setEdit({ ...edit, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={edit.status}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    status: e.target.value as ReferralGame['status'],
                  })
                }
              >
                {['draft', 'published', 'live', 'ended', 'cancelled'].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={edit.is_enabled}
                onChange={(e) =>
                  setEdit({ ...edit, is_enabled: e.target.checked })
                }
              />
              <Label>Enabled</Label>
            </div>
            <div className="space-y-2">
              <Label>Starts</Label>
              <Input
                type="datetime-local"
                value={edit.starts_at}
                onChange={(e) =>
                  setEdit({ ...edit, starts_at: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Ends</Label>
              <Input
                type="datetime-local"
                value={edit.ends_at}
                onChange={(e) => setEdit({ ...edit, ends_at: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Points per qualified</Label>
              <Input
                type="number"
                value={edit.points_per_qualified}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    points_per_qualified: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Min qualified for board</Label>
              <Input
                type="number"
                value={edit.min_qualified_for_leaderboard}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    min_qualified_for_leaderboard: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Leaderboard size</Label>
              <Input
                type="number"
                value={edit.leaderboard_size}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    leaderboard_size: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Prize amount (LKR)</Label>
              <Input
                type="number"
                value={edit.prize_amount_lkr}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    prize_amount_lkr: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Max winners</Label>
              <Input
                type="number"
                value={edit.max_winners}
                onChange={(e) =>
                  setEdit({ ...edit, max_winners: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={edit.prize_enabled}
                onChange={(e) =>
                  setEdit({ ...edit, prize_enabled: e.target.checked })
                }
              />
              <Label>Prize enabled</Label>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button onClick={saveGame} disabled={saving}>
                {saving ? 'Saving…' : 'Save game'}
              </Button>
              <Button variant="secondary" onClick={() => setEdit(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Games</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {games.length === 0 && (
            <p className="text-sm text-muted-foreground">No games yet.</p>
          )}
          {games.map((g) => (
            <div
              key={g.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3"
            >
              <div>
                <p className="font-medium">{g.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(g.starts_at).toLocaleString()} →{' '}
                  {new Date(g.ends_at).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="muted">{g.status}</Badge>
                {g.is_enabled ? (
                  <Badge variant="success">On</Badge>
                ) : (
                  <Badge variant="muted">Off</Badge>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setEdit({
                      id: g.id,
                      title: g.title,
                      description: g.description || '',
                      status: g.status,
                      is_enabled: g.is_enabled,
                      starts_at: toLocalInput(g.starts_at),
                      ends_at: toLocalInput(g.ends_at),
                      points_per_qualified: g.points_per_qualified,
                      min_qualified_for_leaderboard:
                        g.min_qualified_for_leaderboard,
                      leaderboard_size: g.leaderboard_size,
                      prize_amount_lkr: Number(g.prize_amount_lkr),
                      max_winners: g.max_winners,
                      prize_enabled: g.prize_enabled,
                    })
                  }
                >
                  Edit
                </Button>
                <Button size="sm" onClick={() => openLb(g.id)}>
                  Leaderboard
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {viewId && (
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard & winners</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="divide-y divide-border">
              {lb.map((row) => (
                <li
                  key={row.user_id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <span>
                    #{row.rank} {row.display_name || 'Player'} —{' '}
                    {row.qualified_count} qualified ({row.score} pts)
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={saving}
                    onClick={() => selectWinner(row.user_id, row.rank)}
                  >
                    Select winner
                  </Button>
                </li>
              ))}
              {lb.length === 0 && (
                <p className="text-sm text-muted-foreground">No entries.</p>
              )}
            </ul>
            <div>
              <p className="mb-2 text-sm font-medium">Selected winners</p>
              {winners.map((w) => (
                <div
                  key={w.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <span>
                    Rank {w.rank} —{' '}
                    {(w.profiles as { display_name?: string } | null)
                      ?.display_name || w.user_id.slice(0, 8)}{' '}
                    · {formatLkr(w.prize_amount_lkr)}
                    {w.prize_awarded ? ' · Paid' : ''}
                  </span>
                  {!w.prize_awarded && (
                    <Button
                      size="sm"
                      disabled={saving}
                      onClick={() => awardPrize(w.id)}
                    >
                      Award prize
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="secondary" onClick={() => setViewId(null)}>
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
