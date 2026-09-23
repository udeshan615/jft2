'use client';

import { formatLkr, friendlyError } from '@/lib/utils/format';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import type { Product, ProductAccess } from '@/lib/types/database';
import { ShoppingBag, Check } from 'lucide-react';

export function ShopList({ products }: { products: Product[] }) {
  if (!products.length) {
    return (
      <EmptyState title="No products yet" description="Check back soon for paid resources." />
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {products.map((p) => (
        <Link key={p.id} href={`/shop/${p.id}`}>
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">{p.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {p.short_description || p.description || 'View details'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-lg font-semibold text-primary">
                {formatLkr(p.price_lkr)}
              </span>
              {p.category && <Badge variant="outline">{p.category}</Badge>}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export function ProductDetailClient({
  product,
  hasAccess,
  commissionPercent,
}: {
  product: Product;
  hasAccess: boolean;
  commissionPercent: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  async function purchase() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const { data, error } = await supabase.rpc('create_product_order', {
        p_product_id: product.id,
      });
      if (error) throw error;
      setOrderId(data as string);
      setMsg(
        'Order created. Complete payment as instructed, then an admin will confirm. You will get access after payment is verified.'
      );
      router.refresh();
    } catch (e) {
      setMsg(friendlyError(e));
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{product.title}</h1>
        {product.category && (
          <Badge variant="outline" className="mt-2">
            {product.category}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl text-primary">
            {formatLkr(product.price_lkr)}
          </CardTitle>
          <CardDescription>
            Referral commission: product override or global default ({commissionPercent}%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {product.description && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
          )}
          {product.whats_included && (
            <div>
              <p className="text-sm font-medium mb-1">What&apos;s included</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {product.whats_included}
              </p>
            </div>
          )}

          {msg && (
            <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm">
              {msg}
              {orderId && (
                <p className="mt-1 text-xs text-muted-foreground">Order ID: {orderId}</p>
              )}
            </div>
          )}

          {hasAccess ? (
            <div className="flex items-center gap-2 text-success">
              <Check className="h-5 w-5" />
              <span className="font-medium">Purchased — access granted</span>
            </div>
          ) : (
            <Button className="w-full gap-2" disabled={busy} onClick={purchase}>
              {busy ? <Spinner className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
              Purchase
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            Payment is confirmed by the platform after verification. Orders are not marked paid
            automatically from this page.
          </p>
        </CardContent>
      </Card>

      <Link href="/shop" className="text-sm text-primary hover:underline">
        ← Back to shop
      </Link>
    </div>
  );
}

export function PurchasesClient({
  orders,
  access,
}: {
  orders: {
    id: string;
    status: string;
    amount_lkr: number;
    created_at: string;
    product?: Product | null;
  }[];
  access: ProductAccess[];
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Purchases</h1>
        <p className="text-muted-foreground">Orders and product access</p>
      </div>
      {orders.length === 0 ? (
        <EmptyState title="No purchases" description="Browse the shop to get started." />
      ) : (
        <div className="space-y-2">
          {orders.map((o) => {
            const has = access.some(
              (a) => a.product_id === o.product?.id && a.status === 'active'
            );
            return (
              <Card key={o.id}>
                <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{o.product?.title ?? 'Product'}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatLkr(o.amount_lkr)} ·{' '}
                      {new Date(o.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{o.status}</Badge>
                    {has && o.product && (
                      <Link href={`/shop/${o.product.id}`}>
                        <Button size="sm" variant="outline">
                          Access
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
