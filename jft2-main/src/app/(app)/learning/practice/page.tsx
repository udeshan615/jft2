import { getCurrentUser } from '@/lib/services/auth';
import { PracticeClient } from '@/components/learning/practice-client';
import { redirect } from 'next/navigation';
import type { ContentKind } from '@/lib/types/database';

export const metadata = { title: 'Practice' };

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string; kind?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const sp = await searchParams;
  const collectionId = sp.collection;
  const kind = (sp.kind ?? 'model_paper') as ContentKind;
  if (!collectionId) redirect('/learning');

  if (kind === 'past_paper' && user.profile?.verification_status !== 'verified') {
    redirect('/verification');
  }

  return <PracticeClient collectionId={collectionId} kind={kind} />;
}
