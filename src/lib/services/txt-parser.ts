/**
 * Deterministic TXT parser for questions & kanji.
 * Works without AI. Tolerates common exam formats.
 * Optional AI enhancement is layered in import-service when configured.
 */

import type {
  ExtractedKanjiDraft,
  ExtractedQuestionDraft,
  QuestionType,
} from '@/lib/types/database';

const OPTION_RE =
  /^(?:([A-Da-d])[.)、．:\s]+|([①②③④⑤⑥⑦⑧⑨⑩])\s*|(\d+)[.)、．]\s+)/;
const ANSWER_RE =
  /(?:正解|答え|Answer|Ans|answer|correct)\s*[:：]?\s*([A-Da-d①②③④1-4])/i;
const Q_START_RE =
  /^(?:Question\s*)?(\d+)[.)、．:\s]+|^問\s*(\d+)|^Q\s*(\d+)/i;

function normalizeLabel(raw: string): string {
  const map: Record<string, string> = {
    '①': 'A',
    '②': 'B',
    '③': 'C',
    '④': 'D',
    '⑤': 'E',
    '1': 'A',
    '2': 'B',
    '3': 'C',
    '4': 'D',
  };
  const t = raw.trim();
  if (map[t]) return map[t];
  return t.toUpperCase().slice(0, 1);
}

function splitBlocks(text: string): string[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (Q_START_RE.test(trimmed) && current.length > 0) {
      blocks.push(current.join('\n').trim());
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current.join('\n').trim());
  return blocks.filter((b) => b.length > 5);
}

export function parseQuestionsFromTxt(text: string): ExtractedQuestionDraft[] {
  const blocks = splitBlocks(text);
  const results: ExtractedQuestionDraft[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    let promptLines: string[] = [];
    const options: ExtractedQuestionDraft['options'] = [];
    let correctLabel: string | undefined;
    let explanation: string | undefined;
    let inOptions = false;

    for (const line of lines) {
      const ans = line.match(ANSWER_RE);
      if (ans) {
        correctLabel = normalizeLabel(ans[1]);
        continue;
      }

      if (/^(解説|Explanation|説明)/i.test(line)) {
        explanation = line.replace(/^(解説|Explanation|説明)\s*[:：]?\s*/i, '');
        continue;
      }

      const opt = line.match(OPTION_RE);
      if (opt) {
        inOptions = true;
        const label = normalizeLabel(opt[1] || opt[2] || opt[3] || 'A');
        const textPart = line.replace(OPTION_RE, '').trim();
        options.push({ label, text: textPart || label });
        continue;
      }

      if (!inOptions) {
        promptLines.push(line.replace(Q_START_RE, '').trim() || line);
      } else if (explanation === undefined && !OPTION_RE.test(line)) {
        // trailing explanation
        explanation = (explanation ? explanation + ' ' : '') + line;
      }
    }

    const prompt = promptLines.join(' ').trim();
    if (!prompt && options.length === 0) continue;

    let confidence: ExtractedQuestionDraft['confidence'] = 'medium';
    if (options.length >= 2 && correctLabel) {
      confidence = 'high';
      const hit = options.find((o) => o.label === correctLabel);
      if (hit) hit.is_correct = true;
    } else if (options.length >= 2 && !correctLabel) {
      confidence = 'needs_review';
    } else {
      confidence = 'low';
    }

    const qType: QuestionType =
      options.length >= 2 ? 'multiple_choice' : 'multiple_choice';

    results.push({
      prompt: prompt || 'Untitled question',
      options,
      correct_label: correctLabel,
      explanation,
      question_type: qType,
      confidence,
      raw_segment: block.slice(0, 2000),
    });
  }

  return results;
}

/** Simple kanji line parser: 漢字 | reading | meaning | sinhala */
export function parseKanjiFromTxt(text: string): ExtractedKanjiDraft[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean);
  const results: ExtractedKanjiDraft[] = [];

  for (const line of lines) {
    if (/^(#|\/\/|Kanji|漢字|Book|Lesson)/i.test(line) && line.length < 40) continue;

    // Tab or pipe separated
    const parts = line.split(/\s*[|\t]\s*/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2 && /[\u4e00-\u9faf]/.test(parts[0])) {
      results.push({
        kanji: parts[0],
        reading: parts[1],
        meaning_en: parts[2],
        meaning_si: parts[3],
        example_sentence: parts[4],
        example_reading: parts[5],
        confidence: parts.length >= 3 ? 'high' : 'needs_review',
        raw_segment: line,
      });
      continue;
    }

    // Space-separated: 漢 かん  meaning
    const m = line.match(/^([\u4e00-\u9faf]{1,4})\s+([ぁ-んァ-ンー]+)\s+(.+)$/);
    if (m) {
      results.push({
        kanji: m[1],
        reading: m[2],
        meaning_en: m[3],
        confidence: 'medium',
        raw_segment: line,
      });
    }
  }

  return results;
}

export function detectContentKindFromFilename(filename: string): string {
  const f = filename.toLowerCase();
  if (f.includes('kanji') || f.includes('漢字')) return 'kanji_book';
  if (f.includes('grammar') || f.includes('文法')) return 'grammar';
  if (f.includes('listening') || f.includes('聴解')) return 'listening';
  if (f.includes('reading') || f.includes('読解')) return 'reading';
  if (f.includes('past')) return 'past_paper';
  return 'model_paper';
}
