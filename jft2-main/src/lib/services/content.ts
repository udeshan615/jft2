import { createClient } from '@/lib/supabase/server';
import type {
  ContentCollection,
  ContentKind,
  ContentStatus,
  KanjiEntry,
  LearningModule,
  Question,
  QuestionOption,
  UserProgress,
} from '@/lib/types/database';

export async function listCollections(opts: {
  kind?: ContentKind;
  status?: ContentStatus;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}) {
  const supabase = await createClient();
  let q = supabase
    .from('content_collections')
    .select('*', { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (opts.kind) q = q.eq('kind', opts.kind);
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.activeOnly) q = q.eq('is_active_version', true);
  if (opts.search) q = q.ilike('title', `%${opts.search}%`);
  if (opts.limit) q = q.range(opts.offset ?? 0, (opts.offset ?? 0) + opts.limit - 1);

  const { data, error, count } = await q;
  if (error) throw error;
  return { items: (data ?? []) as ContentCollection[], total: count ?? 0 };
}

export async function getCollection(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('content_collections')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as ContentCollection | null;
}

export async function createCollection(
  input: Partial<ContentCollection> & { kind: ContentKind; title: string }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('content_collections')
    .insert({
      ...input,
      created_by: user?.id,
      updated_by: user?.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ContentCollection;
}

export async function updateCollection(id: string, patch: Partial<ContentCollection>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('content_collections')
    .update({ ...patch, updated_by: user?.id })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as ContentCollection;
}

export async function publishCollection(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('publish_collection', {
    p_collection_id: id,
  });
  if (error) throw error;
  return data as string;
}

export async function duplicateCollection(id: string) {
  const supabase = await createClient();
  const src = await getCollection(id);
  if (!src) throw new Error('Not found');
  const copy = await createCollection({
    kind: src.kind,
    title: `${src.title} (Copy)`,
    description: src.description,
    book_number: src.book_number,
    paper_number: src.paper_number,
    level: src.level,
    difficulty: src.difficulty,
    requires_verification: src.requires_verification,
    time_limit_minutes: src.time_limit_minutes,
    status: 'draft',
    is_active_version: false,
    version: (src.version ?? 1) + 1,
    sort_order: src.sort_order,
    metadata: { duplicated_from: src.id },
  });
  return copy;
}

export async function listModules(collectionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('learning_modules')
    .select('*')
    .eq('collection_id', collectionId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as LearningModule[];
}

export async function getModuleWithQuestions(moduleId: string) {
  const supabase = await createClient();
  const { data: mod, error } = await supabase
    .from('learning_modules')
    .select('*')
    .eq('id', moduleId)
    .maybeSingle();
  if (error) throw error;
  if (!mod) return null;

  const { data: mqs } = await supabase
    .from('module_questions')
    .select('id, sort_order, question_id, questions(*, question_options(*))')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: true });

  const questions = (mqs ?? []).map((row: Record<string, unknown>) => {
    const q = row.questions as Question & { question_options?: QuestionOption[] };
    return {
      ...q,
      options: (q.question_options ?? []).sort(
        (a, b) => a.sort_order - b.sort_order
      ),
    };
  });

  return { module: mod as LearningModule, questions };
}

export async function listKanji(collectionId: string, lesson?: number) {
  const supabase = await createClient();
  let q = supabase
    .from('kanji_entries')
    .select('*')
    .eq('collection_id', collectionId)
    .order('sort_order', { ascending: true });
  if (lesson != null) q = q.eq('lesson_number', lesson);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as KanjiEntry[];
}

export async function getUserProgress(userId: string, kind?: ContentKind) {
  const supabase = await createClient();
  let q = supabase.from('user_progress').select('*').eq('user_id', userId);
  if (kind) q = q.eq('kind', kind);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as UserProgress[];
}

export async function getContentStats() {
  const supabase = await createClient();
  const kinds: ContentKind[] = [
    'model_paper',
    'past_paper',
    'kanji_book',
    'grammar',
    'listening',
    'reading',
  ];
  const stats: Record<string, { total: number; draft: number; published: number; needs_review: number }> = {};

  for (const kind of kinds) {
    const { data } = await supabase
      .from('content_collections')
      .select('status')
      .eq('kind', kind);
    const rows = data ?? [];
    stats[kind] = {
      total: rows.length,
      draft: rows.filter((r) => r.status === 'draft').length,
      published: rows.filter((r) => r.status === 'published').length,
      needs_review: rows.filter((r) => r.status === 'needs_review').length,
    };
  }
  return stats;
}
