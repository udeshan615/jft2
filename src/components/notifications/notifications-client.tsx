'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import type { AppNotification } from '@/lib/types/database';

export function NotificationsClient({
  initial,
}: {
  initial: AppNotification[];
}) {
  const supabase = createClient();
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const shown = filter === 'unread' ? items.filter((i) => !i.is_read) : items;

  async function markRead(id: string) {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  async function markAll() {
    await supabase.rpc('mark_all_notifications_read');
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function remove(id: string) {
    await supabase.from('notifications').delete().eq('id', id);
    setItems((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          size="sm"
          variant={filter === 'unread' ? 'default' : 'outline'}
          onClick={() => setFilter('unread')}
        >
          Unread
        </Button>
        <Button size="sm" variant="ghost" onClick={markAll}>
          Mark all read
        </Button>
      </div>
      {shown.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up." />
      ) : (
        <div className="space-y-2">
          {shown.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border border-border p-4 ${!n.is_read ? 'bg-primary/5' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{n.title}</p>
                    <Badge variant="outline">{n.category}</Badge>
                    {!n.is_read && <Badge variant="default">New</Badge>}
                  </div>
                  {n.body && (
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  {n.link && (
                    <Link href={n.link}>
                      <Button size="sm" variant="outline">
                        Open
                      </Button>
                    </Link>
                  )}
                  {!n.is_read && (
                    <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                      Read
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(n.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
