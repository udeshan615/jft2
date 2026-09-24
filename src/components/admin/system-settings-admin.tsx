'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { SystemSetting } from '@/lib/types/database';

function parseVal(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      if (typeof p === 'string') return p;
      if (typeof p === 'boolean' || typeof p === 'number') return String(p);
      return v;
    } catch {
      return v;
    }
  }
  return String(v);
}

interface Props {
  settings: SystemSetting[];
}

const EDITABLE_KEYS = [
  'payment_bank_enabled',
  'payment_mobile_enabled',
  'payment_bank_instructions',
  'payment_mobile_instructions',
  'max_withdrawal_amount',
  'contact_email',
  'contact_whatsapp',
  'contact_message',
  'daily_game_enabled',
  'daily_game_start_time',
  'daily_game_end_time',
  'site_name',
  'support_email',
  'min_withdrawal_amount',
  'referral_percentage',
  'bank_fee_enabled',
  'bank_fee_amount',
  'verification_email_enabled',
  'withdrawal_email_enabled',
  'verification_auto_approve_minutes',
  'email_from_name',
  'homepage_hero_title',
  'homepage_hero_subtitle',
];

export function SystemSettingsAdmin({ settings: initial }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const s of initial) {
      map[s.key] = parseVal(s.value);
    }
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    const supabase = createClient();

    for (const key of EDITABLE_KEYS) {
      if (!(key in values)) continue;
      let store: string | boolean | number = values[key];
      if (
        key === 'daily_game_enabled' ||
        key === 'bank_fee_enabled' ||
        key === 'verification_email_enabled' ||
        key === 'withdrawal_email_enabled' ||
        key === 'payment_bank_enabled' ||
        key === 'payment_mobile_enabled'
      ) {
        store = values[key] === 'true' || values[key] === '1';
      } else if (
        key === 'min_withdrawal_amount' ||
        key === 'max_withdrawal_amount' ||
        key === 'referral_percentage' ||
        key === 'bank_fee_amount' ||
        key === 'verification_auto_approve_minutes'
      ) {
        store = Number(values[key]) || 0;
      }
      // Store as JSON-compatible value
      const jsonVal =
        typeof store === 'string' ? JSON.stringify(store) : store;

      await supabase
        .from('system_settings')
        .update({ value: jsonVal, updated_at: new Date().toISOString() })
        .eq('key', key);
    }

    setSaving(false);
    setMsg('Settings saved');
    router.refresh();
  }

  function field(
    key: string,
    label: string,
    hint?: string,
    type: 'text' | 'textarea' | 'time' | 'number' | 'toggle' = 'text'
  ) {
    if (type === 'toggle') {
      const checked =
        values[key] === 'true' || values[key] === '1';
      return (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium">{label}</p>
            {hint && (
              <p className="text-xs text-muted-foreground">{hint}</p>
            )}
          </div>
          <Switch
            checked={!!checked}
            onCheckedChange={(v) =>
              setValues((prev) => ({ ...prev, [key]: v ? 'true' : 'false' }))
            }
          />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label htmlFor={key}>{label}</Label>
        {type === 'textarea' ? (
          <Textarea
            id={key}
            value={values[key] ?? ''}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [key]: e.target.value }))
            }
          />
        ) : (
          <Input
            id={key}
            type={type === 'time' ? 'time' : type === 'number' ? 'number' : 'text'}
            value={values[key] ?? ''}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [key]: e.target.value }))
            }
          />
        )}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {msg && (
        <p className="rounded-xl bg-success/10 px-4 py-2 text-center text-sm text-success">
          {msg}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact</CardTitle>
          <CardDescription>
            Shown on the Contact page for users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {field('contact_email', 'Support email')}
          {field(
            'contact_whatsapp',
            'WhatsApp number or link',
            'e.g. +94771234567 or full https://wa.me/ link'
          )}
          {field('contact_message', 'Friendly message', undefined, 'textarea')}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Game</CardTitle>
          <CardDescription>
            Controls the Daily Game card on the Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {field(
            'daily_game_enabled',
            'Daily Game enabled',
            'Turn the game on or off for all users',
            'toggle'
          )}
          {field('daily_game_start_time', 'Start time', 'HH:MM', 'time')}
          {field('daily_game_end_time', 'End time', 'HH:MM', 'time')}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment & withdrawals</CardTitle>
          <CardDescription>
            Control which methods users can add and withdrawal limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {field('payment_bank_enabled', 'Bank accounts enabled', undefined, 'toggle')}
          {field('payment_mobile_enabled', 'Mobile Reload enabled', undefined, 'toggle')}
          {field('min_withdrawal_amount', 'Minimum withdrawal (LKR)', undefined, 'number')}
          {field('max_withdrawal_amount', 'Maximum withdrawal (LKR, 0 = no max)', undefined, 'number')}
          {field('bank_fee_enabled', 'Bank withdrawal fee ON/OFF', 'When ON, fee is deducted on bank withdrawals only', 'toggle')}
          {field('bank_fee_amount', 'Bank fee amount (LKR)', 'Default Rs. 30', 'number')}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email notifications</CardTitle>
          <CardDescription>
            Toggle system emails. Credentials stay server-side only (EMAIL_USER / EMAIL_APP_PASSWORD).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {field('verification_email_enabled', 'Verification Success Email', 'Send email when user becomes verified', 'toggle')}
          {field('withdrawal_email_enabled', 'Withdrawal Email', 'Send confirmation after withdrawal request', 'toggle')}
          {field('email_from_name', 'Sender display name')}
          {field('verification_auto_approve_minutes', 'WhatsApp auto-approve delay (minutes)', 'Default 10 — backend enforced', 'number')}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Homepage content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {field('homepage_hero_title', 'Hero title')}
          {field('homepage_hero_subtitle', 'Hero subtitle', undefined, 'textarea')}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {field('site_name', 'Site name')}
          {field('support_email', 'Support email (system)')}
          {field(
            'referral_percentage',
            'Referral percentage',
            'Percent of earnings given as referral bonus',
            'number'
          )}
          {field(
            'min_withdrawal_amount',
            'Minimum withdrawal (LKR)',
            undefined,
            'number'
          )}
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="gap-2">
        {saving && <Spinner size="sm" />}
        Save all settings
      </Button>
    </div>
  );
}
