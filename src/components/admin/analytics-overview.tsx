'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatLkr } from '@/lib/utils/format';
import {
  Users,
  BadgeCheck,
  Wallet,
  ShoppingBag,
  Share2,
  BookOpen,
  MessageSquare,
} from 'lucide-react';

type Snapshot = {
  users_total: number;
  users_new: number;
  users_verified: number;
  users_unverified: number;
  withdrawals_pending: number;
  withdrawals_paid_amount: number;
  commissions_pending: number;
  commissions_paid: number;
  product_revenue: number;
  orders_paid: number;
  referrals_total: number;
  referrals_period: number;
  practice_sessions: number;
  tickets_open: number;
  from: string;
  to: string;
};

const RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

export function AnalyticsOverview() {
  const supabase = createClient();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const to = new Date();
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const { data: snap, error: err } = await supabase.rpc('admin_analytics_snapshot', {
      p_from: from.toISOString(),
      p_to: to.toISOString(),
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setData(snap as Snapshot);
  }, [supabase, days]);

  useEffect(() => {
    load();
  }, [load]);

  function fmt(n: number) {
    return formatLkr(n);
  }

  const cards = data
    ? [
        { title: 'Total users', value: data.users_total, icon: Users, sub: `${data.users_new} new in range` },
        { title: 'Verified', value: data.users_verified, icon: BadgeCheck, sub: `${data.users_unverified} unverified` },
        { title: 'Product revenue', value: fmt(data.product_revenue), icon: ShoppingBag, sub: `${data.orders_paid} paid orders` },
        { title: 'Commissions paid', value: fmt(data.commissions_paid), icon: Wallet, sub: `${fmt(data.commissions_pending)} pending` },
        { title: 'Referrals', value: data.referrals_total, icon: Share2, sub: `${data.referrals_period} in range` },
        { title: 'Practice sessions', value: data.practice_sessions, icon: BookOpen, sub: 'In selected range' },
        { title: 'Pending withdrawals', value: data.withdrawals_pending, icon: Wallet, sub: fmt(data.withdrawals_paid_amount) + ' paid in range' },
        { title: 'Open tickets', value: data.tickets_open, icon: MessageSquare, sub: 'Support queue' },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">Platform analytics (aggregated, not raw user data)</p>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Button
              key={r.days}
              size="sm"
              variant={days === r.days ? 'default' : 'outline'}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm">
          {error.includes('relation') || error.includes('function')
            ? 'Run migration 007 to enable analytics.'
            : 'Something went wrong. Please try again.'}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.title}>
              <CardHeader className="pb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <c.icon className="h-4 w-4" />
                </div>
                <CardTitle className="text-base">{c.title}</CardTitle>
                <CardDescription>{c.sub}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-tight">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
