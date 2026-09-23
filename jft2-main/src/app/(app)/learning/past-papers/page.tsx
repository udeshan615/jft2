import { getCurrentUser } from '@/lib/services/auth';
import { listCollections } from '@/lib/services/content';
import { CollectionList } from '@/components/learning/collection-list';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Past Papers' };

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const verified = user.profile?.verification_status === 'verified';
  if (!verified) {
    return (
      <CollectionList
        title="Past Papers"
        description="Past exam papers for verified learners."
        items={[]}
        locked
        practiceKind="past_paper"
      />
    );
  }

  const { items } = await listCollections({
    kind: 'past_paper',
    status: 'published',
    activeOnly: true,
  });

  return (
    <CollectionList
      title="Past Papers"
      description="Past exam papers for verified learners."
      items={items}
      practiceKind="past_paper"
    />
  );
}
