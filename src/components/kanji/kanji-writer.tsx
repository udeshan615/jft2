'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

type Phase = 'animate' | 'write' | 'done';

interface KanjiWriterProps {
  kanji: string;
  onComplete: () => void;
}

/** Extract CJK characters for stroke practice */
function extractChars(text: string): string[] {
  return Array.from(text).filter((c) => /[\u4e00-\u9fff]/.test(c));
}

export function KanjiWriter({ kanji, onComplete }: KanjiWriterProps) {
  const chars = extractChars(kanji);
  const display = chars.length > 0 ? chars.join('') : kanji;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [phase, setPhase] = useState<Phase>('animate');
  const [animStep, setAnimStep] = useState(0);
  const [feedback, setFeedback] = useState<'ok' | 'retry' | null>(null);
  const strokesRef = useRef<{ x: number; y: number }[][]>([]);

  const size = 280;

  const clearCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    // guide grid
    ctx.strokeStyle = 'rgba(18,63,107,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(c.width / 2, 0);
    ctx.lineTo(c.width / 2, c.height);
    ctx.moveTo(0, c.height / 2);
    ctx.lineTo(c.width, c.height / 2);
    ctx.stroke();
    strokesRef.current = [];
    setFeedback(null);
  }, []);

  useEffect(() => {
    clearCanvas();
  }, [kanji, clearCanvas]);

  // Stroke-order style animation: fade in character strokes via clip reveal
  useEffect(() => {
    if (phase !== 'animate') return;
    setAnimStep(0);
    const total = 8;
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      setAnimStep(step);
      if (step >= total) {
        clearInterval(id);
      }
    }, 280);
    return () => clearInterval(id);
  }, [phase, kanji]);

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
    ctx.moveTo(p.x, p.y);
  }

  function moveDraw(e: React.TouchEvent | React.MouseEvent) {
    if (!drawing.current || phase !== 'write') return;
    e.preventDefault();
    const p = getPos(e);
    const stroke = strokesRef.current[strokesRef.current.length - 1];
    stroke.push(p);
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.strokeStyle = '#123f6b';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
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
    let minX = c.width,
      minY = c.height,
      maxX = 0,
      maxY = 0;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4;
        if (data[i + 3] > 40 && data[i + 2] < 200) {
          // drawn ink (blue-ish)
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
    const centered =
      minX < c.width * 0.35 &&
      maxX > c.width * 0.65 &&
      minY < c.height * 0.35 &&
      maxY > c.height * 0.65;
    const enoughInk = coverage > 0.02 && coverage < 0.45;
    const sizeOk = w > c.width * 0.35 && h > c.height * 0.35;
    const strokeCount = strokesRef.current.length;

    if (enoughInk && sizeOk && centered && strokeCount >= 1) {
      setFeedback('ok');
      setPhase('done');
      onComplete();
    } else {
      setFeedback('retry');
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Stroke animation / large kanji */}
      <div className="relative flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
        <div
          className={cn(
            'select-none text-7xl font-bold leading-none text-[#123f6b] sm:text-8xl',
            phase === 'animate' && 'transition-opacity duration-300'
          )}
          style={{
            opacity: phase === 'animate' ? Math.min(1, animStep / 6) : 0.12,
          }}
          aria-hidden={phase === 'write'}
        >
          {display}
        </div>
        {phase === 'animate' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-[#c99a2e] transition-all duration-300"
              style={{ width: `${Math.min(100, (animStep / 8) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {phase === 'animate' && (
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setPhase('animate');
              setAnimStep(0);
            }}
          >
            Replay stroke order
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-[#123f6b] hover:bg-[#0e3256]"
            onClick={() => {
              setPhase('write');
              clearCanvas();
            }}
            disabled={animStep < 4}
          >
            Start writing
          </Button>
        </div>
      )}

      {(phase === 'write' || phase === 'done') && (
        <>
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="touch-none rounded-2xl border-2 border-[#123f6b]/25 bg-white shadow-inner"
            style={{ width: 'min(100%, 300px)', height: 'auto', aspectRatio: '1' }}
            onMouseDown={startDraw}
            onMouseMove={moveDraw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={moveDraw}
            onTouchEnd={endDraw}
          />
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={clearCanvas}>
              Clear
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPhase('animate');
                setFeedback(null);
              }}
            >
              Replay stroke order
            </Button>
            {phase === 'write' && (
              <Button
                type="button"
                size="sm"
                className="bg-[#123f6b] hover:bg-[#0e3256]"
                onClick={evaluate}
              >
                Check writing
              </Button>
            )}
          </div>
          {feedback === 'retry' && (
            <p className="text-sm font-medium text-red-600">
              Try again — write larger, centered on the grid.
            </p>
          )}
          {feedback === 'ok' && (
            <p className="text-sm font-semibold text-emerald-600">Completed ✓</p>
          )}
        </>
      )}
    </div>
  );
}
