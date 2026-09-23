import { getCurrentUser } from '@/lib/services/auth';
import { getNotifications } from '@/lib/services/notifications';
import { NotificationsClient } from '@/components/notifications/notifications-client';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const items = await getNotifications(user.id, { limit: 100 });
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Updates about your account and activity</p>
      </div>
      <NotificationsClient initial={items} />
    </div>
  );
}
