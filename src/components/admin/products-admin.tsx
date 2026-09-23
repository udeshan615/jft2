'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import type { Product } from '@/lib/types/database';
import { Plus } from 'lucide-react';

export function ProductsAdmin({ products: initial }: { products: Product[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [products, setProducts] = useState(initial);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price_lkr: '',
    category: '',
    commission_percent: '',
    whats_included: '',
  });

  async function reload() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true });
    setProducts((data ?? []) as Product[]);
    router.refresh();
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const price = Number(form.price_lkr);
    if (!form.title.trim() || Number.isNaN(price) || price < 0) {
      setMsg('Title and valid price required');
      setSaving(false);
      return;
    }
    const slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const { error } = await supabase.from('products').insert({
      title: form.title.trim(),
      slug: slug || null,
      description: form.description || null,
      price_lkr: price,
      category: form.category || null,
      whats_included: form.whats_included || null,
      commission_percent: form.commission_percent
        ? Number(form.commission_percent)
        : null,
      commission_enabled: true,
      status: 'draft',
      created_by: user?.id,
    });
    setSaving(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setShow(false);
    setForm({
      title: '',
      description: '',
      price_lkr: '',
      category: '',
      commission_percent: '',
      whats_included: '',
    });
    setMsg('Product created as draft.');
    reload();
  }

  async function setStatus(id: string, status: string) {
    const patch: Record<string, unknown> = { status };
    if (status === 'published') {
      patch.published_at = new Date().toISOString();
      patch.is_available = true;
    }
    if (status === 'disabled' || status === 'archived') {
      patch.is_available = false;
    }
    const { error } = await supabase.from('products').update(patch).eq('id', id);
    if (error) setMsg(error.message);
    else reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Paid products with optional referral commission overrides.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShow(true)}>
          <Plus className="h-4 w-4" />
          Create product
        </Button>
      </div>

      {msg && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm">{msg}</div>
      )}

      {show && (
        <Card>
          <CardHeader>
            <CardTitle>New product</CardTitle>
            <CardDescription>Starts as draft. Publish when ready.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createProduct} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Price (LKR)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price_lkr}
                    onChange={(e) => setForm((f) => ({ ...f, price_lkr: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Commission % (optional override)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    placeholder="Use global default"
                    value={form.commission_percent}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, commission_percent: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>What&apos;s included</Label>
                <Textarea
                  rows={2}
                  value={form.whats_included}
                  onChange={(e) => setForm((f) => ({ ...f, whats_included: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Spinner className="h-4 w-4" /> : 'Create draft'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShow(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {products.length === 0 ? (
        <EmptyState title="No products" description="Create your first paid product." />
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{p.title}</span>
                    <Badge variant="outline">{p.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    LKR {Number(p.price_lkr).toLocaleString()}
                    {p.commission_percent != null
                      ? ` · Commission ${p.commission_percent}%`
                      : ' · Global commission'}
                    {p.category ? ` · ${p.category}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.status !== 'published' && (
                    <Button size="sm" variant="outline" onClick={() => setStatus(p.id, 'published')}>
                      Publish
                    </Button>
                  )}
                  {p.status === 'published' && (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(p.id, 'disabled')}>
                      Disable
                    </Button>
                  )}
                  {p.status !== 'archived' && (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(p.id, 'archived')}>
                      Archive
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
