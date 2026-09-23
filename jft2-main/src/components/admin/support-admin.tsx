'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import type { SupportMessage, SupportTicket } from '@/lib/types/database';

export function SupportAdmin({ tickets: initial }: { tickets: SupportTicket[] }) {
  const supabase = createClient();
  const [tickets, setTickets] = useState(initial);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function openTicket(id: string) {
    setActive(id);
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });
    setMessages((data ?? []) as SupportMessage[]);
  }

  async function setStatus(id: string, status: string) {
    await supabase.from('support_tickets').update({ status }).eq('id', id);
    setTickets((t) => t.map((x) => (x.id === id ? { ...x, status } : x)));
  }

  async function sendReply() {
    if (!active || !reply.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('support_messages').insert({
      ticket_id: active,
      sender_id: user.id,
      body: reply.trim(),
      is_internal: internal,
    });
    if (error) {
      setMsg(error.message);
      return;
    }
    await supabase
      .from('support_tickets')
      .update({ status: 'waiting_user', last_message_at: new Date().toISOString() })
      .eq('id', active);
    setReply('');
    openTicket(active);
    setMsg('Reply sent.');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Support tickets</h1>
        <p className="text-muted-foreground">
          Internal notes are hidden from users. Replies notify via in-app when configured.
        </p>
      </div>
      {msg && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm">{msg}</div>
      )}
      {tickets.length === 0 ? (
        <EmptyState title="No tickets" description="User support tickets appear here." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            {tickets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => openTicket(t.id)}
                className={`w-full rounded-xl border border-border p-3 text-left text-sm transition hover:bg-muted ${
                  active === t.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium line-clamp-1">{t.subject}</span>
                  <Badge variant="outline">{t.status.replace('_', ' ')}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.category} · {new Date(t.updated_at).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
          <Card>
            <CardContent className="space-y-3 p-4">
              {!active ? (
                <p className="text-sm text-muted-foreground">Select a ticket</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1">
                    {['open', 'waiting_user', 'waiting_support', 'resolved', 'closed'].map(
                      (s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant="outline"
                          onClick={() => setStatus(active, s)}
                        >
                          {s.replace('_', ' ')}
                        </Button>
                      )
                    )}
                  </div>
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`rounded-lg px-3 py-2 text-sm ${
                          m.is_internal ? 'bg-amber-50 border border-amber-200' : 'bg-muted'
                        }`}
                      >
                        {m.is_internal && (
                          <span className="text-[10px] font-medium text-amber-700">INTERNAL</span>
                        )}
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(m.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Textarea
                    rows={3}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply…"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={internal}
                      onChange={(e) => setInternal(e.target.checked)}
                    />
                    Internal note (hidden from user)
                  </label>
                  <Button onClick={sendReply}>Send</Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
