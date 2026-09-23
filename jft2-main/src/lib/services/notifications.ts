import { createClient } from '@/lib/supabase/server';
import type { AppNotification, NotificationPreferences } from '@/lib/types/database';

export async function getNotifications(userId: string, opts?: { unreadOnly?: boolean; limit?: number }) {
  const supabase = await createClient();
  let q = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(opts?.limit ?? 50);
  if (opts?.unreadOnly) q = q.eq('is_read', false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function getUnreadCount(userId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) return 0;
  return count ?? 0;
}

export async function getNotificationPrefs(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) {
    const { data: created } = await supabase
      .from('notification_preferences')
      .insert({ user_id: userId })
      .select()
      .single();
    return created as NotificationPreferences;
  }
  return data as NotificationPreferences;
}
