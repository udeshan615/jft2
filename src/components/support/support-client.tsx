'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import type { Faq, SupportTicket } from '@/lib/types/database';

export function SupportClient({
  tickets: initial,
  faqs,
  contactEmail,
  contactWhatsapp,
  contactMessage,
  supportHours,
}: {
  tickets: SupportTicket[];
  faqs: Faq[];
  contactEmail: string;
  contactWhatsapp: string;
  contactMessage: string;
  supportHours: string;
}) {
  const supabase = createClient();
  const [tickets, setTickets] = useState(initial);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setSaving(true);
    setMsg(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject: subject.trim().slice(0, 200),
        category,
        status: 'open',
      })
      .select()
      .single();

    if (error || !ticket) {
      setMsg(error?.message ?? 'Could not create ticket');
      setSaving(false);
      return;
    }

    await supabase.from('support_messages').insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      body: body.trim(),
      is_internal: false,
    });

    setTickets((t) => [ticket as SupportTicket, ...t]);
    setSubject('');
    setBody('');
    setMsg('Ticket submitted. We will reply soon.');
    setSaving(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contact & Support</h1>
        <p className="text-muted-foreground">{contactMessage}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {contactEmail && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Email</CardTitle>
              <CardDescription>
                <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">
                  {contactEmail}
                </a>
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        {contactWhatsapp && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">WhatsApp</CardTitle>
              <CardDescription>
                <a
                  href={`https://wa.me/${contactWhatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {contactWhatsapp}
                </a>
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        {supportHours && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Hours</CardTitle>
              <CardDescription>{supportHours}</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      {faqs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((f) => (
              <div key={f.id}>
                <p className="font-medium text-sm">{f.question}</p>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                  {f.answer}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Open a support ticket</CardTitle>
          <CardDescription>We respond through this system and email when needed.</CardDescription>
        </CardHeader>
        <CardContent>
          {msg && (
            <div className="mb-3 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm">
              {msg}
            </div>
          )}
          <form onSubmit={createTicket} className="space-y-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="general">General</option>
                <option value="account">Account</option>
                <option value="payment">Payment</option>
                <option value="verification">Verification</option>
                <option value="technical">Technical</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} required />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner className="h-4 w-4" /> : 'Submit ticket'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {tickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your tickets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{t.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.category} · {new Date(t.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline">{t.status.replace('_', ' ')}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
