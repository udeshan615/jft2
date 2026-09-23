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
import {
  Upload,
  FileText,
  Check,
  X,
  AlertTriangle,
  BookOpen,
  Languages,
  Headphones,
  BookMarked,
  ScrollText,
  BookA,
} from 'lucide-react';
import type { ContentImport, ContentKind, ImportExtractedItem } from '@/lib/types/database';
import {
  parseKanjiFromTxt,
  parseQuestionsFromTxt,
  detectContentKindFromFilename,
} from '@/lib/services/txt-parser';
import Link from 'next/link';

const KIND_META: Record<
  string,
  { label: string; icon: typeof BookOpen; href: string }
> = {
  model_paper: { label: 'Model Papers', icon: FileText, href: '/admin/model-papers' },
  past_paper: { label: 'Past Papers', icon: ScrollText, href: '/admin/past-papers' },
  kanji_book: { label: 'Kanji', icon: Languages, href: '/admin/kanji' },
  grammar: { label: 'Grammar', icon: BookA, href: '/admin/grammar' },
  listening: { label: 'Listening', icon: Headphones, href: '/admin/listening' },
  reading: { label: 'Reading', icon: BookMarked, href: '/admin/reading' },
};

export function LearningAdmin() {
  const supabase = createClient();
  const [stats, setStats] = useState<Record<string, { total: number; draft: number; published: number; needs_review: number }>>({});
  const [imports, setImports] = useState<ContentImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [txt, setTxt] = useState('');
  const [filename, setFilename] = useState('import.txt');
  const [kind, setKind] = useState<ContentKind>('model_paper');
  const [processing, setProcessing] = useState(false);
  const [activeImport, setActiveImport] = useState<string | null>(null);
  const [reviewItems, setReviewItems] = useState<ImportExtractedItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState('');
  const [collections, setCollections] = useState<{ id: string; title: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const kinds = Object.keys(KIND_META) as ContentKind[];
    const s: typeof stats = {};
    for (const k of kinds) {
      const { data } = await supabase.from('content_collections').select('status').eq('kind', k);
      const rows = data ?? [];
      s[k] = {
        total: rows.length,
        draft: rows.filter((r) => r.status === 'draft').length,
        published: rows.filter((r) => r.status === 'published').length,
        needs_review: rows.filter((r) => r.status === 'needs_review').length,
      };
    }
    setStats(s);
    const { data: imps } = await supabase
      .from('content_imports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setImports((imps ?? []) as ContentImport[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('content_collections')
        .select('id, title')
        .eq('kind', kind)
        .order('created_at', { ascending: false })
        .limit(50);
      setCollections((data ?? []) as { id: string; title: string }[]);
    })();
  }, [kind, supabase]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const detected = detectContentKindFromFilename(file.name);
    if (detected in KIND_META) setKind(detected as ContentKind);
    const text = await file.text();
    setTxt(text);
  }

  async function handleProcess() {
    if (!txt.trim()) {
      setMessage('Paste or upload TXT content first.');
      return;
    }
    setProcessing(true);
    setMessage(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: job, error } = await supabase
      .from('content_imports')
      .insert({
        kind,
        filename,
        original_text: txt,
        collection_id: collectionId || null,
        status: 'extracting',
        created_by: user?.id,
      })
      .select()
      .single();

    if (error || !job) {
      setMessage(error?.message ?? 'Failed to create import');
      setProcessing(false);
      return;
    }

    try {
      const items =
        kind === 'kanji_book' ? parseKanjiFromTxt(txt) : parseQuestionsFromTxt(txt);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await supabase.from('import_extracted_items').insert({
          import_id: job.id,
          item_type: kind === 'kanji_book' ? 'kanji' : 'question',
          sort_order: i,
          raw_segment: (item as { raw_segment?: string }).raw_segment ?? null,
          extracted: item,
          confidence: item.confidence,
          review_status: 'pending',
        });
      }

      await supabase
        .from('content_imports')
        .update({
          status: items.length ? 'needs_review' : 'failed',
          parser_used: 'deterministic',
          stats: { extracted: items.length },
          error_message: items.length ? null : 'No items detected',
        })
        .eq('id', job.id);

      setMessage(`Extracted ${items.length} item(s). Review below.`);
      setActiveImport(job.id);
      await loadReview(job.id);
      load();
    } catch (err) {
      await supabase
        .from('content_imports')
        .update({
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Parse error',
        })
        .eq('id', job.id);
      setMessage('Processing failed.');
    }
    setProcessing(false);
  }

  async function loadReview(importId: string) {
    const { data } = await supabase
      .from('import_extracted_items')
      .select('*')
      .eq('import_id', importId)
      .order('sort_order', { ascending: true });
    setReviewItems((data ?? []) as ImportExtractedItem[]);
    setActiveImport(importId);
  }

  async function setReviewStatus(id: string, status: string) {
    await supabase
      .from('import_extracted_items')
      .update({ review_status: status })
      .eq('id', id);
    if (activeImport) loadReview(activeImport);
  }

  async function approveSelected() {
    if (!activeImport) return;
    if (!collectionId) {
      setMessage('Select a target collection (create one first if needed).');
      return;
    }
    const pending = reviewItems.filter((i) => i.review_status === 'pending' || i.review_status === 'edited');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let count = 0;

    for (const item of pending) {
      const ext = item.extracted as Record<string, unknown>;
      if (item.item_type === 'kanji') {
        const { data: k } = await supabase
          .from('kanji_entries')
          .insert({
            collection_id: collectionId,
            kanji: String(ext.kanji ?? ''),
            reading: (ext.reading as string) ?? null,
            meaning_en: (ext.meaning_en as string) ?? null,
            meaning_si: (ext.meaning_si as string) ?? null,
            example_sentence: (ext.example_sentence as string) ?? null,
            status: 'draft',
            sort_order: item.sort_order,
            created_by: user?.id,
          })
          .select('id')
          .single();
        await supabase
          .from('import_extracted_items')
          .update({ review_status: 'approved', approved_kanji_id: k?.id })
          .eq('id', item.id);
        count++;
      } else {
        const options =
          (ext.options as { label: string; text: string; is_correct?: boolean }[]) ?? [];
        const { data: q } = await supabase
          .from('questions')
          .insert({
            prompt: String(ext.prompt ?? ''),
            explanation: (ext.explanation as string) ?? null,
            question_type: 'multiple_choice',
            status: 'draft',
            confidence: item.confidence,
            source_import_id: activeImport,
            created_by: user?.id,
          })
          .select('id')
          .single();
        if (q) {
          for (let i = 0; i < options.length; i++) {
            const o = options[i];
            await supabase.from('question_options').insert({
              question_id: q.id,
              label: o.label,
              option_text: o.text,
              is_correct: !!o.is_correct || o.label === ext.correct_label,
              sort_order: i,
            });
          }
          await supabase
            .from('import_extracted_items')
            .update({ review_status: 'approved', approved_question_id: q.id })
            .eq('id', item.id);
          count++;
        }
      }
    }

    await supabase
      .from('content_imports')
      .update({ status: 'completed' })
      .eq('id', activeImport);

    setMessage(`Approved ${count} item(s) into collection as draft. Publish from the content page.`);
    loadReview(activeImport);
    load();
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Learning Content</h1>
        <p className="text-muted-foreground">
          Overview, TXT import, and review workflow for all learning modules.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm">{message}</div>
      )}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(KIND_META).map(([k, meta]) => {
          const Icon = meta.icon;
          const s = stats[k] ?? { total: 0, draft: 0, published: 0, needs_review: 0 };
          return (
            <Link key={k} href={meta.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base">{meta.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{s.total}</span> total ·{' '}
                  {s.published} published · {s.draft} draft
                  {s.needs_review > 0 && ` · ${s.needs_review} review`}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import TXT
          </CardTitle>
          <CardDescription>
            Upload or paste a TXT file. Content is extracted as draft and must be reviewed before
            publish. AI is optional — deterministic parser works offline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Content type</Label>
              <select
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
                value={kind}
                onChange={(e) => setKind(e.target.value as ContentKind)}
              >
                {Object.entries(KIND_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Target collection (for approve)</Label>
              <select
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
              >
                <option value="">Select collection…</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>TXT file</Label>
            <Input type="file" accept=".txt,text/plain" onChange={handleFile} />
          </div>
          <div className="space-y-2">
            <Label>Or paste text</Label>
            <Textarea
              rows={8}
              value={txt}
              onChange={(e) => setTxt(e.target.value)}
              placeholder={`Question 1\nWhat is ...?\nA. Option one\nB. Option two\nAnswer: B\n\nOr for kanji:\n漢|かん|China|චීන`}
              className="font-mono text-sm"
            />
          </div>
          <Button onClick={handleProcess} disabled={processing} className="gap-2">
            {processing ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            Process & extract
          </Button>
        </CardContent>
      </Card>

      {/* Review */}
      {reviewItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Review extracted items</CardTitle>
            <CardDescription>
              Approve items to save as draft questions/kanji. Fix confidence warnings first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={approveSelected} size="sm" className="gap-1">
                <Check className="h-4 w-4" />
                Approve pending into collection
              </Button>
            </div>
            <div className="space-y-3">
              {reviewItems.map((item) => {
                const ext = item.extracted as Record<string, unknown>;
                const conf = item.confidence;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{item.item_type}</Badge>
                      <Badge
                        variant={
                          conf === 'needs_review' || conf === 'low' ? 'destructive' : 'outline'
                        }
                      >
                        {conf}
                      </Badge>
                      <Badge variant="outline">{item.review_status}</Badge>
                      {(conf === 'needs_review' || conf === 'low') && (
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          Needs manual check
                        </span>
                      )}
                    </div>
                    {item.item_type === 'kanji' ? (
                      <p className="text-lg">
                        <span className="text-2xl font-medium">{String(ext.kanji)}</span>{' '}
                        <span className="text-muted-foreground">{String(ext.reading ?? '')}</span>{' '}
                        — {String(ext.meaning_en ?? '')} {String(ext.meaning_si ?? '')}
                      </p>
                    ) : (
                      <div>
                        <p className="font-medium">{String(ext.prompt)}</p>
                        <ul className="mt-1 text-sm text-muted-foreground">
                          {((ext.options as { label: string; text: string }[]) ?? []).map((o) => (
                            <li key={o.label}>
                              {o.label}. {o.text}
                              {o.label === ext.correct_label ? ' ✓' : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setReviewStatus(item.id, 'rejected')}>
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent imports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent imports</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Spinner />
          ) : imports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No imports yet.</p>
          ) : (
            <div className="space-y-2">
              {imports.map((imp) => (
                <button
                  key={imp.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => loadReview(imp.id)}
                >
                  <span className="truncate">
                    {imp.filename} · {imp.kind}
                  </span>
                  <Badge variant="outline">{imp.status}</Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
