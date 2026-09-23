'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Announcement } from '@/lib/types/database';

interface AnnouncementSlideshowProps {
  announcements: Announcement[];
}

export function AnnouncementSlideshow({
  announcements,
}: AnnouncementSlideshowProps) {
  const [index, setIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const count = announcements.length;

  const next = useCallback(() => {
    if (count <= 1) return;
    setIndex((i) => (i + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    if (count <= 1) return;
    setIndex((i) => (i - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [count, next]);

  if (count === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-5 py-8 text-center">
        <Megaphone className="mx-auto h-5 w-5 text-muted-foreground" />
        <p className="w-full text-sm text-muted-foreground">
          No announcements right now
        </p>
      </div>
    );
  }

  const current = announcements[index];

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart === null) return;
        const dx = e.changedTouches[0].clientX - touchStart;
        if (dx > 50) prev();
        if (dx < -50) next();
        setTouchStart(null);
      }}
    >
      <div className="relative aspect-[16/7] min-h-[140px] w-full sm:aspect-[21/8]">
        {current.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.image_url}
            alt={current.title}
            className="h-full w-full object-cover transition-opacity duration-500"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-accent/30 to-secondary">
            <Megaphone className="h-10 w-10 text-primary/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <h3 className="text-base font-semibold text-white drop-shadow sm:text-lg">
            {current.title}
          </h3>
          {current.content && (
            <p className="mt-0.5 line-clamp-2 text-xs text-white/85 sm:text-sm">
              {current.content}
            </p>
          )}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/50 sm:block"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/50 sm:block"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {announcements.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                )}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
