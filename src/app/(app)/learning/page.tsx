import { getCurrentUser } from '@/lib/services/auth';
import { getUserProgress } from '@/lib/services/content';
import { LearningHub } from '@/components/learning/learning-hub';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Learning' };

export default async function LearningPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const progress = await getUserProgress(user.id);
  const verified = user.profile?.verification_status === 'verified';
  return <LearningHub verified={verified} progress={progress} />;
}
