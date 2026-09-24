'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Megaphone, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
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
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [count, next]);

  if (count === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[#123f6b]/15 bg-white/80 px-5 py-8 text-center">
        <Megaphone className="mx-auto h-5 w-5 text-muted-foreground" />
        <p className="w-full text-sm text-muted-foreground">
          No announcements right now
        </p>
      </div>
    );
  }

  const current = announcements[index];
  const hasButton = !!(current.link_url && current.link_url.trim());
  const buttonText =
    (current.button_label && current.button_label.trim()) || 'Open link';

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[#123f6b]/10 bg-white shadow-sm shadow-[#123f6b]/5"
      onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart === null) return;
        const dx = e.changedTouches[0].clientX - touchStart;
        if (dx > 50) prev();
        if (dx < -50) next();
        setTouchStart(null);
      }}
    >
      {/* Image on top */}
      <div className="relative aspect-[16/7] min-h-[140px] w-full bg-slate-100 sm:aspect-[21/8]">
        {current.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.image_url}
            alt={current.title}
            className="h-full w-full object-cover transition-opacity duration-500"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#123f6b]/15 via-[#c99a2e]/10 to-sky-100">
            <Megaphone className="h-10 w-10 text-[#123f6b]/50" />
          </div>
        )}

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
                    i === index ? 'w-5 bg-white shadow' : 'w-1.5 bg-white/60'
                  )}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Topic + description BELOW the image */}
      <div className="space-y-3 p-4 sm:p-5">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-[#123f6b] sm:text-lg">
            {current.title}
          </h3>
          {current.content && (
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {current.content}
            </p>
          )}
        </div>

        {hasButton && (
          <a
            href={current.link_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button
              size="sm"
              className="min-h-[40px] gap-2 rounded-full bg-[#123f6b] px-5 hover:bg-[#0e3256]"
            >
              {buttonText}
              <ExternalLink className="h-3.5 w-3.5 opacity-80" />
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
