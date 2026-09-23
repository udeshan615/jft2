import { getCurrentUser } from '@/lib/services/auth';
import { listCollections } from '@/lib/services/content';
import { CollectionList } from '@/components/learning/collection-list';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Grammar Practice' };

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { items } = await listCollections({
    kind: 'grammar',
    status: 'published',
    activeOnly: true,
  });

  return (
    <CollectionList
      title="Grammar Practice"
      description="Grammar points and exercises."
      items={items}
      practiceKind="grammar"
    />
  );
}
