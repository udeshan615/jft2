import { createClient } from '@/lib/supabase/server';
import type { KanjiBook, KanjiLesson, KanjiEntry } from '@/lib/kanji/types';
export type { KanjiBook, KanjiLesson, KanjiEntry } from '@/lib/kanji/types';
export { extractYoutubeId } from '@/lib/kanji/types';

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

export async function getAllKanjiBooksAdmin(): Promise<KanjiBook[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('content_collections')
    .select('id, title, description, book_number, sort_order, status')
    .eq('kind', 'kanji_book')
    .order('sort_order', { ascending: true });
  return (data as KanjiBook[]) ?? [];
}
