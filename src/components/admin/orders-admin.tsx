'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

type OrderRow = {
  id: string;
  status: string;
  amount_lkr: number;
  created_at: string;
  payment_reference: string | null;
  product?: { title?: string; price_lkr?: number } | null;
  profiles?: { display_name?: string | null } | null;
};

export function OrdersAdmin({ orders: initial }: { orders: OrderRow[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [orders, setOrders] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function reload() {
    const { data } = await supabase
      .from('product_orders')
      .select(
        '*, product:products(title, price_lkr), profiles:profiles!product_orders_user_id_fkey(display_name)'
      )
      .order('created_at', { ascending: false })
      .limit(100);
    setOrders((data as OrderRow[]) ?? []);
    router.refresh();
  }

  async function confirmPaid(id: string) {
    if (
      !confirm(
        'Mark this order as PAID? This grants product access and may create a pending referral commission. Only do this after real payment is verified.'
      )
    )
      return;
    setBusy(id);
    setMsg(null);
    const { data, error } = await supabase.rpc('confirm_product_payment', {
      p_order_id: id,
      p_payment_reference: 'manual-admin',
      p_payment_note: 'Confirmed by admin',
    });
    setBusy(null);
    if (error) setMsg(error.message);
    else {
      setMsg(`Payment confirmed. ${JSON.stringify(data)}`);
      reload();
    }
  }

  async function refund(id: string) {
    if (!confirm('Refund this order? Access will be revoked and commissions cancelled/reversed.'))
      return;
    setBusy(id);
    const { error } = await supabase.rpc('refund_product_order', {
      p_order_id: id,
      p_note: 'Admin refund',
    });
    setBusy(null);
    if (error) setMsg(error.message);
    else {
      setMsg('Order refunded.');
      reload();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Product Orders</h1>
        <p className="text-muted-foreground">
          Confirm payment only after you verify the transfer. Do not mark paid from the browser
          alone without real payment.
        </p>
      </div>
      {msg && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm">{msg}</div>
      )}
      {orders.length === 0 ? (
        <EmptyState title="No orders" description="Orders appear when users start a purchase." />
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {o.product?.title ?? 'Product'} · LKR{' '}
                      {Number(o.amount_lkr).toLocaleString()}
                    </span>
                    <Badge variant="outline">{o.status}</Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {o.profiles?.display_name ?? 'User'} ·{' '}
                    {new Date(o.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {(o.status === 'pending' || o.status === 'awaiting_payment') && (
                    <Button
                      size="sm"
                      disabled={busy === o.id}
                      onClick={() => confirmPaid(o.id)}
                    >
                      Confirm paid
                    </Button>
                  )}
                  {o.status === 'paid' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === o.id}
                      onClick={() => refund(o.id)}
                    >
                      Refund
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
