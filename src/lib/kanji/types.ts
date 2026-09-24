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

/** Parse YouTube URL or bare 11-char id → embed id (client-safe) */
export function extractYoutubeId(url: string | null | undefined): string | null {
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
