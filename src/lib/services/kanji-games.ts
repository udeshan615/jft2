import { createClient } from '@/lib/supabase/server';

export type KanjiGame = {
  id: string;
  collection_id: string;
  game_key: string;
  title: string;
  title_si: string | null;
  description: string | null;
  intro_enabled: boolean;
  intro_youtube_url: string | null;
  summary: string | null;
  is_enabled: boolean;
  sort_order: number;
};

export type BookIntroSettings = {
  enabled: boolean;
  youtube_url: string | null;
};

export type GameKanjiCard = {
  id: string;
  kanji: string;
  reading: string | null;
  meaning_si: string | null;
  meaning_en: string | null;
};

export async function getBookIntroSettings(
  bookId: string
): Promise<BookIntroSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('content_collections')
    .select('metadata')
    .eq('id', bookId)
    .maybeSingle();
  const meta = (data?.metadata as Record<string, unknown>) || {};
  return {
    enabled: Boolean(meta.book_intro_enabled),
    youtube_url: (meta.book_intro_youtube_url as string) || null,
  };
}

export async function getBookIntroProgress(userId: string, bookId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('kanji_book_intro_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('collection_id', bookId)
    .maybeSingle();
  return data;
}

export async function getKanjiGames(bookId: string): Promise<KanjiGame[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('kanji_games')
    .select('*')
    .eq('collection_id', bookId)
    .eq('is_enabled', true)
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('getKanjiGames', error);
    return [];
  }
  return (data as KanjiGame[]) ?? [];
}

export async function getKanjiGame(
  bookId: string,
  gameKey: string
): Promise<KanjiGame | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('kanji_games')
    .select('*')
    .eq('collection_id', bookId)
    .eq('game_key', gameKey)
    .maybeSingle();
  return (data as KanjiGame) ?? null;
}

export async function getGameIntroProgress(userId: string, gameId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('kanji_game_intro_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .maybeSingle();
  return data;
}

/** All published kanji for a book (any lesson under the collection) */
export async function getBookKanjiCards(bookId: string): Promise<GameKanjiCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('kanji_entries')
    .select('id, kanji, reading, meaning_si, meaning_en')
    .eq('collection_id', bookId)
    .eq('status', 'published')
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('getBookKanjiCards', error);
    return [];
  }
  return (data as GameKanjiCard[]) ?? [];
}

export async function getAllKanjiGamesAdmin(bookId?: string): Promise<KanjiGame[]> {
  const supabase = await createClient();
  let q = supabase.from('kanji_games').select('*').order('sort_order', { ascending: true });
  if (bookId) q = q.eq('collection_id', bookId);
  const { data } = await q;
  return (data as KanjiGame[]) ?? [];
}
