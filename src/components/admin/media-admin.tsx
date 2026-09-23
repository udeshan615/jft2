'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import type { MediaAsset } from '@/lib/types/database';

export function MediaAdmin() {
  const supabase = createClient();
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setItems((data ?? []) as MediaAsset[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Media / Assets</h1>
        <p className="text-muted-foreground">
          Uploaded images, audio and documents. Deletion is blocked when assets are referenced.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Library</CardTitle>
          <CardDescription>Storage registry for learning content assets.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Spinner />
          ) : items.length === 0 ? (
            <EmptyState
              title="No media yet"
              description="Assets appear here when uploaded from content editors or import flows."
            />
          ) : (
            <div className="space-y-2">
              {items.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.asset_type} · {m.bucket}
                      {m.size_bytes != null && ` · ${(m.size_bytes / 1024).toFixed(1)} KB`}
                    </p>
                  </div>
                  <Badge variant="outline">{m.is_public ? 'public' : 'private'}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
