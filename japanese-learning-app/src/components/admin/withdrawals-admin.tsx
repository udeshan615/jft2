'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

interface Row {
  id: string;
  user_id: string;
  amount_lkr: number;
  status: string;
  admin_notes: string | null;
  created_at: string;
  profiles?: { display_name: string | null; email: string | null } | null;
  payment_methods?: {
    type: string;
    label: string | null;
    account_name: string | null;
    account_number: string | null;
    bank_name: string | null;
    phone_number: string | null;
  } | null;
}

export function WithdrawalsAdmin({ rows: initial }: { rows: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState('all');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const filtered =
    filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  async function process(id: string, status: string, notes?: string) {
    if (status === 'paid' && !confirm('Mark this withdrawal as PAID?')) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc('process_withdrawal', {
      p_withdrawal_id: id,
      p_new_status: status,
      p_admin_notes: notes || null,
    });
    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, admin_notes: notes || r.admin_notes } : r
      )
    );
    setRejectId(null);
    setNote('');
    setMsg(`Updated to ${status}`);
    setLoading(false);
    router.refresh();
  }

  function fmt(n: number) {
    return `LKR ${Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
  }

  return (
    <div className="space-y-4">
      {msg && (
        <p className="rounded-xl bg-muted px-4 py-2 text-center text-sm">{msg}</p>
      )}
      <div className="flex items-center gap-2">
        <Label className="text-sm">Filter</Label>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-[180px]"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="processing">Processing</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <Card key={r.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {r.profiles?.display_name || r.profiles?.email || r.user_id}
                  </p>
                  <p className="text-lg font-semibold text-primary">
                    {fmt(r.amount_lkr)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                  {r.payment_methods && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.payment_methods.type === 'bank'
                        ? `${r.payment_methods.bank_name} · ${r.payment_methods.account_name} · ${r.payment_methods.account_number}`
                        : r.payment_methods.phone_number}
                    </p>
                  )}
                </div>
                <Badge
                  variant={
                    r.status === 'paid'
                      ? 'success'
                      : r.status === 'rejected' || r.status === 'cancelled'
                        ? 'destructive'
                        : r.status === 'pending'
                          ? 'warning'
                          : 'secondary'
                  }
                >
                  {r.status}
                </Badge>
              </div>
              {['pending', 'approved', 'processing'].includes(r.status) && (
                <div className="flex flex-wrap gap-2">
                  {r.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => process(r.id, 'approved')}
                      disabled={loading}
                    >
                      Approve
                    </Button>
                  )}
                  {(r.status === 'pending' || r.status === 'approved') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => process(r.id, 'processing')}
                      disabled={loading}
                    >
                      Processing
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => process(r.id, 'paid')}
                    disabled={loading}
                  >
                    Mark paid
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setRejectId(r.id)}
                    disabled={loading}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No withdrawals
          </p>
        )}
      </div>

      <Modal
        open={!!rejectId}
        onClose={() => setRejectId(null)}
        title="Reject withdrawal"
      >
        <div className="space-y-3">
          <Label>Reason (shown to user)</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          <Button
            variant="destructive"
            disabled={loading}
            onClick={() => rejectId && process(rejectId, 'rejected', note)}
          >
            {loading ? <Spinner size="sm" /> : 'Confirm reject'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
