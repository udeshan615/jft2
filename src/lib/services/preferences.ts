import { createClient } from '@/lib/supabase/server';

export interface UserPreferences {
  id: string;
  user_id: string;
  verification_intro_seen: boolean;
  dashboard_intro_seen: boolean;
  earnings_intro_seen: boolean;
  referral_intro_seen: boolean;
  preferences: Record<string, unknown>;
}

export async function getUserPreferences(
  userId: string
): Promise<UserPreferences | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) {
    // Ensure row exists
    const { data: created } = await supabase
      .from('user_preferences')
      .insert({ user_id: userId })
      .select('*')
      .single();
    return (created as UserPreferences) ?? null;
  }
  return data as UserPreferences;
}
