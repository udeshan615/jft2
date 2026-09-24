-- Kanji games config per book + intro watch state
CREATE TABLE IF NOT EXISTS public.kanji_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.content_collections(id) ON DELETE CASCADE,
  game_key TEXT NOT NULL, -- flash_card | choose_correct
  title TEXT NOT NULL,
  title_si TEXT,
  description TEXT,
  intro_enabled BOOLEAN NOT NULL DEFAULT false,
  intro_youtube_url TEXT,
  summary TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (collection_id, game_key)
);

CREATE INDEX IF NOT EXISTS idx_kanji_games_collection ON public.kanji_games(collection_id);

-- Book-level intro stored on content_collections.metadata:
-- { "book_intro_enabled": bool, "book_intro_youtube_url": string }

CREATE TABLE IF NOT EXISTS public.kanji_game_intro_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.kanji_games(id) ON DELETE CASCADE,
  watched BOOLEAN NOT NULL DEFAULT false,
  skipped BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)
);

CREATE TABLE IF NOT EXISTS public.kanji_book_intro_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.content_collections(id) ON DELETE CASCADE,
  watched BOOLEAN NOT NULL DEFAULT false,
  skipped BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, collection_id)
);

ALTER TABLE public.kanji_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanji_game_intro_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanji_book_intro_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read enabled kanji games" ON public.kanji_games;
CREATE POLICY "Public read enabled kanji games"
  ON public.kanji_games FOR SELECT
  USING (is_enabled = true OR EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins manage kanji games" ON public.kanji_games;
CREATE POLICY "Admins manage kanji games"
  ON public.kanji_games FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

DROP POLICY IF EXISTS "Users manage own game intro" ON public.kanji_game_intro_progress;
CREATE POLICY "Users manage own game intro"
  ON public.kanji_game_intro_progress FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own book intro" ON public.kanji_book_intro_progress;
CREATE POLICY "Users manage own book intro"
  ON public.kanji_book_intro_progress FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seed default games for irodoori-book-1 if collection exists
DO $$
DECLARE
  v_book_id UUID;
BEGIN
  SELECT id INTO v_book_id FROM public.content_collections
  WHERE kind = 'kanji_book' AND slug = 'irodoori-book-1' LIMIT 1;
  IF v_book_id IS NULL THEN
    RETURN;
  END IF;

  -- Book intro defaults in metadata
  UPDATE public.content_collections
  SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'book_intro_enabled', false,
    'book_intro_youtube_url', ''
  )
  WHERE id = v_book_id
    AND (metadata->>'book_intro_enabled') IS NULL;

  INSERT INTO public.kanji_games (
    collection_id, game_key, title, title_si, description,
    intro_enabled, intro_youtube_url, summary, is_enabled, sort_order
  ) VALUES
  (
    v_book_id, 'flash_card', 'Flash Card', 'Flash Card',
    'Practice Kanji using interactive flash cards.',
    false, NULL,
    'මෙම game එක මඟින් Book 1 හි Kanji හඳුනාගැනීම සහ ඒවාට අදාළ වචන මතක තබාගැනීම පුහුණු කළ හැක.',
    true, 1
  ),
  (
    v_book_id, 'choose_correct', 'හරියට තෝරන්න', 'හරියට තෝරන්න',
    'Choose the correct answer for each Kanji.',
    false, NULL,
    'මෙම game එකෙන් Book 1 Kanji සඳහා නිවැරදි ජපන් වචනය සහ සිංහල අර්ථය තෝරා ගැනීම පුහුණු වේ.',
    true, 2
  )
  ON CONFLICT (collection_id, game_key) DO NOTHING;
END $$;
