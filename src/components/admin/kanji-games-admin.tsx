'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

type Book = {
  id: string;
  title: string;
  metadata?: Record<string, unknown> | null;
};

type Game = {
  id: string;
  collection_id: string;
  game_key: string;
  title: string;
  title_si: string | null;
  description: string | null;
  intro_enabled: boolean;
  intro_youtube_url: string | null;
  summary: string | null;
  is_enabled: boolean;
  sort_order: number;
};

interface Props {
  books: Book[];
  games: Game[];
}

export function KanjiGamesAdmin({ books, games: initialGames }: Props) {
  const router = useRouter();
  const [games, setGames] = useState(initialGames);
  const [bookMeta, setBookMeta] = useState<Record<string, { enabled: boolean; url: string }>>(
    () => {
      const m: Record<string, { enabled: boolean; url: string }> = {};
      for (const b of books) {
        const meta = (b.metadata || {}) as Record<string, unknown>;
        m[b.id] = {
          enabled: Boolean(meta.book_intro_enabled),
          url: String(meta.book_intro_youtube_url || ''),
        };
      }
      return m;
    }
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function saveBookIntro(bookId: string) {
    setSaving(bookId);
    const supabase = createClient();
    const cur = bookMeta[bookId] || { enabled: false, url: '' };
    const { data: row } = await supabase
      .from('content_collections')
      .select('metadata')
      .eq('id', bookId)
      .single();
    const prev = (row?.metadata as Record<string, unknown>) || {};
    const { error } = await supabase
      .from('content_collections')
      .update({
        metadata: {
          ...prev,
          book_intro_enabled: cur.enabled,
          book_intro_youtube_url: cur.url.trim(),
        },
      })
      .eq('id', bookId);
    setMsg(error ? error.message : 'Book intro saved');
    setSaving(null);
    router.refresh();
  }

  async function saveGame(g: Game) {
    setSaving(g.id);
    const supabase = createClient();
    const { error } = await supabase
      .from('kanji_games')
      .update({
        title: g.title,
        title_si: g.title_si,
        description: g.description,
        intro_enabled: g.intro_enabled,
        intro_youtube_url: g.intro_youtube_url?.trim() || null,
        summary: g.summary,
        is_enabled: g.is_enabled,
        sort_order: g.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', g.id);
    setMsg(error ? error.message : `${g.title} saved`);
    setSaving(null);
    router.refresh();
  }

  function updateGame(id: string, patch: Partial<Game>) {
    setGames((list) => list.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  return (
    <div className="space-y-6 border-t border-border pt-8">
      <div>
        <h2 className="text-lg font-bold text-[#123f6b]">Games & Book Intro</h2>
        <p className="text-sm text-muted-foreground">
          Book introduction video and per-game intro / සාරාංශය.
        </p>
      </div>
      {msg && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</p>
      )}

      {books.map((book) => {
        const bm = bookMeta[book.id] || { enabled: false, url: '' };
        const bookGames = games.filter((g) => g.collection_id === book.id);
        return (
          <Card key={book.id}>
            <CardContent className="space-y-5 p-4">
              <h3 className="font-semibold">{book.title}</h3>

              <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
                <p className="text-sm font-medium">Book introduction video</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={bm.enabled}
                    onChange={(e) =>
                      setBookMeta((m) => ({
                        ...m,
                        [book.id]: { ...bm, enabled: e.target.checked },
                      }))
                    }
                  />
                  Enable intro video
                </label>
                <div className="space-y-1">
                  <Label>YouTube URL</Label>
                  <Input
                    value={bm.url}
                    onChange={(e) =>
                      setBookMeta((m) => ({
                        ...m,
                        [book.id]: { ...bm, url: e.target.value },
                      }))
                    }
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => saveBookIntro(book.id)}
                  disabled={saving === book.id}
                  className="gap-2"
                >
                  {saving === book.id && <Spinner size="sm" />} Save book intro
                </Button>
              </div>

              {bookGames.map((g) => (
                <div key={g.id} className="space-y-3 rounded-xl border p-3">
                  <p className="text-sm font-medium">
                    Game: {g.game_key} — {g.title}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Title</Label>
                      <Input
                        value={g.title}
                        onChange={(e) => updateGame(g.id, { title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Title (Sinhala)</Label>
                      <Input
                        value={g.title_si || ''}
                        onChange={(e) => updateGame(g.id, { title_si: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Input
                      value={g.description || ''}
                      onChange={(e) => updateGame(g.id, { description: e.target.value })}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={g.is_enabled}
                      onChange={(e) => updateGame(g.id, { is_enabled: e.target.checked })}
                    />
                    Game enabled
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={g.intro_enabled}
                      onChange={(e) => updateGame(g.id, { intro_enabled: e.target.checked })}
                    />
                    Enable game intro video
                  </label>
                  <div className="space-y-1">
                    <Label>Intro YouTube URL</Label>
                    <Input
                      value={g.intro_youtube_url || ''}
                      onChange={(e) =>
                        updateGame(g.id, { intro_youtube_url: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>සාරාංශය (summary)</Label>
                    <Textarea
                      value={g.summary || ''}
                      onChange={(e) => updateGame(g.id, { summary: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => saveGame(g)}
                    disabled={saving === g.id}
                    className="gap-2"
                  >
                    {saving === g.id && <Spinner size="sm" />} Save game
                  </Button>
                </div>
              ))}
              {bookGames.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No games rows yet — run migration 013 (seed creates Flash Card + හරියට තෝරන්න).
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
