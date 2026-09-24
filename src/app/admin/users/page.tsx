import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/server';
import { UsersAdmin, type AdminUserRow } from '@/components/admin/users-admin';

export const metadata = { title: 'Admin · Users' };

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.profile?.role !== 'admin') redirect('/dashboard');

  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, verification_status, role, referral_code, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-destructive">Failed to load users: {error.message}</p>
      </div>
    );
  }

  const ids = (profiles ?? []).map((p) => p.id);
  const balanceMap: Record<string, number> = {};
  const referralMap: Record<string, number> = {};

  if (ids.length) {
    const { data: wallets } = await supabase
      .from('wallets')
      .select('user_id, balance_lkr')
      .in('user_id', ids);
    for (const w of wallets ?? []) {
      balanceMap[w.user_id] = Number(w.balance_lkr) || 0;
    }

    const { data: refs } = await supabase
      .from('referrals')
      .select('referrer_id')
      .in('referrer_id', ids);
    for (const r of refs ?? []) {
      referralMap[r.referrer_id] = (referralMap[r.referrer_id] || 0) + 1;
    }
  }

  const users: AdminUserRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    display_name: p.display_name,
    verification_status: p.verification_status,
    role: p.role,
    referral_code: p.referral_code,
    created_at: p.created_at,
    balance_lkr: balanceMap[p.id] ?? 0,
    referral_count: referralMap[p.id] ?? 0,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Real users from the database. Search, filter, and review accounts.
        </p>
      </div>
      <UsersAdmin users={users} />
    </div>
  );
}
