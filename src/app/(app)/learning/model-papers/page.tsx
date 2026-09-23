import { getCurrentUser } from '@/lib/services/auth';
import { listCollections } from '@/lib/services/content';
import { CollectionList } from '@/components/learning/collection-list';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Model Papers' };

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { items } = await listCollections({
    kind: 'model_paper',
    status: 'published',
    activeOnly: true,
  });

  return (
    <CollectionList
      title="Model Papers"
      description="Practice model exam papers."
      items={items}
      practiceKind="model_paper"
    />
  );
}
