import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { getKanjiBooks } from '@/lib/services/kanji-learning';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata = { title: 'Kanji' };

export default async function KanjiBooksPage() {
  const books = await getKanjiBooks();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#123f6b]">Kanji</h1>
        <p className="text-sm text-muted-foreground">
          Choose a book to start writing practice.
        </p>
      </div>

      {books.length === 0 ? (
        <EmptyState
          title="No books published yet"
          description="Admin can add Kanji books from the admin panel."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {books.map((b) => (
            <Link key={b.id} href={`/learning/kanji/${b.id}`}>
              <div className="flex items-start gap-3 rounded-2xl border border-[#123f6b]/10 bg-white p-4 shadow-sm transition hover:shadow-md active:scale-[0.99]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#123f6b]/10 text-[#123f6b]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-[#123f6b]">{b.title}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                    {b.description ||
                      (b.book_number != null ? `Book ${b.book_number}` : 'Open lessons')}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
