'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, LogOut, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { AppUser } from '@/lib/types/database';

interface ProfileClientProps {
  user: AppUser;
}

export function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(
    user.profile?.display_name || ''
  );
  const [avatarUrl, setAvatarUrl] = useState(user.profile?.avatar_url);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = user.profile?.verification_status ?? 'unverified';

  async function handleAvatarChange(file: File) {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB.');
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/avatar.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setError(upErr.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(path);

    // Cache-bust
    const url = `${publicUrl}?t=${Date.now()}`;

    const { error: dbErr } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', user.id);

    if (dbErr) {
      setError(dbErr.message);
      setUploading(false);
      return;
    }

    setAvatarUrl(url);
    setUploading(false);
    setMessage('Photo updated');
    router.refresh();
  }

  async function handleSaveName() {
    setSaving(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();
    const { error: dbErr } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() || null })
      .eq('id', user.id);

    if (dbErr) {
      setError(dbErr.message);
    } else {
      setMessage('Profile saved');
      router.refresh();
    }
    setSaving(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Your account information</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <div className="relative">
            <Avatar
              src={avatarUrl}
              alt={displayName || 'User'}
              fallback={displayName || user.email || 'U'}
              size="xl"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition hover:bg-muted"
              aria-label="Change photo"
            >
              {uploading ? (
                <Spinner size="sm" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleAvatarChange(f);
              }}
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">
              {displayName || user.email?.split('@')[0]}
            </h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex justify-center gap-2">
              <Badge
                variant={
                  status === 'verified'
                    ? 'success'
                    : status === 'pending'
                      ? 'warning'
                      : 'muted'
                }
              >
                {status}
              </Badge>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Display name</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="displayName">Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder="Your display name"
            />
          </div>
          <Button
            size="sm"
            onClick={handleSaveName}
            disabled={saving}
            className="gap-2"
          >
            {saving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Referral code</span>
            <span className="font-mono font-medium">
              {user.profile?.referral_code ?? '—'}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Member since</span>
            <span>
              {user.profile?.created_at
                ? new Date(user.profile.created_at).toLocaleDateString()
                : '—'}
            </span>
          </div>
        </CardContent>
      </Card>

      {(message || error) && (
        <p
          className={`text-center text-sm ${error ? 'text-destructive' : 'text-success'}`}
        >
          {error || message}
        </p>
      )}

      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Log out
      </Button>
    </div>
  );
}
