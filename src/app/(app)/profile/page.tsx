import { getCurrentUser } from '@/lib/services/auth';
import { redirect } from 'next/navigation';
import { ProfileClient } from '@/components/profile/profile-client';

export const metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return <ProfileClient user={user} />;
}
