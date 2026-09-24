import { requireAdmin } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/server';
import { KanjiBooksAdmin } from '@/components/admin/kanji-books-admin';

export const metadata = { title: 'Admin · Kanji Books' };

export default async function AdminKanjiBooksPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [{ data: books }, { data: lessons }, { data: entries }] = await Promise.all([
    supabase
      .from('content_collections')
      .select('id, title, description, book_number, sort_order, status')
      .eq('kind', 'kanji_book')
      .order('sort_order', { ascending: true }),
    supabase
      .from('learning_modules')
      .select(
        'id, collection_id, title, description, lesson_number, sort_order, intro_youtube_url, status'
      )
      .order('sort_order', { ascending: true }),
    supabase
      .from('kanji_entries')
      .select(
        'id, module_id, kanji, reading, meaning_si, meaning_en, sort_order, status'
      )
      .order('sort_order', { ascending: true }),
  ]);

  return (
    <KanjiBooksAdmin
      books={books ?? []}
      lessons={lessons ?? []}
      entries={entries ?? []}
      adminId={admin.id}
    />
  );
}
