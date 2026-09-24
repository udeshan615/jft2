'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime } from '@/lib/utils/format';

export interface AdminUserRow {
  id: string;
  email: string | null;
  display_name: string | null;
  verification_status: string | null;
  role: string | null;
  referral_code: string | null;
  created_at: string;
  balance_lkr?: number | null;
  referral_count?: number | null;
}

interface Props {
  users: AdminUserRow[];
}

export function UsersAdmin({ users }: Props) {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter !== 'all' && (u.verification_status || 'unverified') !== statusFilter) {
        return false;
      }
      if (!term) return true;
      return (
        (u.email || '').toLowerCase().includes(term) ||
        (u.display_name || '').toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term) ||
        (u.referral_code || '').toLowerCase().includes(term)
      );
    });
  }, [users, q, statusFilter]);

  const pageRows = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="min-h-[44px] pl-9"
            placeholder="Search name, email, ID, referral code…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <select
          className="min-h-[44px] rounded-xl border border-border bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="all">All statuses</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} user{filtered.length === 1 ? '' : 's'}
      </p>

      {pageRows.length === 0 ? (
        <EmptyState
          title="No users found"
          description={q ? 'Try a different search.' : 'No registered users yet.'}
        />
      ) : (
        <div className="space-y-3">
          {/* Desktop table-ish cards */}
          {pageRows.map((u) => (
            <Card key={u.id} className="overflow-hidden">
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {u.display_name || 'Unnamed'}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {u.email || '—'}
                    </p>
                  </div>
                  <Badge
                    variant={
                      u.verification_status === 'verified'
                        ? 'success'
                        : u.verification_status === 'pending'
                          ? 'warning'
                          : 'muted'
                    }
                  >
                    {u.verification_status || 'unverified'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                  <div>
                    <span className="block font-medium text-foreground">ID</span>
                    <span className="break-all">{u.id.slice(0, 8)}…</span>
                  </div>
                  <div>
                    <span className="block font-medium text-foreground">Balance</span>
                    Rs. {Number(u.balance_lkr ?? 0).toLocaleString()}
                  </div>
                  <div>
                    <span className="block font-medium text-foreground">Referrals</span>
                    {u.referral_count ?? 0}
                  </div>
                  <div>
                    <span className="block font-medium text-foreground">Joined</span>
                    {u.created_at ? formatDateTime(u.created_at) : '—'}
                  </div>
                </div>
                {u.role === 'admin' && (
                  <Badge variant="secondary">Admin</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            className="min-h-[40px] rounded-lg border border-border px-3 text-sm disabled:opacity-40"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Prev
          </button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="min-h-[40px] rounded-lg border border-border px-3 text-sm disabled:opacity-40"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
