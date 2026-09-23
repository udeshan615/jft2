'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { Faq } from '@/lib/types/database';

export function FaqAdmin({ faqs: initial }: { faqs: Faq[] }) {
  const supabase = createClient();
  const [faqs, setFaqs] = useState(initial);
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim() || !a.trim()) return;
    const { data, error } = await supabase
      .from('faqs')
      .insert({
        question: q.trim(),
        answer: a.trim(),
        status: 'published',
        sort_order: faqs.length,
      })
      .select()
      .single();
    if (error) setMsg(error.message);
    else {
      setFaqs((f) => [...f, data as Faq]);
      setQ('');
      setA('');
      setMsg('FAQ published.');
    }
  }

  async function archive(id: string) {
    await supabase.from('faqs').update({ status: 'archived' }).eq('id', id);
    setFaqs((f) => f.map((x) => (x.id === id ? { ...x, status: 'archived' } : x)));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">FAQ</h1>
        <p className="text-muted-foreground">Shown on the Contact page when published.</p>
      </div>
      {msg && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm">{msg}</div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Add FAQ</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="space-y-3">
            <div className="space-y-2">
              <Label>Question</Label>
              <Input value={q} onChange={(e) => setQ(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Answer</Label>
              <Textarea rows={3} value={a} onChange={(e) => setA(e.target.value)} required />
            </div>
            <Button type="submit">Publish</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {faqs.map((f) => (
          <Card key={f.id}>
            <CardContent className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{f.question}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{f.answer}</p>
                <Badge variant="outline" className="mt-1">
                  {f.status}
                </Badge>
              </div>
              {f.status !== 'archived' && (
                <Button size="sm" variant="ghost" onClick={() => archive(f.id)}>
                  Archive
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
