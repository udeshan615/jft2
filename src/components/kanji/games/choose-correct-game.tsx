'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { IntroGate } from '@/components/kanji/games/intro-gate';
import { createClient } from '@/lib/supabase/client';
import type { GameKanjiCard, KanjiGame } from '@/lib/services/kanji-games';
import { cn } from '@/lib/utils/cn';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Choice = { id: string; kanji: string; reading: string; meaning_si: string };
type Mistake = { prompt: string; correctJa: string; correctSi: string };

interface Props {
  game: KanjiGame;
  cards: GameKanjiCard[];
  userId: string;
  introDone: boolean;
}

export function ChooseCorrectGame({ game, cards, userId, introDone: initialIntro }: Props) {
  const questions = useMemo(() => shuffle(cards), [cards]);
  const [introDone, setIntroDone] = useState(initialIntro || !game.intro_enabled);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'right' | 'wrong'>('idle');
  const [stopped, setStopped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [session, setSession] = useState(0); // bump to reshuffle on play again

  const q = questions[index];
  const total = questions.length;

  const choices: Choice[] = useMemo(() => {
    if (!q || cards.length < 1) return [];
    const others = shuffle(cards.filter((c) => c.id !== q.id)).slice(0, 2);
    const pool = shuffle([q, ...others]);
    return pool.map((c) => ({
      id: c.id,
      kanji: c.kanji,
      reading: c.reading || c.kanji,
      meaning_si: c.meaning_si || c.meaning_en || '—',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q?.id, session, index]);

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

  function advance() {
    if (index >= total - 1) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setStatus('idle');
    }
  }

  function onPick(choice: Choice) {
    if (status !== 'idle' || !q) return;
    setSelected(choice.id);
    if (choice.id === q.id) {
      setStatus('right');
      setCorrect((c) => c + 1);
      setTimeout(advance, 1100);
    } else {
      setStatus('wrong');
      setWrong((w) => w + 1);
      setMistakes((m) => [
        ...m,
        {
          prompt: q.kanji,
          correctJa: q.reading || q.kanji,
          correctSi: q.meaning_si || '',
        },
      ]);
      setTimeout(advance, 1800);
    }
  }

  function stopGame() {
    setStopped(true);
  }

  function playAgain() {
    setSession((s) => s + 1);
    setIndex(0);
    setCorrect(0);
    setWrong(0);
    setMistakes([]);
    setSelected(null);
    setStatus('idle');
    setStopped(false);
    setFinished(false);
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
      <p className="text-center text-sm text-muted-foreground">No Kanji available.</p>
    );
  }

  if (stopped || finished) {
    const answered = correct + wrong;
    const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
    return (
      <div className="mx-auto max-w-md space-y-5 py-6 text-center animate-fade-in">
        <div className="text-4xl">{finished ? '🎉' : '⏹'}</div>
        <h2 className="text-xl font-bold text-[#123f6b]">
          {finished ? 'Game Completed!' : 'Game Stopped'}
        </h2>
        <div className="rounded-2xl border bg-white p-5 text-left text-sm space-y-1">
          <p>
            හරි පිළිතුරු: <strong>{correct}</strong>
          </p>
          <p>
            වැරදි පිළිතුරු: <strong>{wrong}</strong>
          </p>
          <p>
            මුළු ප්‍රශ්න: <strong>{answered}</strong>
            {finished ? ` / ${total}` : ''}
          </p>
          <p>
            Accuracy: <strong>{accuracy}%</strong>
          </p>
        </div>
        {mistakes.length > 0 && (
          <div className="rounded-2xl border bg-white p-4 text-left">
            <h3 className="mb-2 font-semibold text-[#123f6b]">වැරදුණු ඒවා</h3>
            <ul className="space-y-2 text-sm">
              {mistakes.map((m, i) => (
                <li key={i} className="border-b border-slate-100 pb-2 last:border-0">
                  <span className="font-bold text-lg">{m.prompt}</span>
                  <span className="text-muted-foreground"> → </span>
                  <span>
                    {m.correctJa} / {m.correctSi}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button className="w-full rounded-full bg-[#123f6b]" onClick={playAgain}>
          Play Again
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-[#123f6b]">{game.title_si || game.title}</h1>
        <Button variant="outline" size="sm" className="rounded-full" onClick={stopGame}>
          Stop
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Question {index + 1} / {total} · හරි {correct} · වැරදි {wrong}
      </p>

      <div className="rounded-3xl border border-[#123f6b]/10 bg-white p-8 text-center shadow-sm">
        <p className="text-6xl font-bold text-[#123f6b] sm:text-7xl">{q.kanji}</p>
        <p className="mt-3 text-sm text-muted-foreground">නිවැරදි පිළිතුර තෝරන්න</p>
      </div>

      <div className="space-y-3">
        {choices.map((c) => {
          const isSel = selected === c.id;
          const isCorrectChoice = c.id === q.id;
          return (
            <button
              key={c.id}
              type="button"
              disabled={status !== 'idle'}
              onClick={() => onPick(c)}
              className={cn(
                'w-full rounded-2xl border-2 px-4 py-3.5 text-left transition active:scale-[0.99]',
                status === 'idle' && 'border-[#123f6b]/15 bg-white hover:border-[#123f6b]/40',
                status !== 'idle' && isCorrectChoice && 'border-emerald-500 bg-emerald-50',
                status === 'wrong' && isSel && !isCorrectChoice && 'border-red-400 bg-red-50',
                status === 'right' && isSel && 'border-emerald-500 bg-emerald-50'
              )}
            >
              <span className="block text-lg font-semibold text-[#123f6b]">{c.reading}</span>
              <span className="block text-sm text-slate-600">{c.meaning_si}</span>
            </button>
          );
        })}
      </div>

      {status === 'right' && (
        <p className="text-center text-lg font-bold text-emerald-600">✓ හරි!</p>
      )}
      {status === 'wrong' && (
        <div className="rounded-xl bg-red-50 p-3 text-center text-sm">
          <p className="font-bold text-red-600">✗ වැරදියි</p>
          <p className="mt-1 text-slate-700">
            නිවැරදි පිළිතුර: <strong>{q.reading}</strong>
            <br />
            {q.meaning_si}
          </p>
        </div>
      )}
    </div>
  );
}
