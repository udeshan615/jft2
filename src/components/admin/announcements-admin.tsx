'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';
import type { Announcement, AnnouncementStatus } from '@/lib/types/database';

interface Props {
  announcements: Announcement[];
  adminId: string;
}

export function AnnouncementsAdmin({ announcements: initial, adminId }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [edit, setEdit] = useState<Partial<Announcement> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function openNew() {
    setEdit({
      title: '',
      content: '',
      image_url: null,
      link_url: null,
      button_label: null,
      status: 'draft',
      sort_order: items.length,
      starts_at: null,
      ends_at: null,
    });
  }

  async function uploadImage(file: File) {
    if (!file.type.startsWith('image/')) {
      setMsg('Please choose an image');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setMsg('Image must be under 3 MB');
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `announcements/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('announcements')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setMsg(error.message);
      setUploading(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from('announcements').getPublicUrl(path);
    setEdit((e) => (e ? { ...e, image_url: publicUrl } : e));
    setUploading(false);
  }

  async function save() {
    if (!edit?.title) return;
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: edit.title,
      content: edit.content || null,
      image_url: edit.image_url || null,
      link_url: edit.link_url?.trim() || null,
      button_label: edit.button_label?.trim() || null,
      status: (edit.status || 'draft') as AnnouncementStatus,
      sort_order: edit.sort_order ?? 0,
      starts_at: edit.starts_at || null,
      ends_at: edit.ends_at || null,
      created_by: adminId,
    };

    if (edit.id) {
      const { error } = await supabase
        .from('announcements')
        .update(payload)
        .eq('id', edit.id);
      if (error) {
        setMsg(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from('announcements').insert(payload);
      if (error) {
        setMsg(error.message);
        setSaving(false);
        return;
      }
    }
    setEdit(null);
    setSaving(false);
    setMsg('Announcement saved');
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm('Delete this announcement?')) return;
    const supabase = createClient();
    await supabase.from('announcements').delete().eq('id', id);
    setItems((prev) => prev.filter((a) => a.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {msg && (
        <p className="rounded-xl bg-muted px-4 py-2 text-center text-sm">{msg}</p>
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Published announcements appear on the user Dashboard slideshow
        </p>
        <Button size="sm" onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                {a.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.image_url}
                    alt=""
                    className="h-14 w-20 rounded-lg object-cover"
                  />
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{a.title}</span>
                    <Badge
                      variant={
                        a.status === 'published'
                          ? 'success'
                          : a.status === 'archived'
                            ? 'muted'
                            : 'secondary'
                      }
                    >
                      {a.status}
                    </Badge>
                  </div>
                  {a.content && (
                    <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                      {a.content}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEdit({ ...a })}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(a.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        )}
      </div>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edit announcement' : 'New announcement'}
        size="lg"
      >
        {edit && (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={edit.title || ''}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={edit.content || ''}
                onChange={(e) => setEdit({ ...edit, content: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              {edit.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={edit.image_url}
                  alt=""
                  className="mb-2 h-24 rounded-xl object-cover"
                />
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Spinner size="sm" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload image
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Button label (optional)</Label>
                <Input
                  placeholder="e.g. Join WhatsApp"
                  value={edit.button_label || ''}
                  onChange={(e) =>
                    setEdit({ ...edit, button_label: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Button link URL (optional)</Label>
                <Input
                  type="url"
                  placeholder="https://wa.me/9477xxxxxxx"
                  value={edit.link_url || ''}
                  onChange={(e) =>
                    setEdit({ ...edit, link_url: e.target.value })
                  }
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Link එක තිබ්බොත් announcement යට button එකක් පේනවා (WhatsApp, Telegram, website, etc.).
            </p>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={edit.status || 'draft'}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    status: e.target.value as AnnouncementStatus,
                  })
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start date (optional)</Label>
                <Input
                  type="datetime-local"
                  value={
                    edit.starts_at
                      ? edit.starts_at.slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      starts_at: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End date (optional)</Label>
                <Input
                  type="datetime-local"
                  value={edit.ends_at ? edit.ends_at.slice(0, 16) : ''}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      ends_at: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={edit.sort_order ?? 0}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    sort_order: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={save} disabled={saving} className="gap-2">
                {saving && <Spinner size="sm" />}
                Save
              </Button>
              <Button variant="outline" onClick={() => setEdit(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
