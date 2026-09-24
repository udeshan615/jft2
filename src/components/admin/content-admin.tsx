'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Plus,
  Upload,
  Search,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  Archive,
  Copy,
  Eye,
} from 'lucide-react';
import type { ContentCollection, ContentKind, ContentStatus } from '@/lib/types/database';
import Link from 'next/link';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'success' | 'destructive'> = {
  draft: 'secondary',
  needs_review: 'outline',
  published: 'success',
  archived: 'outline',
};

interface ContentAdminProps {
  kind: ContentKind;
  title: string;
  description: string;
  showBookNumber?: boolean;
  showPaperNumber?: boolean;
  requiresVerificationDefault?: boolean;
}

export function ContentAdmin({
  kind,
  title,
  description,
  showBookNumber,
  showPaperNumber,
  requiresVerificationDefault = false,
}: ContentAdminProps) {
  const supabase = createClient();
  const [items, setItems] = useState<ContentCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    book_number: '',
    paper_number: '',
    level: '',
    difficulty: '',
  });
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('content_collections')
      .select('*')
      .eq('kind', kind)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    if (search.trim()) q = q.ilike('title', `%${search.trim()}%`);
    const { data } = await q;
    setItems((data ?? []) as ContentCollection[]);
    setLoading(false);
  }, [supabase, kind, statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    setMessage(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from('content_collections').insert({
      kind,
      title: form.title.trim(),
      description: form.description.trim() || null,
      book_number: form.book_number ? Number(form.book_number) : null,
      paper_number: form.paper_number ? Number(form.paper_number) : null,
      level: form.level || null,
      difficulty: form.difficulty || null,
      requires_verification: requiresVerificationDefault,
      status: 'draft',
      is_active_version: false,
      created_by: user?.id,
      updated_by: user?.id,
    });
    setCreating(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setShowCreate(false);
    setForm({ title: '', description: '', book_number: '', paper_number: '', level: '', difficulty: '' });
    setMessage('Created as draft.');
    load();
  }

  async function handlePublish(id: string) {
    if (!confirm('Publish this collection? Previous active version of the same book/paper will be archived.')) return;
    const { error } = await supabase.rpc('publish_collection', { p_collection_id: id });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage('Published successfully.');
    load();
  }

  async function handleDuplicate(id: string) {
    const src = items.find((i) => i.id === id);
    if (!src) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from('content_collections').insert({
      kind: src.kind,
      title: `${src.title} (Copy)`,
      description: src.description,
      book_number: src.book_number,
      paper_number: src.paper_number,
      level: src.level,
      difficulty: src.difficulty,
      requires_verification: src.requires_verification,
      status: 'draft',
      is_active_version: false,
      version: (src.version ?? 1) + 1,
      sort_order: src.sort_order,
      metadata: { duplicated_from: src.id },
      created_by: user?.id,
    });
    if (error) setMessage(error.message);
    else {
      setMessage('Duplicated as draft.');
      load();
    }
  }

  async function handleArchive(id: string) {
    if (!confirm('Archive this item?')) return;
    await supabase
      .from('content_collections')
      .update({ status: 'archived', is_active_version: false })
      .eq('id', id);
    load();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/learning?tab=import">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Upload className="h-4 w-4" />
              Import TXT
            </Button>
          </Link>
          <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm">{message}</div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-11 rounded-xl border border-border bg-card px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ContentStatus | 'all')}
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="needs_review">Needs review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <Button variant="ghost" size="icon" onClick={load} aria-label="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Create new</CardTitle>
            <CardDescription>Starts as Draft. Publish after adding content.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  placeholder="e.g. Model Paper 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {showBookNumber && (
                  <div className="space-y-2">
                    <Label>Book number</Label>
                    <Input
                      type="number"
                      value={form.book_number}
                      onChange={(e) => setForm((f) => ({ ...f, book_number: e.target.value }))}
                    />
                  </div>
                )}
                {showPaperNumber && (
                  <div className="space-y-2">
                    <Label>Paper number</Label>
                    <Input
                      type="number"
                      value={form.paper_number}
                      onChange={(e) => setForm((f) => ({ ...f, paper_number: e.target.value }))}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Input
                    value={form.level}
                    onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                    placeholder="N5 / Beginner"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Input
                    value={form.difficulty}
                    onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                    placeholder="easy / medium / hard"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating ? <Spinner className="h-4 w-4" /> : 'Create draft'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No content yet"
          description="Create a new item or import a TXT file to get started."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                    <span className="font-medium truncate">{item.title}</span>
                    <Badge variant={STATUS_VARIANT[item.status] ?? 'secondary'}>{item.status}</Badge>
                    {item.is_active_version && <Badge variant="default">Active</Badge>}
                    <span className="text-xs text-muted-foreground">v{item.version}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {item.description || 'No description'}
                    {item.book_number != null && ` · Book ${item.book_number}`}
                    {item.paper_number != null && ` · Paper ${item.paper_number}`}
                    {item.level && ` · ${item.level}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {item.status !== 'published' && (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => handlePublish(item.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Publish
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="gap-1" onClick={() => handleDuplicate(item.id)}>
                    <Copy className="h-3.5 w-3.5" />
                    Duplicate
                  </Button>
                  {item.status !== 'archived' && (
                    <Button size="sm" variant="ghost" className="gap-1" onClick={() => handleArchive(item.id)}>
                      <Archive className="h-3.5 w-3.5" />
                      Archive
                    </Button>
                  )}
                  <Link href={`/admin/learning/edit/${item.id}`}>
                    <Button size="sm" variant="ghost" className="gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      Manage
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
