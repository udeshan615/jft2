import { createClient } from '@/lib/supabase/server';
import {
  detectContentKindFromFilename,
  parseKanjiFromTxt,
  parseQuestionsFromTxt,
} from '@/lib/services/txt-parser';
import type {
  ContentImport,
  ContentKind,
  ImportExtractedItem,
} from '@/lib/types/database';

export async function createImportJob(input: {
  kind: ContentKind;
  filename: string;
  original_text: string;
  collection_id?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('content_imports')
    .insert({
      kind: input.kind,
      filename: input.filename,
      original_text: input.original_text,
      collection_id: input.collection_id ?? null,
      status: 'processing',
      created_by: user?.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ContentImport;
}

export async function processImport(importId: string) {
  const supabase = await createClient();
  const { data: job, error } = await supabase
    .from('content_imports')
    .select('*')
    .eq('id', importId)
    .single();
  if (error || !job) throw error ?? new Error('Import not found');

  await supabase
    .from('content_imports')
    .update({ status: 'extracting' })
    .eq('id', importId);

  const text = job.original_text ?? '';
  const kind = job.kind as ContentKind;
  let extractedCount = 0;
  let needsReview = 0;

  try {
    if (kind === 'kanji_book') {
      const items = parseKanjiFromTxt(text);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.confidence === 'needs_review' || item.confidence === 'low') {
          needsReview++;
        }
        await supabase.from('import_extracted_items').insert({
          import_id: importId,
          item_type: 'kanji',
          sort_order: i,
          raw_segment: item.raw_segment,
          extracted: item,
          confidence: item.confidence,
          review_status: 'pending',
        });
        extractedCount++;
      }
    } else {
      const items = parseQuestionsFromTxt(text);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.confidence === 'needs_review' || item.confidence === 'low') {
          needsReview++;
        }
        await supabase.from('import_extracted_items').insert({
          import_id: importId,
          item_type: 'question',
          sort_order: i,
          raw_segment: item.raw_segment,
          extracted: item,
          confidence: item.confidence,
          review_status: 'pending',
        });
        extractedCount++;
      }
    }

    const status = extractedCount === 0 ? 'failed' : 'needs_review';
    await supabase
      .from('content_imports')
      .update({
        status,
        parser_used: 'deterministic',
        stats: { extracted: extractedCount, needs_review: needsReview },
        error_message:
          extractedCount === 0 ? 'No questions or kanji detected in file' : null,
      })
      .eq('id', importId);

    return { extractedCount, needsReview, status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Parse failed';
    await supabase
      .from('content_imports')
      .update({ status: 'failed', error_message: msg })
      .eq('id', importId);
    throw e;
  }
}

export async function listImports(limit = 50) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('content_imports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ContentImport[];
}

export async function getImportWithItems(importId: string) {
  const supabase = await createClient();
  const { data: job } = await supabase
    .from('content_imports')
    .select('*')
    .eq('id', importId)
    .maybeSingle();
  if (!job) return null;

  const { data: items } = await supabase
    .from('import_extracted_items')
    .select('*')
    .eq('import_id', importId)
    .order('sort_order', { ascending: true });

  return {
    import: job as ContentImport,
    items: (items ?? []) as ImportExtractedItem[],
  };
}

export async function updateExtractedItem(
  id: string,
  patch: Partial<ImportExtractedItem> & { extracted?: Record<string, unknown> }
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('import_extracted_items')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as ImportExtractedItem;
}

export async function approveExtractedItems(
  importId: string,
  itemIds: string[],
  targetCollectionId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: items } = await supabase
    .from('import_extracted_items')
    .select('*')
    .eq('import_id', importId)
    .in('id', itemIds);

  let approved = 0;
  for (const item of items ?? []) {
    const ext = item.extracted as Record<string, unknown>;
    if (item.item_type === 'kanji') {
      const { data: kanji } = await supabase
        .from('kanji_entries')
        .insert({
          collection_id: targetCollectionId,
          kanji: String(ext.kanji ?? ''),
          reading: (ext.reading as string) ?? null,
          meaning_en: (ext.meaning_en as string) ?? null,
          meaning_si: (ext.meaning_si as string) ?? null,
          example_sentence: (ext.example_sentence as string) ?? null,
          example_reading: (ext.example_reading as string) ?? null,
          status: 'draft',
          sort_order: item.sort_order,
          created_by: user?.id,
        })
        .select()
        .single();
      await supabase
        .from('import_extracted_items')
        .update({
          review_status: 'approved',
          approved_kanji_id: kanji?.id,
        })
        .eq('id', item.id);
      approved++;
    } else {
      const options = (ext.options as { label: string; text: string; is_correct?: boolean }[]) ?? [];
      const { data: q } = await supabase
        .from('questions')
        .insert({
          prompt: String(ext.prompt ?? ''),
          explanation: (ext.explanation as string) ?? null,
          question_type: (ext.question_type as string) ?? 'multiple_choice',
          status: 'draft',
          confidence: item.confidence,
          source_import_id: importId,
          created_by: user?.id,
        })
        .select()
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
          .update({
            review_status: 'approved',
            approved_question_id: q.id,
          })
          .eq('id', item.id);
        approved++;
      }
    }
  }

  // Mark import completed if all reviewed
  const { data: pending } = await supabase
    .from('import_extracted_items')
    .select('id')
    .eq('import_id', importId)
    .eq('review_status', 'pending');

  if (!pending?.length) {
    await supabase
      .from('content_imports')
      .update({ status: 'completed' })
      .eq('id', importId);
  }

  return { approved };
}

export { detectContentKindFromFilename };
