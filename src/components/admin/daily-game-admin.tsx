'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trophy, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';
import type { DailyGame, DailyGameQuestion, LeaderboardEntry } from '@/lib/types/database';

interface Props {
  games: DailyGame[];
  adminId: string;
}

function toLocalInput(iso: string) {
  try {
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

export function DailyGameAdmin({ games: initial, adminId }: Props) {
  const router = useRouter();
  const [games] = useState(initial);
  const [edit, setEdit] = useState<Partial<DailyGame> | null>(null);
  const [questions, setQuestions] = useState<DailyGameQuestion[]>([]);
  const [qEdit, setQEdit] = useState<Partial<DailyGameQuestion> | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [viewId, setViewId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function openNew() {
    const start = new Date();
    start.setHours(start.getHours() + 1, 0, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 2);
    setEdit({
      title: 'Daily Game',
      description: '',
      status: 'draft',
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      prize_amount_lkr: 1000,
      max_winners: 1,
      leaderboard_size: 10,
      require_verified: false,
      max_attempts: 1,
      time_limit_seconds: null,
      is_enabled: true,
    });
  }

  async function saveGame() {
    if (!edit?.title || !edit.starts_at || !edit.ends_at) return;
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: edit.title,
      description: edit.description || null,
      status: edit.status || 'draft',
      starts_at: edit.starts_at,
      ends_at: edit.ends_at,
      prize_amount_lkr: Number(edit.prize_amount_lkr) || 0,
      max_winners: Number(edit.max_winners) || 1,
      leaderboard_size: Number(edit.leaderboard_size) || 10,
      require_verified: !!edit.require_verified,
      max_attempts: Number(edit.max_attempts) || 1,
      time_limit_seconds: edit.time_limit_seconds
        ? Number(edit.time_limit_seconds)
        : null,
      is_enabled: edit.is_enabled !== false,
      created_by: adminId,
    };

    if (edit.id) {
      const { error } = await supabase
        .from('daily_games')
        .update(payload)
        .eq('id', edit.id);
      if (error) {
        setMsg(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from('daily_games').insert(payload);
      if (error) {
        setMsg(error.message);
        setSaving(false);
        return;
      }
    }
    setEdit(null);
    setSaving(false);
    setMsg('Game saved');
    router.refresh();
  }

  async function openQuestions(gameId: string) {
    setViewId(gameId);
    const supabase = createClient();
    const { data } = await supabase
      .from('daily_game_questions')
      .select('*')
      .eq('game_id', gameId)
      .order('sort_order');
    setQuestions((data as DailyGameQuestion[]) || []);
    const { data: lb } = await supabase
      .from('daily_game_attempts')
      .select(
        `id, user_id, score, duration_ms, submitted_at, profiles:user_id ( display_name )`
      )
      .eq('game_id', gameId)
      .eq('status', 'submitted')
      .order('score', { ascending: false })
      .order('duration_ms', { ascending: true })
      .limit(20);
    const rows = (lb ?? []) as unknown as Array<{
      id: string;
      user_id: string;
      score: number;
      duration_ms: number | null;
      submitted_at: string | null;
      profiles?: { display_name?: string | null } | { display_name?: string | null }[] | null;
    }>;
    setLeaderboard(
      rows.map((row, i) => {
        const profile = Array.isArray(row.profiles)
          ? row.profiles[0]
          : row.profiles;
        return {
          rank: i + 1,
          user_id: row.user_id,
          display_name: profile?.display_name ?? null,
          score: row.score,
          duration_ms: row.duration_ms,
          submitted_at: row.submitted_at,
          attempt_id: row.id,
        };
      })
    );
  }

  async function saveQuestion() {
    if (!viewId || !qEdit?.question_text) return;
    setSaving(true);
    const supabase = createClient();
    const options = qEdit.options || [
      { id: 'a', text: 'Option A' },
      { id: 'b', text: 'Option B' },
    ];
    const payload = {
      game_id: viewId,
      question_text: qEdit.question_text,
      question_type: 'multiple_choice',
      options,
      correct_option_id: qEdit.correct_option_id || options[0]?.id,
      points: Number(qEdit.points) || 1,
      sort_order: Number(qEdit.sort_order) || questions.length,
    };
    if (qEdit.id) {
      await supabase
        .from('daily_game_questions')
        .update(payload)
        .eq('id', qEdit.id);
    } else {
      await supabase.from('daily_game_questions').insert(payload);
    }
    setQEdit(null);
    setSaving(false);
    openQuestions(viewId);
  }

  async function selectWinner(entry: LeaderboardEntry) {
    if (!viewId) return;
    const game = games.find((g) => g.id === viewId);
    if (!game) return;
    if (!confirm(`Select ${entry.display_name || 'user'} as winner and prepare prize?`))
      return;

    const supabase = createClient();
    const { data: winner, error } = await supabase
      .from('daily_game_winners')
      .upsert(
        {
          game_id: viewId,
          user_id: entry.user_id,
          attempt_id: entry.attempt_id,
          rank: entry.rank,
          score: entry.score,
          prize_amount_lkr: game.prize_amount_lkr,
          selected_by: adminId,
        },
        { onConflict: 'game_id,user_id' }
      )
      .select('*')
      .single();

    if (error) {
      setMsg(error.message);
      return;
    }

    if (confirm('Award prize to wallet now?')) {
      const { error: e2 } = await supabase.rpc('award_daily_game_prize', {
        p_winner_id: winner.id,
      });
      if (e2) setMsg(e2.message);
      else setMsg('Winner selected and prize awarded');
    } else {
      setMsg('Winner selected (prize not awarded yet)');
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {msg && (
        <p className="rounded-xl bg-muted px-4 py-2 text-center text-sm">{msg}</p>
      )}

      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Create games, add questions, view leaderboard, pick winners
        </p>
        <Button size="sm" onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" /> New game
        </Button>
      </div>

      <div className="space-y-3">
        {games.map((g) => (
          <Card key={g.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{g.title}</span>
                  <Badge variant="outline">{g.status}</Badge>
                  {!g.is_enabled && <Badge variant="muted">Disabled</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(g.starts_at).toLocaleString()} →{' '}
                  {new Date(g.ends_at).toLocaleString()} · Prize LKR{' '}
                  {Number(g.prize_amount_lkr).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openQuestions(g.id)}
                >
                  <HelpCircle className="mr-1 h-3.5 w-3.5" /> Manage
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setEdit({ ...g })}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {games.length === 0 && (
          <p className="text-sm text-muted-foreground">No games yet.</p>
        )}
      </div>

      {/* Edit game */}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edit game' : 'New Daily Game'}
        size="lg"
      >
        {edit && (
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input
                value={edit.title || ''}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={edit.description || ''}
                onChange={(e) =>
                  setEdit({ ...edit, description: e.target.value })
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Starts at</Label>
                <Input
                  type="datetime-local"
                  value={toLocalInput(edit.starts_at || '')}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      starts_at: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : edit.starts_at,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Ends at</Label>
                <Input
                  type="datetime-local"
                  value={toLocalInput(edit.ends_at || '')}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      ends_at: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : edit.ends_at,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={edit.status || 'draft'}
                onChange={(e) =>
                  setEdit({ ...edit, status: e.target.value as DailyGame['status'] })
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="live">Live</option>
                <option value="ended">Ended</option>
                <option value="cancelled">Cancelled</option>
              </Select>
              <p className="text-xs text-muted-foreground">
                Users see published/live/ended games. Set Published before start time.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>Prize (LKR)</Label>
                <Input
                  type="number"
                  value={edit.prize_amount_lkr ?? 0}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      prize_amount_lkr: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Max winners</Label>
                <Input
                  type="number"
                  value={edit.max_winners ?? 1}
                  onChange={(e) =>
                    setEdit({ ...edit, max_winners: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Leaderboard size</Label>
                <Input
                  type="number"
                  value={edit.leaderboard_size ?? 10}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      leaderboard_size: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Switch
                checked={!!edit.require_verified}
                onCheckedChange={(v) =>
                  setEdit({ ...edit, require_verified: v })
                }
                label="Require verified users"
              />
              <Switch
                checked={edit.is_enabled !== false}
                onCheckedChange={(v) => setEdit({ ...edit, is_enabled: v })}
                label="Enabled"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={saveGame} disabled={saving}>
                {saving ? <Spinner size="sm" /> : 'Save game'}
              </Button>
              <Button variant="outline" onClick={() => setEdit(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Questions + leaderboard */}
      <Modal
        open={!!viewId}
        onClose={() => setViewId(null)}
        title="Game management"
        size="lg"
      >
        <div className="max-h-[75vh] space-y-6 overflow-y-auto">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">Questions</h3>
              <Button
                size="sm"
                onClick={() =>
                  setQEdit({
                    question_text: '',
                    options: [
                      { id: 'a', text: '' },
                      { id: 'b', text: '' },
                      { id: 'c', text: '' },
                      { id: 'd', text: '' },
                    ],
                    correct_option_id: 'a',
                    points: 1,
                    sort_order: questions.length,
                  })
                }
              >
                Add question
              </Button>
            </div>
            {questions.map((q) => (
              <div
                key={q.id}
                className="mb-2 flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span className="line-clamp-1">{q.question_text}</span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setQEdit({ ...q })}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {questions.length === 0 && (
              <p className="text-sm text-muted-foreground">No questions yet</p>
            )}
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-2 font-medium">
              <Trophy className="h-4 w-4" /> Leaderboard
            </h3>
            {leaderboard.map((row) => (
              <div
                key={row.attempt_id}
                className="mb-2 flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span>
                  #{row.rank} {row.display_name || 'Player'} — {row.score} pts
                </span>
                <Button size="sm" variant="outline" onClick={() => selectWinner(row)}>
                  Select winner
                </Button>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-sm text-muted-foreground">No attempts yet</p>
            )}
          </section>
        </div>
      </Modal>

      {/* Question editor */}
      <Modal
        open={!!qEdit}
        onClose={() => setQEdit(null)}
        title="Question"
        size="md"
      >
        {qEdit && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Question text</Label>
              <Textarea
                value={qEdit.question_text || ''}
                onChange={(e) =>
                  setQEdit({ ...qEdit, question_text: e.target.value })
                }
              />
            </div>
            {(qEdit.options || []).map((opt, i) => (
              <div key={opt.id} className="flex gap-2">
                <Input
                  value={opt.text}
                  placeholder={`Option ${opt.id}`}
                  onChange={(e) => {
                    const options = [...(qEdit.options || [])];
                    options[i] = { ...opt, text: e.target.value };
                    setQEdit({ ...qEdit, options });
                  }}
                />
                <Button
                  type="button"
                  variant={
                    qEdit.correct_option_id === opt.id ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() =>
                    setQEdit({ ...qEdit, correct_option_id: opt.id })
                  }
                >
                  Correct
                </Button>
              </div>
            ))}
            <div className="space-y-1">
              <Label>Points</Label>
              <Input
                type="number"
                value={qEdit.points ?? 1}
                onChange={(e) =>
                  setQEdit({ ...qEdit, points: Number(e.target.value) })
                }
              />
            </div>
            <Button onClick={saveQuestion} disabled={saving}>
              {saving ? <Spinner size="sm" /> : 'Save question'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
