import { createClient } from '@/lib/supabase/server';

export type KanjiBook = {
  id: string;
  title: string;
  description: string | null;
  book_number: number | null;
  sort_order: number;
  status: string;
};

export type KanjiLesson = {
  id: string;
  collection_id: string;
  title: string;
  description: string | null;
  lesson_number: number | null;
  sort_order: number;
  intro_youtube_url: string | null;
  status: string;
};

export type KanjiEntry = {
  id: string;
  collection_id: string;
  module_id: string | null;
  kanji: string;
  reading: string | null;
  meaning_en: string | null;
  meaning_si: string | null;
  stroke_count: number | null;
  sort_order: number;
  status: string;
};

function extractYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace('/', '') || null;
    }
    const v = u.searchParams.get('v');
    if (v) return v;
    const parts = u.pathname.split('/');
    const embedIdx = parts.indexOf('embed');
    if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
  } catch {
    /* ignore */
  }
  return null;
}

export { extractYoutubeId };

export async function getKanjiBooks(): Promise<KanjiBook[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('content_collections')
    .select('id, title, description, book_number, sort_order, status')
    .eq('kind', 'kanji_book')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('book_number', { ascending: true });
  if (error) {
    console.error('getKanjiBooks', error);
    return [];
  }
  return (data as KanjiBook[]) ?? [];
}

export async function getKanjiBook(bookId: string): Promise<KanjiBook | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('content_collections')
    .select('id, title, description, book_number, sort_order, status')
    .eq('id', bookId)
    .eq('kind', 'kanji_book')
    .maybeSingle();
  return (data as KanjiBook) ?? null;
}

export async function getKanjiLessons(bookId: string): Promise<KanjiLesson[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('learning_modules')
    .select(
      'id, collection_id, title, description, lesson_number, sort_order, intro_youtube_url, status'
    )
    .eq('collection_id', bookId)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('lesson_number', { ascending: true });
  if (error) {
    console.error('getKanjiLessons', error);
    return [];
  }
  return (data as KanjiLesson[]) ?? [];
}

export async function getKanjiLesson(lessonId: string): Promise<KanjiLesson | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('learning_modules')
    .select(
      'id, collection_id, title, description, lesson_number, sort_order, intro_youtube_url, status'
    )
    .eq('id', lessonId)
    .maybeSingle();
  return (data as KanjiLesson) ?? null;
}

export async function getKanjiEntriesForLesson(
  lessonId: string
): Promise<KanjiEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('kanji_entries')
    .select(
      'id, collection_id, module_id, kanji, reading, meaning_en, meaning_si, stroke_count, sort_order, status'
    )
    .eq('module_id', lessonId)
    .eq('status', 'published')
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('getKanjiEntriesForLesson', error);
    return [];
  }
  return (data as KanjiEntry[]) ?? [];
}

export async function getIntroProgress(userId: string, moduleId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('kanji_intro_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .maybeSingle();
  return data;
}

export async function getEntryProgress(userId: string, moduleId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('kanji_entry_progress')
    .select('kanji_entry_id, completed')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .eq('completed', true);
  return new Set((data ?? []).map((r) => r.kanji_entry_id as string));
}

/** Admin helpers (client will use supabase directly too) */
export async function getAllKanjiBooksAdmin(): Promise<KanjiBook[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('content_collections')
    .select('id, title, description, book_number, sort_order, status')
    .eq('kind', 'kanji_book')
    .order('sort_order', { ascending: true });
  return (data as KanjiBook[]) ?? [];
}
