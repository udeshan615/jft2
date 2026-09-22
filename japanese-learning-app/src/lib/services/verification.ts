import { createClient } from '@/lib/supabase/server';
import type {
  VerificationTask,
  VerificationSubmission,
  UserVerification,
} from '@/lib/types/database';

export async function getEnabledVerificationTasks(): Promise<VerificationTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('verification_tasks')
    .select('*')
    .eq('is_enabled', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('getEnabledVerificationTasks', error);
    return [];
  }
  return (data as VerificationTask[]) ?? [];
}

export async function getUserSubmissions(
  userId: string
): Promise<VerificationSubmission[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('verification_submissions')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('getUserSubmissions', error);
    return [];
  }
  return (data as VerificationSubmission[]) ?? [];
}

export async function getUserVerification(
  userId: string
): Promise<UserVerification | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_verification')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return (data as UserVerification) ?? null;
}

export async function getReferralCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', userId);

  if (error) return 0;
  return count ?? 0;
}

export async function getAllVerificationTasksAdmin(): Promise<VerificationTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('verification_tasks')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return [];
  return (data as VerificationTask[]) ?? [];
}

export async function getPendingSubmissionsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('verification_submissions')
    .select(
      `
      *,
      profiles:user_id ( id, display_name, email, avatar_url ),
      verification_tasks:task_id ( id, title, task_type )
    `
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('getPendingSubmissionsAdmin', error);
    return [];
  }
  return data ?? [];
}
