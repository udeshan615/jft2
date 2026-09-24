import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/services/auth';
import {
  getKanjiBook,
  getKanjiLesson,
  getKanjiEntriesForLesson,
  getIntroProgress,
  getEntryProgress,
} from '@/lib/services/kanji-learning';
import { KanjiLessonClient } from '@/components/kanji/kanji-lesson-client';

export const metadata = { title: 'Kanji Lesson' };

export default async function KanjiLessonPage({
  params,
}: {
  params: Promise<{ bookId: string; lessonId: string }>;
}) {
  const { bookId, lessonId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [book, lesson, entries] = await Promise.all([
    getKanjiBook(bookId),
    getKanjiLesson(lessonId),
    getKanjiEntriesForLesson(lessonId),
  ]);
  if (!book || !lesson || lesson.collection_id !== bookId) notFound();

  const [intro, completed] = await Promise.all([
    getIntroProgress(user.id, lessonId),
    getEntryProgress(user.id, lessonId),
  ]);

  const introDone = !!(intro?.watched || intro?.skipped);

  return (
    <div className="space-y-4">
      <Link
        href={`/learning/kanji/${bookId}`}
        className="inline-flex items-center gap-1 text-sm text-[#123f6b] hover:underline"
      >
        <ChevronLeft className="h-4 w-4" /> {book.title}
      </Link>
      <KanjiLessonClient
        lesson={lesson}
        entries={entries}
        userId={user.id}
        introDone={introDone}
        completedIds={[...completed]}
        bookId={bookId}
      />
    </div>
  );
}
