import { getCurrentUser } from '@/lib/services/auth';
import { getNotificationPrefs } from '@/lib/services/notifications';
import { SettingsClient } from '@/components/settings/settings-client';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const prefs = await getNotificationPrefs(user.id);
  return (
    <SettingsClient
      displayName={user.profile?.display_name || user.email?.split('@')[0] || 'User'}
      email={user.email}
      createdAt={user.profile?.created_at ?? null}
      prefs={prefs}
    />
  );
}
