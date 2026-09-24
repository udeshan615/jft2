'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

type Phase = 'demo' | 'write' | 'done';

interface KanjiWriterProps {
  kanji: string;
  onComplete: () => void;
}

/** CJK characters only for display/practice */
function extractChars(text: string): string[] {
  const chars = Array.from(text).filter((c) => /[\u4e00-\u9fff]/.test(c));
  return chars.length > 0 ? chars : Array.from(text).slice(0, 1);
}

/**
 * Interactive practice:
 * 1) Demo — large kanji, step-by-step how to write (progressive reveal)
 * 2) Write — same large kanji as guide UNDER the canvas; finger draws on top
 */
export function KanjiWriter({ kanji, onComplete }: KanjiWriterProps) {
  const chars = extractChars(kanji);
  const display = chars.join('');
  const charCount = Math.max(chars.length, 1);

  // Rough stroke budget per character (demo steps)
  const stepsPerChar = 4;
  const totalSteps = charCount * stepsPerChar;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const strokesRef = useRef<{ x: number; y: number }[][]>([]);

  const [phase, setPhase] = useState<Phase>('demo');
  const [demoStep, setDemoStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [feedback, setFeedback] = useState<'ok' | 'retry' | null>(null);

  const boxSize = 300;

  const clearCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    strokesRef.current = [];
    setFeedback(null);
  }, []);

  useEffect(() => {
    setPhase('demo');
    setDemoStep(0);
    setAutoPlay(true);
    setFeedback(null);
    clearCanvas();
  }, [kanji, clearCanvas]);

  // Auto step-through demo
  useEffect(() => {
    if (phase !== 'demo' || !autoPlay) return;
    if (demoStep >= totalSteps) return;
    const t = setTimeout(() => setDemoStep((s) => s + 1), 450);
    return () => clearTimeout(t);
  }, [phase, autoPlay, demoStep, totalSteps]);

  // Progress within current character (0–1)
  const progress = Math.min(1, demoStep / totalSteps);
  const currentCharIndex = Math.min(
    charCount - 1,
    Math.floor((demoStep / totalSteps) * charCount)
  );
  const stepInChar = demoStep % stepsPerChar;

  function getPos(e: React.TouchEvent | React.MouseEvent) {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const scaleX = c.width / rect.width;
    const scaleY = c.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0] || e.changedTouches[0];
      return {
        x: (t.clientX - rect.left) * scaleX,
        y: (t.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.TouchEvent | React.MouseEvent) {
    if (phase !== 'write') return;
    e.preventDefault();
    drawing.current = true;
    const p = getPos(e);
    strokesRef.current.push([p]);
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.strokeStyle = '#123f6b';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(p.x, p.y);
  }

  function moveDraw(e: React.TouchEvent | React.MouseEvent) {
    if (!drawing.current || phase !== 'write') return;
    e.preventDefault();
    const p = getPos(e);
    strokesRef.current[strokesRef.current.length - 1].push(p);
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function endDraw() {
    drawing.current = false;
  }

  function evaluate() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let ink = 0;
    let minX = c.width;
    let minY = c.height;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4;
        // Detect drawn ink (dark blue strokes)
        if (data[i + 3] > 50 && data[i] < 80 && data[i + 2] < 150) {
          ink++;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    const area = c.width * c.height;
    const coverage = ink / area;
    const w = maxX - minX;
    const h = maxY - minY;
    const enough =
      coverage > 0.015 &&
      coverage < 0.5 &&
      w > c.width * 0.3 &&
      h > c.height * 0.3 &&
      strokesRef.current.length >= 1;

    if (enough) {
      setFeedback('ok');
      setPhase('done');
      onComplete();
    } else {
      setFeedback('retry');
    }
  }

  function startWriting() {
    setPhase('write');
    clearCanvas();
  }

  function replayDemo() {
    setPhase('demo');
    setDemoStep(0);
    setAutoPlay(true);
    setFeedback(null);
    clearCanvas();
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Status */}
      <div className="w-full text-center">
        {phase === 'demo' && (
          <p className="text-sm font-medium text-[#123f6b]">
            Step {Math.min(demoStep + 1, totalSteps)} / {totalSteps} — ලියන විදිහ බලන්න
          </p>
        )}
        {phase === 'write' && (
          <p className="text-sm font-medium text-[#123f6b]">
            ඇඟිල්ලෙන් kanji උඩ අඳින්න
          </p>
        )}
        {phase === 'done' && (
          <p className="text-sm font-semibold text-emerald-600">Completed ✓</p>
        )}
      </div>

      {/* Large practice box: kanji guide + optional canvas on top */}
      <div
        className="relative mx-auto touch-none overflow-hidden rounded-2xl border-2 border-[#123f6b]/20 bg-[#faf9f6] shadow-inner"
        style={{ width: 'min(100%, 320px)', aspectRatio: '1' }}
      >
        {/* Grid */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#123f6b]/10" />
          <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#123f6b]/10" />
        </div>

        {/* DEMO: progressive stroke-style reveal */}
        {phase === 'demo' && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            {/* Faint full outline */}
            <span
              className="pointer-events-none absolute select-none text-[7.5rem] font-bold leading-none text-[#123f6b]/10 sm:text-[8.5rem]"
              aria-hidden
            >
              {display}
            </span>
            {/* Growing “ink” reveal */}
            <span
              className="pointer-events-none select-none text-[7.5rem] font-bold leading-none text-[#123f6b] transition-all duration-300 sm:text-[8.5rem]"
              style={{
                clipPath: `inset(0 ${Math.max(0, 100 - progress * 100)}% 0 0)`,
                WebkitClipPath: `inset(0 ${Math.max(0, 100 - progress * 100)}% 0 0)`,
              }}
            >
              {display}
            </span>
            {/* Step badge */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <span className="rounded-full bg-[#123f6b]/90 px-3 py-1 text-xs font-medium text-white">
                {chars[currentCharIndex] || display} · stroke step {stepInChar + 1}
              </span>
            </div>
            {/* Progress bar */}
            <div className="absolute left-3 right-3 top-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#c99a2e] transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* WRITE / DONE: guide kanji under canvas — draw ON the character */}
        {(phase === 'write' || phase === 'done') && (
          <>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="select-none text-[7.5rem] font-bold leading-none text-[#123f6b]/15 sm:text-[8.5rem]">
                {display}
              </span>
            </div>
            <canvas
              ref={canvasRef}
              width={boxSize}
              height={boxSize}
              className={cn(
                'absolute inset-0 h-full w-full touch-none',
                phase === 'done' && 'pointer-events-none'
              )}
              onMouseDown={startDraw}
              onMouseMove={moveDraw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={moveDraw}
              onTouchEnd={endDraw}
            />
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex w-full flex-wrap justify-center gap-2">
        {phase === 'demo' && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => {
                setAutoPlay(false);
                setDemoStep(0);
                setTimeout(() => setAutoPlay(true), 50);
              }}
            >
              Replay steps
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => {
                setAutoPlay(false);
                setDemoStep((s) => Math.min(totalSteps, s + 1));
              }}
            >
              Next step
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-full bg-[#123f6b] hover:bg-[#0e3256]"
              onClick={startWriting}
              disabled={demoStep < Math.max(2, Math.floor(totalSteps * 0.4))}
            >
              Start writing
            </Button>
          </>
        )}

        {(phase === 'write' || phase === 'done') && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={clearCanvas}
              disabled={phase === 'done'}
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={replayDemo}
            >
              Show steps again
            </Button>
            {phase === 'write' && (
              <Button
                type="button"
                size="sm"
                className="rounded-full bg-[#123f6b] hover:bg-[#0e3256]"
                onClick={evaluate}
              >
                Check writing
              </Button>
            )}
          </>
        )}
      </div>

      {feedback === 'retry' && (
        <p className="text-center text-sm font-medium text-red-600">
          නැවත උත්සාහ කරන්න — kanji උඩ මැදට, ලොකුවට අඳින්න.
        </p>
      )}
    </div>
  );
}
