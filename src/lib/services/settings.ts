import { createClient } from '@/lib/supabase/server';
import type { SystemSetting } from '@/lib/types/database';

function parseValue(raw: unknown): unknown {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

export async function getPublicSettings(): Promise<Record<string, unknown>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .eq('is_public', true);

  if (error || !data) return {};

  const map: Record<string, unknown> = {};
  for (const row of data as Pick<SystemSetting, 'key' | 'value'>[]) {
    map[row.key] = parseValue(row.value);
  }
  return map;
}

export async function getSetting(key: string): Promise<unknown> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (!data) return null;
  return parseValue((data as { value: unknown }).value);
}

export async function getAllSettingsAdmin(): Promise<SystemSetting[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .order('key');

  if (error) return [];
  return (data as SystemSetting[]) ?? [];
}
