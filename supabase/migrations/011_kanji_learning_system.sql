-- Kanji interactive learning: intro video + progress
ALTER TABLE public.learning_modules
  ADD COLUMN IF NOT EXISTS intro_youtube_url TEXT;

COMMENT ON COLUMN public.learning_modules.intro_youtube_url IS 'YouTube URL or ID for lesson introduction (embedded in-app)';

-- Per-user lesson intro watched
CREATE TABLE IF NOT EXISTS public.kanji_intro_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  watched BOOLEAN NOT NULL DEFAULT false,
  skipped BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_kanji_intro_user ON public.kanji_intro_progress(user_id);

-- Per-user kanji entry completion within a lesson
CREATE TABLE IF NOT EXISTS public.kanji_entry_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  kanji_entry_id UUID NOT NULL REFERENCES public.kanji_entries(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kanji_entry_id)
);

CREATE INDEX IF NOT EXISTS idx_kanji_entry_progress_user ON public.kanji_entry_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_kanji_entry_progress_module ON public.kanji_entry_progress(user_id, module_id);

ALTER TABLE public.kanji_intro_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanji_entry_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own kanji intro" ON public.kanji_intro_progress;
CREATE POLICY "Users manage own kanji intro"
  ON public.kanji_intro_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own kanji entry progress" ON public.kanji_entry_progress;
CREATE POLICY "Users manage own kanji entry progress"
  ON public.kanji_entry_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all kanji intro" ON public.kanji_intro_progress;
CREATE POLICY "Admins read all kanji intro"
  ON public.kanji_intro_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins read all kanji entry progress" ON public.kanji_entry_progress;
CREATE POLICY "Admins read all kanji entry progress"
  ON public.kanji_entry_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );
