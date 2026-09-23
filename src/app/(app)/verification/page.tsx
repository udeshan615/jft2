import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/services/auth';
import {
  getEnabledVerificationTasks,
  getUserSubmissions,
  getReferralCount,
} from '@/lib/services/verification';
import { getUserPreferences } from '@/lib/services/preferences';
import { VerificationClient } from '@/components/verification/verification-client';

export const metadata = { title: 'Verification' };

export default async function VerificationPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [tasks, submissions, referralCount, prefs] = await Promise.all([
    getEnabledVerificationTasks(),
    getUserSubmissions(user.id),
    getReferralCount(user.id),
    getUserPreferences(user.id),
  ]);

  return (
    <VerificationClient
      userId={user.id}
      overallStatus={user.profile?.verification_status ?? 'unverified'}
      tasks={tasks}
      submissions={submissions}
      referralCount={referralCount}
      introSeen={prefs?.verification_intro_seen ?? false}
    />
  );
}
