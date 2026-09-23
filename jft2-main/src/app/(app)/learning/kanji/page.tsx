import { getCurrentUser } from '@/lib/services/auth';
import { listCollections } from '@/lib/services/content';
import { CollectionList } from '@/components/learning/collection-list';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Kanji Practice' };

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { items } = await listCollections({
    kind: 'kanji_book',
    status: 'published',
    activeOnly: true,
  });

  return (
    <CollectionList
      title="Kanji Practice"
      description="Practice kanji meaning and reading."
      items={items}
      practiceKind="kanji_book"
    />
  );
}
