'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import type { NotificationPreferences } from '@/lib/types/database';

export function SettingsClient({
  displayName,
  email,
  createdAt,
  prefs: initialPrefs,
}: {
  displayName: string;
  email: string | null;
  createdAt: string | null;
  prefs: NotificationPreferences;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(displayName);
  const [prefs, setPrefs] = useState(initialPrefs);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pw, setPw] = useState({ next: '', confirm: '' });

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const clean = name.trim().slice(0, 80);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: clean })
      .eq('id', user.id);
    setSaving(false);
    if (error) setMsg(error.message);
    else {
      setMsg('Profile updated.');
      router.refresh();
    }
  }

  async function savePrefs() {
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: prefs.user_id,
        earnings: prefs.earnings,
        game: prefs.game,
        referral: prefs.referral,
        product: prefs.product,
        learning: prefs.learning,
        announcement: prefs.announcement,
        support: prefs.support,
        updated_at: new Date().toISOString(),
      });
    setSaving(false);
    if (error) setMsg(error.message);
    else setMsg('Notification preferences saved.');
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.next.length < 8) {
      setMsg('Password must be at least 8 characters.');
      return;
    }
    if (pw.next !== pw.confirm) {
      setMsg('Passwords do not match.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    setSaving(false);
    if (error) setMsg(error.message);
    else {
      setMsg('Password updated.');
      setPw({ next: '', confirm: '' });
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const prefRows: { key: keyof NotificationPreferences; label: string }[] = [
    { key: 'earnings', label: 'Earnings & withdrawals' },
    { key: 'game', label: 'Daily & referral games' },
    { key: 'referral', label: 'Referral updates' },
    { key: 'product', label: 'Product purchases' },
    { key: 'learning', label: 'New learning content' },
    { key: 'announcement', label: 'Announcements' },
    { key: 'support', label: 'Support ticket replies' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Account, notifications, and security</p>
      </div>

      {msg && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm">{msg}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Email and protected fields cannot be changed here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label>Display name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email ?? ''} disabled />
            </div>
            {createdAt && (
              <p className="text-xs text-muted-foreground">
                Member since {new Date(createdAt).toLocaleDateString()}
              </p>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner className="h-4 w-4" /> : 'Save profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
          <CardDescription>
            Account and security alerts cannot be fully disabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {prefRows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4">
              <Label htmlFor={row.key}>{row.label}</Label>
              <Switch
                id={row.key}
                checked={!!prefs[row.key]}
                onCheckedChange={(v) =>
                  setPrefs((p) => ({ ...p, [row.key]: v }))
                }
              />
            </div>
          ))}
          <Button onClick={savePrefs} disabled={saving}>
            Save preferences
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Change password or sign out.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={changePassword} className="space-y-3">
            <div className="space-y-2">
              <Label>New password</Label>
              <Input
                type="password"
                value={pw.next}
                onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm password</Label>
              <Input
                type="password"
                value={pw.confirm}
                onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled={saving}>
              Update password
            </Button>
          </form>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
