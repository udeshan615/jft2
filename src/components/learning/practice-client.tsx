'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle2, XCircle, ArrowRight, Home } from 'lucide-react';
import type { ContentKind, KanjiEntry, Question, QuestionOption } from '@/lib/types/database';

interface PracticeClientProps {
  collectionId: string;
  kind: ContentKind;
}

type QItem = {
  id: string;
  type: 'question' | 'kanji';
  prompt: string;
  options: { id: string; label: string; text: string }[];
  kanji?: string;
  reading?: string;
  meaning?: string;
};

export function PracticeClient({ collectionId, kind }: PracticeClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<QItem[]>([]);
  const [index, setIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    is_correct: boolean;
    explanation?: string | null;
    correct_text?: string | null;
  } | null>(null);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ correct: number; total: number; pct: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        let practiceItems: QItem[] = [];

        if (kind === 'kanji_book') {
          const { data: kanji } = await supabase
            .from('kanji_entries')
            .select('*')
            .eq('collection_id', collectionId)
            .eq('status', 'published')
            .order('sort_order', { ascending: true })
            .limit(50);
          practiceItems = ((kanji ?? []) as KanjiEntry[]).map((k) => ({
            id: k.id,
            type: 'kanji' as const,
            prompt: 'What is the meaning of this kanji?',
            kanji: k.kanji,
            reading: k.reading ?? undefined,
            meaning: k.meaning_en ?? k.meaning_si ?? undefined,
            options: buildKanjiOptions(k, kanji as KanjiEntry[]),
          }));
        } else {
          const { data: modules } = await supabase
            .from('learning_modules')
            .select('id')
            .eq('collection_id', collectionId)
            .eq('status', 'published');
          const moduleIds = (modules ?? []).map((m) => m.id);

          if (moduleIds.length) {
            const { data: mqs } = await supabase
              .from('module_questions')
              .select('question_id, sort_order, questions(*, question_options(*))')
              .in('module_id', moduleIds)
              .order('sort_order', { ascending: true })
              .limit(50);

            practiceItems = (mqs ?? [])
              .map((row: Record<string, unknown>) => {
                const q = row.questions as Question & { question_options?: QuestionOption[] };
                if (!q || q.status !== 'published') return null;
                const opts = (q.question_options ?? [])
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((o) => ({ id: o.id, label: o.label, text: o.option_text }));
                return {
                  id: q.id,
                  type: 'question' as const,
                  prompt: q.prompt,
                  options: opts,
                };
              })
              .filter(Boolean) as QItem[];
          }

          // Fallback: approved draft questions linked via import without modules
          if (!practiceItems.length) {
            const { data: qs } = await supabase
              .from('questions')
              .select('*, question_options(*)')
              .eq('status', 'published')
              .order('created_at', { ascending: false })
              .limit(20);
            practiceItems = ((qs ?? []) as (Question & { question_options?: QuestionOption[] })[]).map(
              (q) => ({
                id: q.id,
                type: 'question' as const,
                prompt: q.prompt,
                options: (q.question_options ?? [])
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((o) => ({ id: o.id, label: o.label, text: o.option_text })),
              })
            );
          }
        }

        if (!practiceItems.length) {
          setError('No published questions in this collection yet.');
          setLoading(false);
          return;
        }

        setItems(practiceItems);

        const { data: session, error: sErr } = await supabase
          .from('practice_sessions')
          .insert({
            user_id: user.id,
            collection_id: collectionId,
            kind,
            total_questions: practiceItems.length,
            status: 'in_progress',
          })
          .select()
          .single();
        if (sErr) throw sErr;
        setSessionId(session.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to start practice');
      }
      setLoading(false);
    })();
  }, [collectionId, kind, router, supabase]);

  function buildKanjiOptions(current: KanjiEntry, all: KanjiEntry[]) {
    const correct = current.meaning_en || current.meaning_si || current.reading || '?';
    const distractors = all
      .filter((k) => k.id !== current.id)
      .map((k) => k.meaning_en || k.meaning_si || k.reading || '')
      .filter((t) => t && t !== correct)
      .slice(0, 3);
    const opts = [correct, ...distractors].slice(0, 4);
    while (opts.length < 4) opts.push(`Option ${opts.length + 1}`);
    // shuffle
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts.map((text, i) => ({
      id: `k-${current.id}-${i}`,
      label: String.fromCharCode(65 + i),
      text,
    }));
  }

  async function handleSubmit() {
    if (!selected || !sessionId || feedback) return;
    setSubmitting(true);
    const current = items[index];
    try {
      if (current.type === 'question') {
        const { data, error } = await supabase.rpc('submit_practice_answer', {
          p_session_id: sessionId,
          p_question_id: current.id,
          p_selected_option_id: selected,
          p_selected_text: null,
          p_kanji_entry_id: null,
          p_time_spent_ms: null,
        });
        if (error) throw error;
        setFeedback({
          is_correct: data.is_correct,
          explanation: data.explanation,
          correct_text: data.correct_text,
        });
      } else {
        // Kanji: client-side check against meaning (educational)
        const opt = current.options.find((o) => o.id === selected);
        const isCorrect =
          !!opt &&
          (opt.text === current.meaning ||
            opt.text === current.reading ||
            opt.text.toLowerCase() === (current.meaning ?? '').toLowerCase());
        await supabase.from('practice_answers').insert({
          session_id: sessionId,
          kanji_entry_id: current.id,
          selected_text: opt?.text,
          is_correct: isCorrect,
          points_earned: isCorrect ? 1 : 0,
        });
        if (isCorrect) {
          await supabase
            .from('practice_sessions')
            .update({
              correct_count: undefined as unknown as number, // will use rpc ideally
            })
            .eq('id', sessionId);
          // increment via read-modify
          const { data: sess } = await supabase
            .from('practice_sessions')
            .select('correct_count, score')
            .eq('id', sessionId)
            .single();
          if (sess) {
            await supabase
              .from('practice_sessions')
              .update({
                correct_count: (sess.correct_count ?? 0) + 1,
                score: Number(sess.score ?? 0) + 1,
              })
              .eq('id', sessionId);
          }
        }
        setFeedback({
          is_correct: isCorrect,
          correct_text: current.meaning || current.reading,
          explanation: current.reading ? `Reading: ${current.reading}` : null,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    }
    setSubmitting(false);
  }

  async function handleNext() {
    if (index + 1 >= items.length) {
      if (sessionId) {
        const { data } = await supabase.rpc('complete_practice_session', {
          p_session_id: sessionId,
        });
        if (data) {
          setResult({
            correct: data.correct_count,
            total: data.total_questions,
            pct: Number(data.score_percent),
          });
        }
      }
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setFeedback(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => router.push('/learning')}>
            Back to Learning
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (done && result) {
    return (
      <div className="mx-auto max-w-md space-y-6 animate-fade-in py-8 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-semibold">Practice complete</h1>
        <p className="text-muted-foreground">
          You got <span className="font-semibold text-foreground">{result.correct}</span> of{' '}
          {result.total} correct
        </p>
        <p className="text-3xl font-semibold text-primary">{Math.round(result.pct)}%</p>
        <div className="flex justify-center gap-3">
          <Button onClick={() => router.push('/learning')} className="gap-2">
            <Home className="h-4 w-4" />
            Learning hub
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const current = items[index];
  if (!current) return null;

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-fade-in">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Question {index + 1} / {items.length}
        </span>
        <Badge variant="outline">{kind.replace('_', ' ')}</Badge>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${((index + (feedback ? 1 : 0)) / items.length) * 100}%` }}
        />
      </div>

      <Card>
        <CardHeader>
          {current.kanji && (
            <div className="mb-4 text-center text-6xl font-medium leading-none tracking-tight">
              {current.kanji}
            </div>
          )}
          <CardTitle className="text-lg font-medium leading-relaxed">{current.prompt}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {current.options.map((o) => {
            const isSelected = selected === o.id;
            let extra = '';
            if (feedback) {
              if (o.id === selected && feedback.is_correct) extra = 'border-green-500 bg-green-50';
              else if (o.id === selected && !feedback.is_correct) extra = 'border-red-400 bg-red-50';
            }
            return (
              <button
                key={o.id}
                type="button"
                disabled={!!feedback}
                onClick={() => setSelected(o.id)}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                } ${extra}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                  {o.label}
                </span>
                <span className="pt-0.5 text-sm">{o.text}</span>
              </button>
            );
          })}

          {feedback && (
            <div
              className={`flex items-start gap-2 rounded-xl p-3 text-sm ${
                feedback.is_correct ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {feedback.is_correct ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
              )}
              <div>
                <p className="font-medium">{feedback.is_correct ? 'Correct!' : 'Incorrect'}</p>
                {!feedback.is_correct && feedback.correct_text && (
                  <p className="mt-0.5">Correct answer: {feedback.correct_text}</p>
                )}
                {feedback.explanation && <p className="mt-1 opacity-90">{feedback.explanation}</p>}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {!feedback ? (
              <Button className="flex-1" disabled={!selected || submitting} onClick={handleSubmit}>
                {submitting ? <Spinner className="h-4 w-4" /> : 'Submit'}
              </Button>
            ) : (
              <Button className="flex-1 gap-2" onClick={handleNext}>
                {index + 1 >= items.length ? 'Finish' : 'Next'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
