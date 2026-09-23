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
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(rewardEnabled);
  const [amount, setAmount] = useState(String(rewardAmount));
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
        description: 'Whether qualified referrals earn a reward',
        is_public: true,
      },
      {
        key: 'referral_reward_amount_lkr',
        value: Number(amount) || 0,
        description: 'Reward amount (LKR) per qualified referral',
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
            <Label>Amount (LKR) per qualified referral</Label>
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button onClick={saveConfig} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          {msg && (
            <p className="text-sm text-muted-foreground">{msg}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Reward is issued automatically when a referred user becomes{' '}
            <strong>verified</strong> (database-side).
          </p>
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
