import { createClient } from '@/lib/supabase/server';
import type { Announcement } from '@/lib/types/database';

export async function getActiveAnnouncements(): Promise<Announcement[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .limit(20);

  if (error) {
    console.error('getActiveAnnouncements', error);
    return [];
  }

  const list = (data as Announcement[]) ?? [];
  return list.filter((a) => {
    if (a.starts_at && a.starts_at > now) return false;
    if (a.ends_at && a.ends_at < now) return false;
    return true;
  });
}

export async function getAllAnnouncementsAdmin(): Promise<Announcement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data as Announcement[]) ?? [];
}
