import { createClient } from '@/lib/supabase/server';
import type { ContentKind, PracticeSession } from '@/lib/types/database';

export async function startPracticeSession(input: {
  kind: ContentKind;
  collection_id?: string;
  module_id?: string;
  total_questions: number;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('practice_sessions')
    .insert({
      user_id: user.id,
      kind: input.kind,
      collection_id: input.collection_id ?? null,
      module_id: input.module_id ?? null,
      total_questions: input.total_questions,
      metadata: input.metadata ?? {},
      status: 'in_progress',
    })
    .select()
    .single();
  if (error) throw error;
  return data as PracticeSession;
}

export async function submitAnswer(input: {
  session_id: string;
  question_id?: string;
  selected_option_id?: string;
  selected_text?: string;
  kanji_entry_id?: string;
  time_spent_ms?: number;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('submit_practice_answer', {
    p_session_id: input.session_id,
    p_question_id: input.question_id ?? null,
    p_selected_option_id: input.selected_option_id ?? null,
    p_selected_text: input.selected_text ?? null,
    p_kanji_entry_id: input.kanji_entry_id ?? null,
    p_time_spent_ms: input.time_spent_ms ?? null,
  });
  if (error) throw error;
  return data as {
    is_correct: boolean;
    points_earned: number;
    correct_option_id: string | null;
    correct_text: string | null;
    explanation: string | null;
  };
}

export async function completeSession(sessionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('complete_practice_session', {
    p_session_id: sessionId,
  });
  if (error) throw error;
  return data as {
    session_id: string;
    correct_count: number;
    total_questions: number;
    score_percent: number;
  };
}

export async function getRecentSessions(userId: string, limit = 10) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as PracticeSession[];
}
