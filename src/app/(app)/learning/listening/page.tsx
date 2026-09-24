import { getCurrentUser } from '@/lib/services/auth';
import { listCollections } from '@/lib/services/content';
import { CollectionList } from '@/components/learning/collection-list';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Listening Practice' };

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { items } = await listCollections({
    kind: 'listening',
    status: 'published',
    activeOnly: true,
  });

  return (
    <CollectionList
      title="Listening Practice"
      description="Audio and kaiwa practice."
      items={items}
      practiceKind="listening"
    />
  );
}
