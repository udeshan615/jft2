import { getCurrentUser } from '@/lib/services/auth';
import { listCollections } from '@/lib/services/content';
import { CollectionList } from '@/components/learning/collection-list';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Reading Practice' };

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { items } = await listCollections({
    kind: 'reading',
    status: 'published',
    activeOnly: true,
  });

  return (
    <CollectionList
      title="Reading Practice"
      description="Reading passages and questions."
      items={items}
      practiceKind="reading"
    />
  );
}
