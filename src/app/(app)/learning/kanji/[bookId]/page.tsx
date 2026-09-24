import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, PlayCircle } from 'lucide-react';
import { getKanjiBook, getKanjiLessons } from '@/lib/services/kanji-learning';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata = { title: 'Kanji Book' };

export default async function KanjiBookPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const book = await getKanjiBook(bookId);
  if (!book) notFound();
  const lessons = await getKanjiLessons(bookId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Link
          href="/learning/kanji"
          className="inline-flex items-center gap-1 text-sm text-[#123f6b] hover:underline"
        >
          <ChevronLeft className="h-4 w-4" /> All books
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#123f6b]">
          {book.title}
        </h1>
        {book.description && (
          <p className="text-sm text-muted-foreground">{book.description}</p>
        )}
      </div>

      {lessons.length === 0 ? (
        <EmptyState title="No lessons yet" description="Check back soon." />
      ) : (
        <div className="grid gap-3">
          {lessons.map((l, i) => (
            <Link key={l.id} href={`/learning/kanji/${bookId}/${l.id}`}>
              <div className="flex items-center gap-3 rounded-2xl border border-[#123f6b]/10 bg-white p-4 shadow-sm transition hover:shadow-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c99a2e]/15 text-sm font-bold text-[#c99a2e]">
                  {l.lesson_number ?? i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-[#123f6b]">{l.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {l.intro_youtube_url ? 'Includes introduction video' : 'Writing practice'}
                  </p>
                </div>
                <PlayCircle className="h-5 w-5 text-[#123f6b]/50" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
