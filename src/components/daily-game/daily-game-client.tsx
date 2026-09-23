'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Gamepad2, Clock, Trophy, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils/cn';
import type {
  DailyGame,
  DailyGameAttempt,
  LeaderboardEntry,
} from '@/lib/types/database';

type Question = {
  id: string;
  question_text: string;
  question_type: string;
  image_url: string | null;
  options: { id: string; text: string }[];
  points: number;
  sort_order: number;
};

interface Props {
  game: DailyGame | null;
  questions: Question[];
  existingAttempt: DailyGameAttempt | null;
  leaderboard: LeaderboardEntry[];
  userId: string;
  isVerified: boolean;
}

function formatMs(ms: number | null) {
  if (ms == null) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

function countdownTo(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return '0m';
  const totalMin = Math.floor(diff / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function DailyGameClient({
  game,
  questions,
  existingAttempt,
  leaderboard,
  userId,
  isVerified,
}: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<'lobby' | 'playing' | 'result'>(
    existingAttempt ? 'result' : 'lobby'
  );
  const [attemptId, setAttemptId] = useState<string | null>(
    existingAttempt?.id ?? null
  );
  const [answers, setAnswers] = useState<Record<string, string>>(
    existingAttempt?.answers ?? {}
  );
  const [result, setResult] = useState<{
    score: number;
    max_score: number;
    duration_ms: number;
  } | null>(
    existingAttempt
      ? {
          score: existingAttempt.score,
          max_score: existingAttempt.max_score,
          duration_ms: existingAttempt.duration_ms ?? 0,
        }
      : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const state = useMemo(() => {
    if (!game || !game.is_enabled) return 'disabled';
    const now = Date.now();
    const s = new Date(game.starts_at).getTime();
    const e = new Date(game.ends_at).getTime();
    if (now < s) return 'upcoming';
    if (now > e) return 'ended';
    return 'live';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, tick]);

  async function startGame() {
    if (!game) return;
    setError(null);
    if (game.require_verified && !isVerified) {
      setError('You must be verified to play this game.');
      return;
    }
    if (existingAttempt) {
      setPhase('result');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('daily_game_attempts')
      .insert({
        game_id: game.id,
        user_id: userId,
        status: 'in_progress',
      })
      .select('*')
      .single();

    if (err) {
      // unique constraint = already submitted
      setError(err.message.includes('unique') ? 'You already played this game.' : err.message);
      setLoading(false);
      return;
    }
    setAttemptId(data.id);
    setPhase('playing');
    setLoading(false);
  }

  async function submitAnswers() {
    if (!attemptId) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase.rpc('submit_daily_game_attempt', {
      p_attempt_id: attemptId,
      p_answers: answers,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setResult(data as { score: number; max_score: number; duration_ms: number });
    setPhase('result');
    setLoading(false);
    router.refresh();
  }

  if (!game) {
    return (
      <EmptyState
        title="No Daily Game"
        description="Check back later when the admin publishes a game."
        icon={<Gamepad2 className="h-6 w-6" />}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{game.title}</h1>
          {game.description && (
            <p className="mt-1 text-sm text-muted-foreground">{game.description}</p>
          )}
        </div>
        <Badge
          variant={
            state === 'live'
              ? 'success'
              : state === 'upcoming'
                ? 'warning'
                : 'muted'
          }
        >
          {state.toUpperCase()}
        </Badge>
      </div>

      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {phase === 'lobby' && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {state === 'upcoming' && (
                <span>Starts in {countdownTo(game.starts_at)}</span>
              )}
              {state === 'live' && (
                <span>Ends in {countdownTo(game.ends_at)}</span>
              )}
              {state === 'ended' && <span>This game has ended</span>}
              {state === 'disabled' && <span>Not available</span>}
            </div>
            <p className="text-sm">
              Prize pool:{' '}
              <strong>
                LKR {Number(game.prize_amount_lkr).toLocaleString()}
              </strong>
              {game.max_winners > 1 ? ` · up to ${game.max_winners} winners` : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(game.starts_at).toLocaleString()} →{' '}
              {new Date(game.ends_at).toLocaleString()}
            </p>
            {state === 'live' && !existingAttempt && (
              <Button onClick={startGame} disabled={loading} className="w-full gap-2">
                {loading ? <Spinner size="sm" /> : <Gamepad2 className="h-4 w-4" />}
                Start Game
              </Button>
            )}
            {state === 'upcoming' && (
              <Button disabled className="w-full">
                Coming Soon
              </Button>
            )}
            {(state === 'ended' || existingAttempt) && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setPhase('result')}
              >
                View results
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {phase === 'playing' && (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <Card key={q.id}>
              <CardHeader className="pb-2">
                <p className="text-xs text-muted-foreground">
                  Question {idx + 1} · {q.points} pt
                </p>
                <CardTitle className="text-base">{q.question_text}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {q.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={q.image_url}
                    alt=""
                    className="mb-2 max-h-40 rounded-xl object-contain"
                  />
                )}
                {(q.options || []).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setAnswers((a) => ({ ...a, [q.id]: opt.id }))
                    }
                    className={cn(
                      'w-full rounded-xl border px-4 py-3 text-left text-sm transition',
                      answers[q.id] === opt.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    {opt.text}
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}
          <Button
            className="w-full"
            onClick={submitAnswers}
            disabled={loading || questions.length === 0}
          >
            {loading ? <Spinner size="sm" /> : 'Submit answers'}
          </Button>
        </div>
      )}

      {phase === 'result' && (
        <div className="space-y-4">
          {result && (
            <Card className="border-success/30">
              <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-success" />
                <p className="text-2xl font-semibold">
                  {result.score} / {result.max_score}
                </p>
                <p className="text-sm text-muted-foreground">
                  Time: {formatMs(result.duration_ms)}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  Leaderboard (Top {game.leaderboard_size})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {leaderboard.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No submissions yet
                </p>
              )}
              {leaderboard.map((row) => (
                <div
                  key={row.attempt_id}
                  className={cn(
                    'flex items-center justify-between rounded-xl border px-3 py-2.5',
                    row.user_id === userId
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm font-semibold text-muted-foreground">
                      #{row.rank}
                    </span>
                    <span className="text-sm font-medium">
                      {row.display_name || 'Player'}
                      {row.user_id === userId ? ' (you)' : ''}
                    </span>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{row.score} pts</p>
                    <p className="text-xs text-muted-foreground">
                      {formatMs(row.duration_ms)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
