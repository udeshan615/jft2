-- ============================================================
-- PHASE 5: Learning Content System
-- TXT import, AI-assisted extraction, versioning, progress
-- Model Papers, Past Papers, Kanji, Grammar, Listening, Reading
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.content_status AS ENUM ('draft', 'needs_review', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.content_kind AS ENUM (
    'model_paper', 'past_paper', 'kanji_book', 'grammar', 'listening', 'reading'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.question_type AS ENUM (
    'multiple_choice', 'image', 'japanese_sentence', 'kaiwa',
    'reading', 'listening', 'kanji_meaning', 'kanji_reading', 'kanji_sinhala'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.import_status AS ENUM (
    'uploading', 'processing', 'extracting', 'needs_review', 'completed', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.practice_session_status AS ENUM (
    'in_progress', 'completed', 'abandoned'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- CONTENT COLLECTIONS (versioned books / paper sets / courses)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.content_kind NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT,
  book_number INTEGER,          -- for kanji books (1,2,3...)
  paper_number INTEGER,         -- for model/past papers
  level TEXT,                   -- N5, beginner, etc.
  difficulty TEXT,              -- easy, medium, hard
  version INTEGER NOT NULL DEFAULT 1,
  status public.content_status NOT NULL DEFAULT 'draft',
  is_active_version BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  requires_verification BOOLEAN NOT NULL DEFAULT false, -- past papers
  time_limit_minutes INTEGER,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collections_kind ON public.content_collections(kind);
CREATE INDEX IF NOT EXISTS idx_collections_status ON public.content_collections(status);
CREATE INDEX IF NOT EXISTS idx_collections_active ON public.content_collections(kind, is_active_version) WHERE is_active_version = true;
CREATE INDEX IF NOT EXISTS idx_collections_sort ON public.content_collections(kind, sort_order);

-- ============================================================
-- LEARNING MODULES (lessons / sections within a collection)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.learning_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.content_collections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  section_key TEXT,             -- pictures_kanji, grammar, listening, reading
  lesson_number INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'draft',
  content_body TEXT,            -- passage / explanation / kaiwa text
  content_body_reading TEXT,    -- furigana / reading
  content_body_sinhala TEXT,
  image_url TEXT,
  audio_url TEXT,
  audio_duration_seconds INTEGER,
  transcript TEXT,
  speaker_a_label TEXT,
  speaker_b_label TEXT,
  speaker_a_audio_url TEXT,
  speaker_b_audio_url TEXT,
  estimated_minutes INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_modules_collection ON public.learning_modules(collection_id);
CREATE INDEX IF NOT EXISTS idx_modules_status ON public.learning_modules(status);
CREATE INDEX IF NOT EXISTS idx_modules_sort ON public.learning_modules(collection_id, sort_order);

-- ============================================================
-- QUESTIONS (reusable across modules)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_type public.question_type NOT NULL DEFAULT 'multiple_choice',
  prompt TEXT NOT NULL,
  prompt_japanese TEXT,
  prompt_sinhala TEXT,
  explanation TEXT,
  explanation_sinhala TEXT,
  image_url TEXT,
  audio_url TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  difficulty TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  status public.content_status NOT NULL DEFAULT 'draft',
  confidence TEXT DEFAULT 'high', -- high | medium | low | needs_review
  source_import_id UUID,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_status ON public.questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_type ON public.questions(question_type);

-- ============================================================
-- QUESTION OPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,           -- A, B, C, D or ① ② ③ ④
  option_text TEXT NOT NULL,
  option_text_japanese TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_options_question ON public.question_options(question_id);

-- ============================================================
-- MODULE ↔ QUESTION JOIN (ordered)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.module_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (module_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_module_questions_module ON public.module_questions(module_id, sort_order);

-- ============================================================
-- KANJI ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kanji_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.content_collections(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.learning_modules(id) ON DELETE SET NULL,
  kanji TEXT NOT NULL,
  reading TEXT,
  meaning_en TEXT,
  meaning_si TEXT,
  example_sentence TEXT,
  example_reading TEXT,
  example_meaning TEXT,
  stroke_count INTEGER,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  lesson_number INTEGER,
  status public.content_status NOT NULL DEFAULT 'draft',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kanji_collection ON public.kanji_entries(collection_id);
CREATE INDEX IF NOT EXISTS idx_kanji_status ON public.kanji_entries(status);
CREATE INDEX IF NOT EXISTS idx_kanji_sort ON public.kanji_entries(collection_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_kanji_lesson ON public.kanji_entries(collection_id, lesson_number);

-- ============================================================
-- CONTENT IMPORTS (TXT upload jobs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.content_kind NOT NULL,
  collection_id UUID REFERENCES public.content_collections(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  storage_path TEXT,
  original_text TEXT,
  status public.import_status NOT NULL DEFAULT 'uploading',
  parser_used TEXT,             -- deterministic | ai | hybrid
  error_message TEXT,
  stats JSONB NOT NULL DEFAULT '{}', -- extracted count, failed, etc.
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_imports_status ON public.content_imports(status);
CREATE INDEX IF NOT EXISTS idx_imports_kind ON public.content_imports(kind);

-- ============================================================
-- IMPORT EXTRACTED ITEMS (pending admin review)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.import_extracted_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES public.content_imports(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'question', -- question | kanji | grammar
  sort_order INTEGER NOT NULL DEFAULT 0,
  raw_segment TEXT,
  extracted JSONB NOT NULL DEFAULT '{}',
  confidence TEXT DEFAULT 'medium',
  review_status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected | edited
  approved_question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  approved_kanji_id UUID REFERENCES public.kanji_entries(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_extracted_import ON public.import_extracted_items(import_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_extracted_review ON public.import_extracted_items(review_status);

-- ============================================================
-- PRACTICE SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES public.content_collections(id) ON DELETE SET NULL,
  module_id UUID REFERENCES public.learning_modules(id) ON DELETE SET NULL,
  kind public.content_kind NOT NULL,
  status public.practice_session_status NOT NULL DEFAULT 'in_progress',
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  score NUMERIC(6,2) NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.practice_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_module ON public.practice_sessions(module_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.practice_sessions(user_id, status);

-- ============================================================
-- PRACTICE ANSWERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.practice_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  kanji_entry_id UUID REFERENCES public.kanji_entries(id) ON DELETE SET NULL,
  selected_option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
  selected_text TEXT,
  is_correct BOOLEAN,
  points_earned INTEGER NOT NULL DEFAULT 0,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  time_spent_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_answers_session ON public.practice_answers(session_id);

-- ============================================================
-- USER PROGRESS (aggregated, unique per user+target)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES public.content_collections(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  kind public.content_kind NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  incorrect_answers INTEGER NOT NULL DEFAULT 0,
  best_score NUMERIC(6,2) NOT NULL DEFAULT 0,
  last_score NUMERIC(6,2) NOT NULL DEFAULT 0,
  completion_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_progress_unique UNIQUE NULLS NOT DISTINCT (user_id, collection_id, module_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_collection ON public.user_progress(collection_id);
CREATE INDEX IF NOT EXISTS idx_progress_kind ON public.user_progress(user_id, kind);

-- ============================================================
-- MEDIA ASSETS registry (extends uploaded_assets if exists)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  asset_type TEXT NOT NULL DEFAULT 'image', -- image | audio | document
  bucket TEXT NOT NULL DEFAULT 'media',
  related_collection_id UUID REFERENCES public.content_collections(id) ON DELETE SET NULL,
  related_module_id UUID REFERENCES public.learning_modules(id) ON DELETE SET NULL,
  related_question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_type ON public.media_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_media_uploader ON public.media_assets(uploaded_by);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
DO $$ BEGIN
  CREATE TRIGGER set_content_collections_updated_at
    BEFORE UPDATE ON public.content_collections
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_learning_modules_updated_at
    BEFORE UPDATE ON public.learning_modules
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_questions_updated_at
    BEFORE UPDATE ON public.questions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_kanji_entries_updated_at
    BEFORE UPDATE ON public.kanji_entries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_content_imports_updated_at
    BEFORE UPDATE ON public.content_imports
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_import_extracted_items_updated_at
    BEFORE UPDATE ON public.import_extracted_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_practice_sessions_updated_at
    BEFORE UPDATE ON public.practice_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_user_progress_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_media_assets_updated_at
    BEFORE UPDATE ON public.media_assets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.content_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanji_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_extracted_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Collections: published readable; past papers need verification
DROP POLICY IF EXISTS "Read published collections" ON public.content_collections;
CREATE POLICY "Read published collections"
  ON public.content_collections FOR SELECT
  USING (
    public.is_admin()
    OR (
      status = 'published'
      AND is_active_version = true
      AND (
        requires_verification = false
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.verification_status = 'verified'
        )
      )
    )
  );

DROP POLICY IF EXISTS "Admins manage collections" ON public.content_collections;
CREATE POLICY "Admins manage collections"
  ON public.content_collections FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Modules
DROP POLICY IF EXISTS "Read published modules" ON public.learning_modules;
CREATE POLICY "Read published modules"
  ON public.learning_modules FOR SELECT
  USING (
    public.is_admin()
    OR (
      status = 'published'
      AND EXISTS (
        SELECT 1 FROM public.content_collections c
        WHERE c.id = learning_modules.collection_id
          AND c.status = 'published'
          AND c.is_active_version = true
          AND (
            c.requires_verification = false
            OR EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = auth.uid() AND p.verification_status = 'verified'
            )
          )
      )
    )
  );

DROP POLICY IF EXISTS "Admins manage modules" ON public.learning_modules;
CREATE POLICY "Admins manage modules"
  ON public.learning_modules FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Questions: published only for users (no answer key leak via separate RPC for scoring)
DROP POLICY IF EXISTS "Read published questions" ON public.questions;
CREATE POLICY "Read published questions"
  ON public.questions FOR SELECT
  USING (
    public.is_admin()
    OR status = 'published'
  );

DROP POLICY IF EXISTS "Admins manage questions" ON public.questions;
CREATE POLICY "Admins manage questions"
  ON public.questions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Options: users can read options of published questions (correct flag hidden client-side for scoring via RPC)
DROP POLICY IF EXISTS "Read options of published questions" ON public.question_options;
CREATE POLICY "Read options of published questions"
  ON public.question_options FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_options.question_id AND q.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Admins manage options" ON public.question_options;
CREATE POLICY "Admins manage options"
  ON public.question_options FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Module questions
DROP POLICY IF EXISTS "Read module questions for published" ON public.module_questions;
CREATE POLICY "Read module questions for published"
  ON public.module_questions FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.learning_modules m
      WHERE m.id = module_questions.module_id AND m.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Admins manage module questions" ON public.module_questions;
CREATE POLICY "Admins manage module questions"
  ON public.module_questions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Kanji
DROP POLICY IF EXISTS "Read published kanji" ON public.kanji_entries;
CREATE POLICY "Read published kanji"
  ON public.kanji_entries FOR SELECT
  USING (public.is_admin() OR status = 'published');

DROP POLICY IF EXISTS "Admins manage kanji" ON public.kanji_entries;
CREATE POLICY "Admins manage kanji"
  ON public.kanji_entries FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Imports: admin only
DROP POLICY IF EXISTS "Admins manage imports" ON public.content_imports;
CREATE POLICY "Admins manage imports"
  ON public.content_imports FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage extracted items" ON public.import_extracted_items;
CREATE POLICY "Admins manage extracted items"
  ON public.import_extracted_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Practice sessions: own only
DROP POLICY IF EXISTS "Users manage own sessions" ON public.practice_sessions;
CREATE POLICY "Users manage own sessions"
  ON public.practice_sessions FOR ALL
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users manage own answers" ON public.practice_answers;
CREATE POLICY "Users manage own answers"
  ON public.practice_answers FOR ALL
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.practice_sessions s
      WHERE s.id = practice_answers.session_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.practice_sessions s
      WHERE s.id = practice_answers.session_id AND s.user_id = auth.uid()
    )
  );

-- Progress: own only
DROP POLICY IF EXISTS "Users manage own progress" ON public.user_progress;
CREATE POLICY "Users manage own progress"
  ON public.user_progress FOR ALL
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Media
DROP POLICY IF EXISTS "Read public media" ON public.media_assets;
CREATE POLICY "Read public media"
  ON public.media_assets FOR SELECT
  USING (is_public = true OR public.is_admin() OR uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Admins manage media" ON public.media_assets;
CREATE POLICY "Admins manage media"
  ON public.media_assets FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users upload media" ON public.media_assets;
CREATE POLICY "Users upload media"
  ON public.media_assets FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by OR public.is_admin());

-- ============================================================
-- RPC: Submit answer (server-side scoring – does not leak key early)
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_practice_answer(
  p_session_id UUID,
  p_question_id UUID,
  p_selected_option_id UUID DEFAULT NULL,
  p_selected_text TEXT DEFAULT NULL,
  p_kanji_entry_id UUID DEFAULT NULL,
  p_time_spent_ms INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_session public.practice_sessions%ROWTYPE;
  v_is_correct BOOLEAN := false;
  v_points INTEGER := 0;
  v_correct_option UUID;
  v_correct_text TEXT;
  v_explanation TEXT;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_session FROM public.practice_sessions
  WHERE id = p_session_id AND user_id = v_user;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_session.status <> 'in_progress' THEN
    RAISE EXCEPTION 'Session is not in progress';
  END IF;

  IF p_question_id IS NOT NULL THEN
    SELECT id, option_text INTO v_correct_option, v_correct_text
    FROM public.question_options
    WHERE question_id = p_question_id AND is_correct = true
    LIMIT 1;

    IF p_selected_option_id IS NOT NULL THEN
      v_is_correct := (p_selected_option_id = v_correct_option);
    ELSIF p_selected_text IS NOT NULL AND v_correct_text IS NOT NULL THEN
      v_is_correct := (lower(trim(p_selected_text)) = lower(trim(v_correct_text)));
    END IF;

    SELECT points, explanation INTO v_points, v_explanation
    FROM public.questions WHERE id = p_question_id;

    IF NOT v_is_correct THEN
      v_points := 0;
    END IF;
  END IF;

  INSERT INTO public.practice_answers (
    session_id, question_id, kanji_entry_id, selected_option_id,
    selected_text, is_correct, points_earned, time_spent_ms
  ) VALUES (
    p_session_id, p_question_id, p_kanji_entry_id, p_selected_option_id,
    p_selected_text, v_is_correct, COALESCE(v_points, 0), p_time_spent_ms
  );

  UPDATE public.practice_sessions
  SET
    correct_count = correct_count + CASE WHEN v_is_correct THEN 1 ELSE 0 END,
    score = score + COALESCE(v_points, 0),
    updated_at = now()
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'points_earned', COALESCE(v_points, 0),
    'correct_option_id', v_correct_option,
    'correct_text', v_correct_text,
    'explanation', v_explanation
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_practice_answer TO authenticated;

-- ============================================================
-- RPC: Complete practice session + update progress
-- ============================================================
CREATE OR REPLACE FUNCTION public.complete_practice_session(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_session public.practice_sessions%ROWTYPE;
  v_pct NUMERIC(5,2);
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_session FROM public.practice_sessions
  WHERE id = p_session_id AND user_id = v_user;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  UPDATE public.practice_sessions
  SET status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = p_session_id;

  IF v_session.total_questions > 0 THEN
    v_pct := ROUND((v_session.correct_count::numeric / v_session.total_questions) * 100, 2);
  ELSE
    v_pct := 0;
  END IF;

  INSERT INTO public.user_progress (
    user_id, collection_id, module_id, kind,
    attempts, correct_answers, incorrect_answers,
    best_score, last_score, completion_percent, is_completed, last_practiced_at
  ) VALUES (
    v_user, v_session.collection_id, v_session.module_id, v_session.kind,
    1, v_session.correct_count,
    GREATEST(v_session.total_questions - v_session.correct_count, 0),
    v_pct, v_pct, v_pct, (v_pct >= 80), now()
  )
  ON CONFLICT ON CONSTRAINT user_progress_unique DO UPDATE SET
    attempts = user_progress.attempts + 1,
    correct_answers = user_progress.correct_answers + EXCLUDED.correct_answers,
    incorrect_answers = user_progress.incorrect_answers + EXCLUDED.incorrect_answers,
    best_score = GREATEST(user_progress.best_score, EXCLUDED.best_score),
    last_score = EXCLUDED.last_score,
    completion_percent = GREATEST(user_progress.completion_percent, EXCLUDED.completion_percent),
    is_completed = user_progress.is_completed OR EXCLUDED.is_completed,
    last_practiced_at = now(),
    updated_at = now();

  RETURN jsonb_build_object(
    'session_id', p_session_id,
    'correct_count', v_session.correct_count,
    'total_questions', v_session.total_questions,
    'score_percent', v_pct
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_practice_session TO authenticated;

-- ============================================================
-- RPC: Publish collection (activate version, archive previous active)
-- ============================================================
CREATE OR REPLACE FUNCTION public.publish_collection(p_collection_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_col public.content_collections%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT * INTO v_col FROM public.content_collections WHERE id = p_collection_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Collection not found';
  END IF;

  -- Archive other active versions of same kind+book/paper number
  UPDATE public.content_collections
  SET is_active_version = false, status = 'archived', updated_at = now()
  WHERE kind = v_col.kind
    AND id <> p_collection_id
    AND is_active_version = true
    AND (
      (v_col.book_number IS NOT NULL AND book_number = v_col.book_number)
      OR (v_col.paper_number IS NOT NULL AND paper_number = v_col.paper_number)
      OR (v_col.book_number IS NULL AND v_col.paper_number IS NULL AND title = v_col.title)
    );

  UPDATE public.content_collections
  SET status = 'published', is_active_version = true, published_at = now(), updated_at = now()
  WHERE id = p_collection_id;

  -- Publish child modules marked draft that belong to this collection (optional soft publish)
  UPDATE public.learning_modules
  SET status = 'published', published_at = COALESCE(published_at, now()), updated_at = now()
  WHERE collection_id = p_collection_id AND status IN ('draft', 'needs_review');

  UPDATE public.kanji_entries
  SET status = 'published', updated_at = now()
  WHERE collection_id = p_collection_id AND status IN ('draft', 'needs_review');

  RETURN 'SUCCESS: Collection published and set as active version.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_collection TO authenticated;

-- ============================================================
-- Seed system setting for AI provider (optional)
-- ============================================================
INSERT INTO public.system_settings (key, value, description, is_public)
VALUES
  ('ai_parser_enabled', 'false', 'Enable AI-assisted TXT question extraction', false),
  ('ai_parser_provider', '"none"', 'AI provider: none | openai | anthropic', false)
ON CONFLICT (key) DO NOTHING;
