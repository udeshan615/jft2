'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { extractYoutubeId } from '@/lib/kanji/types';

interface Props {
  title: string;
  youtubeUrl: string | null | undefined;
  summary?: string | null;
  onContinue: (skipped: boolean) => void;
}

export function IntroGate({ title, youtubeUrl, summary, onContinue }: Props) {
  const id = extractYoutubeId(youtubeUrl);
  return (
    <div className="mx-auto max-w-lg space-y-5 animate-fade-in">
      <div>
        <p className="text-sm font-medium text-[#c99a2e]">Introduction</p>
        <h1 className="text-xl font-bold text-[#123f6b]">{title}</h1>
      </div>
      <div className="aspect-video overflow-hidden rounded-2xl border border-[#123f6b]/15 bg-black shadow-lg">
        {id ? (
          <iframe
            title="Introduction"
            src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-white/80">
            Video not set. You can continue.
          </div>
        )}
      </div>
      {summary && (
        <div className="rounded-2xl border border-[#123f6b]/10 bg-white p-4">
          <h2 className="mb-2 text-sm font-bold text-[#123f6b]">සාරාංශය</h2>
          <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{summary}</p>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="flex-1 rounded-full bg-[#123f6b] hover:bg-[#0e3256]"
          onClick={() => onContinue(false)}
        >
          Next →
        </Button>
        <Button variant="outline" className="flex-1 rounded-full" onClick={() => onContinue(true)}>
          Skip introduction
        </Button>
      </div>
    </div>
  );
}
