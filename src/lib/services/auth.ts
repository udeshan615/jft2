import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { AppUser, Profile, UserRole, Wallet } from '@/lib/types/database';

export async function getCurrentUser(): Promise<AppUser | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const [{ data: profile }, { data: roleRow }, { data: wallet }] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('role', { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

    const role: UserRole = (roleRow?.role as UserRole) ?? ('user' as UserRole);

    return {
      id: user.id,
      email: user.email ?? null,
      profile: (profile as Profile) ?? null,
      role,
      wallet: (wallet as Wallet) ?? null,
    };
  } catch (e) {
    console.error('getCurrentUser error', e);
    return null;
  }
}

export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (user.role !== 'admin') {
    redirect('/dashboard');
  }
  return user;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}
