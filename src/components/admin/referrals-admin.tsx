'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Referral } from '@/lib/types/database';

export function ReferralsAdmin({
  overview,
  referrals,
  rewardEnabled,
  rewardAmount,
  rewardTrigger = 'on_verified',
}: {
  overview: {
    total: number;
    qualified: number;
    rewarded: number;
    today: number;
  };
  referrals: Referral[];
  rewardEnabled: boolean;
  rewardAmount: number;
  rewardTrigger?: 'on_verified' | 'on_join';
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(rewardEnabled);
  const [amount, setAmount] = useState(String(rewardAmount));
  const [trigger, setTrigger] = useState<'on_verified' | 'on_join'>(
    rewardTrigger === 'on_join' ? 'on_join' : 'on_verified'
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function saveConfig() {
    setSaving(true);
    setMsg(null);
    const supabase = createClient();
    const rows = [
      {
        key: 'referral_reward_enabled',
        value: enabled,
        description: 'Whether referrals earn a reward',
        is_public: true,
      },
      {
        key: 'referral_reward_amount_lkr',
        value: Number(amount) || 0,
        description: 'Reward amount (LKR) per referral',
        is_public: true,
      },
      {
        key: 'referral_reward_trigger',
        value: trigger,
        description: 'When to credit: on_verified | on_join',
        is_public: true,
      },
      {
        key: 'referral_qualify_on_verified',
        value: trigger === 'on_verified',
        description: 'Legacy mirror of on_verified trigger',
        is_public: true,
      },
    ];
    for (const row of rows) {
      const { error } = await supabase.from('system_settings').upsert(
        {
          key: row.key,
          value: row.value,
          description: row.description,
          is_public: row.is_public,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
      if (error) {
        setMsg(error.message);
        setSaving(false);
        return;
      }
    }
    setMsg('Saved');
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total referrals', value: overview.total },
          { label: 'Qualified+', value: overview.qualified },
          { label: 'Rewarded', value: overview.rewarded },
          { label: 'Today', value: overview.today },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reward configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              id="ref-enabled"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="ref-enabled">Enable referral rewards</Label>
          </div>
          <div className="space-y-2 max-w-xs">
            <Label>Amount (LKR) per referral</Label>
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>When to add reward to wallet</Label>
            <div className="space-y-2 rounded-xl border border-border p-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="radio"
                  name="ref-trigger"
                  className="mt-1"
                  checked={trigger === 'on_verified'}
                  onChange={() => setTrigger('on_verified')}
                />
                <span>
                  <span className="font-medium">Verified වුණාම</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Referred user account verified වූ පසුව wallet එකට amount එකතු වේ
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="radio"
                  name="ref-trigger"
                  className="mt-1"
                  checked={trigger === 'on_join'}
                  onChange={() => setTrigger('on_join')}
                />
                <span>
                  <span className="font-medium">Join වුණාම</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Referral code එකෙන් register වූ විගස wallet එකට amount එකතු වේ
                  </span>
                </span>
              </label>
            </div>
          </div>

          <Button onClick={saveConfig} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          {msg && (
            <p
              className={
                msg === 'Saved' ? 'text-sm text-emerald-600' : 'text-sm text-destructive'
              }
            >
              {msg}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referrals yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {referrals.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {r.referred_profile?.display_name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="muted" className="capitalize">
                    {r.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
