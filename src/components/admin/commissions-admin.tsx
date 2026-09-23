'use client';

import { formatLkr, formatDateTime } from '@/lib/utils/format';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import type { ReferralCommission } from '@/lib/types/database';

export function CommissionsAdmin({
  commissions: initial,
}: {
  commissions: ReferralCommission[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function reload() {
    const { data } = await supabase
      .from('referral_commissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setItems((data ?? []) as ReferralCommission[]);
    router.refresh();
  }

  async function approve(id: string) {
    if (!confirm('Pay this commission into the referrer wallet?')) return;
    setBusy(id);
    setMsg(null);
    const { error } = await supabase.rpc('approve_referral_commission', {
      p_commission_id: id,
    });
    setBusy(null);
    if (error) setMsg(error.message);
    else {
      setMsg('Commission paid to wallet.');
      reload();
    }
  }

  async function reverse(id: string) {
    if (!confirm('Reverse this commission? A debit will be recorded if already paid.')) return;
    setBusy(id);
    const { error } = await supabase.rpc('reverse_referral_commission', {
      p_commission_id: id,
      p_note: 'Admin reversal',
    });
    setBusy(null);
    if (error) setMsg(error.message);
    else {
      setMsg('Commission reversed.');
      reload();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Referral Commissions</h1>
        <p className="text-muted-foreground">
          Approve pending commissions to credit wallets. Reverse if needed.
        </p>
      </div>
      {msg && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm">{msg}</div>
      )}
      {items.length === 0 ? (
        <EmptyState title="No commissions yet" description="Commissions appear after paid product orders with a referrer." />
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {formatLkr(c.amount_lkr)}
                    </span>
                    <Badge variant="outline">{c.status}</Badge>
                    <span className="text-muted-foreground">{c.source}</span>
                  </div>
                  <p className="text-muted-foreground">
                    Base {formatLkr(c.base_amount_lkr)}
                    {c.percent != null ? ` · ${c.percent}%` : ''}
                    {' · '}
                    {new Date(c.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {(c.status === 'pending' || c.status === 'approved') && (
                    <Button
                      size="sm"
                      disabled={busy === c.id}
                      onClick={() => approve(c.id)}
                    >
                      Approve & pay
                    </Button>
                  )}
                  {(c.status === 'paid' || c.status === 'pending') && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === c.id}
                      onClick={() => reverse(c.id)}
                    >
                      Reverse
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
