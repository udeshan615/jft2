'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

type Phase = 'loading' | 'demo' | 'write' | 'done' | 'unsupported';

interface KanjiWriterProps {
  kanji: string;
  onComplete: () => void;
}

/** Extract CJK ideographs for stroke practice */
function extractChars(text: string): string[] {
  return Array.from(text).filter((c) => /[\u4e00-\u9fff]/.test(c));
}

/**
 * Real stroke-order demo + quiz writing using hanzi-writer.
 * Multi-character words: practice each character in sequence.
 */
export function KanjiWriter({ kanji, onComplete }: KanjiWriterProps) {
  const chars = extractChars(kanji);
  const targetChars = chars.length > 0 ? chars : [];

  const hostRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const writerRef = useRef<any>(null);

  const [phase, setPhase] = useState<Phase>('loading');
  const [charIndex, setCharIndex] = useState(0);
  const [demoDone, setDemoDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const currentChar = targetChars[charIndex] || '';
  const multi = targetChars.length > 1;

  const destroyWriter = useCallback(() => {
    writerRef.current = null;
    if (hostRef.current) hostRef.current.innerHTML = '';
  }, []);

  const loadWriter = useCallback(async () => {
    if (!currentChar || !hostRef.current) return;
    setPhase('loading');
    setMsg(null);
    setDemoDone(false);
    destroyWriter();

    try {
      const HanziWriter = (await import('hanzi-writer')).default;
      const size = Math.min(300, hostRef.current.clientWidth || 280);

      const writer = HanziWriter.create(hostRef.current, currentChar, {
        width: size,
        height: size,
        padding: 12,
        strokeColor: '#123f6b',
        radicalColor: '#2a6f97',
        outlineColor: '#d4dce6',
        drawingColor: '#123f6b',
        drawingWidth: 28,
        showOutline: true,
        showCharacter: false,
        strokeAnimationSpeed: 1.1,
        delayBetweenStrokes: 220,
        delayBetweenLoops: 800,
      });
      writerRef.current = writer;
      setPhase('demo');

      // Safety: allow Start writing even if animation callback is slow
      const safety = window.setTimeout(() => setDemoDone(true), 2500);

      // Auto-play stroke order once
      writer.animateCharacter({
        onComplete() {
          window.clearTimeout(safety);
          setDemoDone(true);
        },
      });
    } catch {
      // Character not in dataset (rare) or load failure
      setPhase('unsupported');
      setMsg('Stroke data unavailable for this character — practice by tracing the outline.');
    }
  }, [currentChar, destroyWriter]);

  useEffect(() => {
    setCharIndex(0);
  }, [kanji]);

  useEffect(() => {
    if (targetChars.length === 0) {
      setPhase('unsupported');
      return;
    }
    loadWriter();
    return () => destroyWriter();
  }, [charIndex, kanji, loadWriter, destroyWriter, targetChars.length]);

  function replayDemo() {
    const w = writerRef.current;
    if (!w) {
      loadWriter();
      return;
    }
    setPhase('demo');
    setDemoDone(false);
    setMsg(null);
    try {
      w.cancelQuiz?.();
      w.hideCharacter?.();
      w.showOutline?.();
      w.animateCharacter({
        onComplete() {
          setDemoDone(true);
        },
      });
    } catch {
      loadWriter();
    }
  }

  function startWriting() {
    const w = writerRef.current;
    if (!w) return;
    setPhase('write');
    setMsg('Stroke order එකට අනුව අඳින්න');
    try {
      w.cancelQuiz?.();
      w.quiz({
        onCorrectStroke() {
          setMsg('හරි ✓ — ඊළඟ stroke එක');
        },
        onMistake() {
          setMsg('නැවත උත්සාහ කරන්න — stroke order බලන්න');
        },
        onComplete() {
          // Character done
          if (charIndex < targetChars.length - 1) {
            setMsg(`「${currentChar}」 completed — next character`);
            setTimeout(() => setCharIndex((i) => i + 1), 600);
          } else {
            setPhase('done');
            setMsg('Kanji Completed ✓');
            onComplete();
          }
        },
      });
    } catch {
      setPhase('unsupported');
    }
  }

  function markSimpleComplete() {
    // Fallback when no stroke data
    if (charIndex < targetChars.length - 1) {
      setCharIndex((i) => i + 1);
    } else {
      setPhase('done');
      onComplete();
    }
  }

  if (targetChars.length === 0) {
    return (
      <div className="rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-800">
        No kanji characters to practice in this entry.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Context */}
      <div className="w-full text-center">
        <p className="text-3xl font-bold tracking-wide text-[#123f6b] sm:text-4xl">{kanji}</p>
        {multi && (
          <p className="mt-1 text-xs text-muted-foreground">
            Character {charIndex + 1} / {targetChars.length}:{' '}
            <span className="font-semibold text-[#123f6b]">{currentChar}</span>
          </p>
        )}
        {phase === 'demo' && (
          <p className="mt-2 text-sm font-medium text-[#c99a2e]">
            Stroke order බලන්න — step by step
          </p>
        )}
        {phase === 'write' && (
          <p className="mt-2 text-sm font-medium text-[#123f6b]">
            ඇඟිල්ලෙන් / mouse එකෙන් stroke order ට අනුව අඳින්න
          </p>
        )}
        {phase === 'done' && (
          <p className="mt-2 text-sm font-semibold text-emerald-600">✓ Kanji Completed</p>
        )}
        {phase === 'loading' && (
          <p className="mt-2 text-sm text-muted-foreground">Loading strokes…</p>
        )}
      </div>

      {/* Writer host — large touch target */}
      <div
        className={cn(
          'relative mx-auto w-full max-w-[320px] touch-none overflow-hidden rounded-2xl border-2 border-[#123f6b]/15 bg-[#faf9f6] shadow-inner',
          phase === 'write' && 'border-[#123f6b]/35 ring-2 ring-[#123f6b]/10'
        )}
        style={{ aspectRatio: '1' }}
      >
        <div
          ref={hostRef}
          className="flex h-full w-full items-center justify-center [&_svg]:max-h-full [&_svg]:max-w-full"
        />
        {phase === 'unsupported' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            <span className="select-none text-8xl font-bold text-[#123f6b]/80">{currentChar}</span>
            <p className="text-center text-xs text-muted-foreground">{msg}</p>
            <Button size="sm" className="rounded-full bg-[#123f6b]" onClick={markSimpleComplete}>
              Mark practiced →
            </Button>
          </div>
        )}
      </div>

      {msg && phase !== 'unsupported' && (
        <p
          className={cn(
            'text-center text-sm',
            phase === 'done' ? 'font-semibold text-emerald-600' : 'text-slate-600'
          )}
        >
          {msg}
        </p>
      )}

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-2">
        {(phase === 'demo' || phase === 'write' || phase === 'done') && phase !== 'unsupported' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={replayDemo}
          >
            Replay stroke order
          </Button>
        )}
        {phase === 'demo' && (
          <Button
            type="button"
            size="sm"
            className="rounded-full bg-[#123f6b] hover:bg-[#0e3256]"
            onClick={startWriting}
            disabled={!demoDone && phase === 'demo'}
          >
            Start writing
          </Button>
        )}
        {phase === 'write' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={startWriting}
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
