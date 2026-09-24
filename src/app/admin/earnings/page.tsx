import { requireAdmin } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata = { title: 'Admin · Earnings' };

export default async function AdminEarningsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: wallets }, { count: pendingWd }, { data: recentTx }] =
    await Promise.all([
      supabase.from('wallets').select('balance_lkr, pending_lkr, lifetime_earned_lkr, lifetime_withdrawn_lkr'),
      supabase
        .from('withdrawal_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('transactions')
        .select('id, type, amount_lkr, description, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(15),
    ]);

  const totalBalance = (wallets || []).reduce(
    (s, w) => s + Number(w.balance_lkr || 0),
    0
  );
  const totalEarned = (wallets || []).reduce(
    (s, w) => s + Number(w.lifetime_earned_lkr || 0),
    0
  );
  const totalWithdrawn = (wallets || []).reduce(
    (s, w) => s + Number(w.lifetime_withdrawn_lkr || 0),
    0
  );
  const totalPending = (wallets || []).reduce(
    (s, w) => s + Number(w.pending_lkr || 0),
    0
  );

  const fmt = (n: number) =>
    `LKR ${n.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Earnings overview</h1>
        <p className="text-muted-foreground">Platform wallet totals</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total user balances</CardDescription>
            <CardTitle className="text-xl text-primary">{fmt(totalBalance)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lifetime earned</CardDescription>
            <CardTitle className="text-xl">{fmt(totalEarned)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lifetime withdrawn</CardDescription>
            <CardTitle className="text-xl">{fmt(totalWithdrawn)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending holds / requests</CardDescription>
            <CardTitle className="text-xl">
              {fmt(totalPending)}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({pendingWd ?? 0} requests)
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(recentTx || []).map((t) => (
            <div
              key={t.id}
              className="flex justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span>
                {t.description || t.type}{' '}
                <span className="text-muted-foreground">
                  · {new Date(t.created_at).toLocaleString()}
                </span>
              </span>
              <span className="font-medium">
                {fmt(Number(t.amount_lkr))}
              </span>
            </div>
          ))}
          {(!recentTx || recentTx.length === 0) && (
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
