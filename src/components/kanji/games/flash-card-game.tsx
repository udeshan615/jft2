'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { IntroGate } from '@/components/kanji/games/intro-gate';
import { createClient } from '@/lib/supabase/client';
import type { GameKanjiCard, KanjiGame } from '@/lib/services/kanji-games';
import { cn } from '@/lib/utils/cn';
import { Volume2 } from 'lucide-react';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function speakSequential(ja: string, si: string, onEnd: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd();
    return;
  }
  window.speechSynthesis.cancel();
  const u1 = new SpeechSynthesisUtterance(ja || ' ');
  u1.lang = 'ja-JP';
  u1.rate = 0.9;
  // Prefer female Japanese voice when available
  const voices = window.speechSynthesis.getVoices();
  const jaVoice =
    voices.find((v) => v.lang.startsWith('ja') && /female|google|haruka|kyoko/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith('ja'));
  if (jaVoice) u1.voice = jaVoice;

  const u2 = new SpeechSynthesisUtterance(si || ' ');
  u2.lang = 'si-LK';
  u2.rate = 0.95;
  const siVoice =
    voices.find((v) => v.lang.startsWith('si') && /male|male/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith('si'));
  if (siVoice) u2.voice = siVoice;

  u1.onend = () => {
    if (si) window.speechSynthesis.speak(u2);
    else onEnd();
  };
  u2.onend = () => onEnd();
  u2.onerror = () => onEnd();
  u1.onerror = () => {
    if (si) window.speechSynthesis.speak(u2);
    else onEnd();
  };
  window.speechSynthesis.speak(u1);
}

interface Props {
  game: KanjiGame;
  cards: GameKanjiCard[];
  userId: string;
  introDone: boolean;
}

export function FlashCardGame({ game, cards, userId, introDone: initialIntro }: Props) {
  const deck = useMemo(() => shuffle(cards), [cards]);
  const [introDone, setIntroDone] = useState(
    initialIntro || !game.intro_enabled
  );
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [anim, setAnim] = useState<'in' | 'out-left' | 'out-right' | null>('in');
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const card = deck[index];
  const total = deck.length;

  const playAudio = useCallback(() => {
    if (!card) return;
    setPlaying(true);
    speakSequential(card.reading || card.kanji, card.meaning_si || '', () =>
      setPlaying(false)
    );
  }, [card]);

  useEffect(() => {
    if (!introDone || !card) return;
    // slight delay so card paints first
    const t = setTimeout(() => playAudio(), 300);
    return () => {
      clearTimeout(t);
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    };
  }, [index, introDone, card, playAudio]);

  async function finishIntro(skipped: boolean) {
    const supabase = createClient();
    await supabase.from('kanji_game_intro_progress').upsert(
      {
        user_id: userId,
        game_id: game.id,
        watched: !skipped,
        skipped,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,game_id' }
    );
    setIntroDone(true);
  }

  function goNext() {
    if (index >= total - 1) return;
    setAnim('out-left');
    setTimeout(() => {
      setIndex((i) => i + 1);
      setAnim('in');
    }, 200);
  }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext(); // swipe left = next (common deck feel); spec said swipe right = next
      else goNext();
    }
  }

  if (!introDone && game.intro_enabled) {
    return (
      <IntroGate
        title={game.title_si || game.title}
        youtubeUrl={game.intro_youtube_url}
        summary={game.summary}
        onContinue={finishIntro}
      />
    );
  }

  if (total === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No Kanji available for this book yet.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#123f6b]">{game.title_si || game.title}</h1>
        <span className="text-sm text-muted-foreground">
          Card {index + 1} / {total}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#123f6b] to-[#c99a2e] transition-all"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <div
        className={cn(
          'select-none touch-pan-y transition-all duration-200',
          anim === 'in' && 'translate-x-0 opacity-100',
          anim === 'out-left' && '-translate-x-8 opacity-0',
          anim === 'out-right' && 'translate-x-8 opacity-0'
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative overflow-hidden rounded-3xl border border-[#123f6b]/10 bg-gradient-to-br from-[#123f6b] via-[#1a5080] to-[#0e3256] p-8 text-center text-white shadow-xl">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-[#c99a2e]/15" />
          <p className="relative text-6xl font-bold tracking-wide sm:text-7xl">{card.kanji}</p>
          <p className="relative mt-5 text-2xl font-medium text-white/95">
            {card.reading || '—'}
          </p>
          <p className="relative mt-3 text-lg text-[#f0e6c8]">{card.meaning_si || '—'}</p>
          <button
            type="button"
            onClick={playAudio}
            className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur transition hover:bg-white/25"
          >
            <Volume2 className="h-4 w-4" />
            {playing ? 'Playing...' : 'Play Again'}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Swipe card or tap Next
      </p>

      <Button
        className="w-full min-h-[48px] rounded-full bg-[#123f6b] hover:bg-[#0e3256]"
        onClick={goNext}
        disabled={index >= total - 1}
      >
        {index >= total - 1 ? 'Finished' : 'Next →'}
      </Button>
    </div>
  );
}
