-- ============================================================
-- PHASE 4: Referral system, qualification, rewards, referral game
-- Run AFTER 001, 002, 003
-- ============================================================

-- Extend referrals status model
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reward_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Prevent self-referral
DO $$ BEGIN
  ALTER TABLE public.referrals
    ADD CONSTRAINT referrals_no_self CHECK (referrer_id <> referred_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_status ON public.referrals(referrer_id, status);

-- Referral config defaults in system_settings
INSERT INTO public.system_settings (key, value, description, is_public) VALUES
  ('referral_reward_enabled', 'true', 'Whether qualified referrals earn a reward', true),
  ('referral_reward_amount_lkr', '200', 'Reward amount (LKR) per qualified referral', true),
  ('referral_qualify_on_verified', 'true', 'Qualify referral when referred user is verified', true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.referral_settings (key, value, description) VALUES
  ('reward_enabled', 'true', 'Referral rewards on/off'),
  ('reward_amount_lkr', '200', 'LKR per qualified referral'),
  ('qualify_on_verified', 'true', 'Auto-qualify when referred user verified')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- REFERRAL GAMES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.referral_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'live', 'ended', 'cancelled')),
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  points_per_qualified INTEGER NOT NULL DEFAULT 1,
  min_qualified_for_leaderboard INTEGER NOT NULL DEFAULT 1,
  leaderboard_size INTEGER NOT NULL DEFAULT 10,
  prize_amount_lkr NUMERIC(12, 2) NOT NULL DEFAULT 0,
  max_winners INTEGER NOT NULL DEFAULT 1,
  prize_enabled BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_referral_games_status ON public.referral_games(status);
CREATE INDEX IF NOT EXISTS idx_referral_games_starts ON public.referral_games(starts_at);

CREATE TABLE IF NOT EXISTS public.referral_game_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.referral_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  qualified_count INTEGER NOT NULL DEFAULT 0,
  prize_amount_lkr NUMERIC(12, 2) NOT NULL DEFAULT 0,
  prize_awarded BOOLEAN NOT NULL DEFAULT false,
  prize_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  admin_note TEXT,
  selected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  awarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, user_id),
  UNIQUE (game_id, rank)
);

CREATE INDEX IF NOT EXISTS idx_rg_winners_game ON public.referral_game_winners(game_id);

DROP TRIGGER IF EXISTS set_referral_games_updated_at ON public.referral_games;
CREATE TRIGGER set_referral_games_updated_at
  BEFORE UPDATE ON public.referral_games
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Update handle_new_user to attach referral from metadata
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_referral_code TEXT;
  ref_code TEXT;
  referrer UUID;
BEGIN
  new_referral_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO public.profiles (id, email, display_name, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    new_referral_code
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.wallets (user_id) VALUES (NEW.id);
  INSERT INTO public.user_verification (user_id) VALUES (NEW.id);

  -- Referral attribution from signup metadata
  ref_code := upper(trim(COALESCE(NEW.raw_user_meta_data->>'referral_code', '')));
  IF ref_code <> '' THEN
    SELECT id INTO referrer
    FROM public.profiles
    WHERE upper(referral_code) = ref_code
      AND id <> NEW.id
    LIMIT 1;

    IF referrer IS NOT NULL THEN
      UPDATE public.profiles SET referred_by = referrer WHERE id = NEW.id;
      INSERT INTO public.referrals (referrer_id, referred_id, status)
      VALUES (referrer, NEW.id, 'registered')
      ON CONFLICT (referred_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- Qualify referral when referred user becomes verified
-- ============================================================
CREATE OR REPLACE FUNCTION public.try_qualify_referral(p_referred_id UUID)
RETURNS VOID AS $$
DECLARE
  v_ref public.referrals%ROWTYPE;
  v_amount NUMERIC(12,2);
  v_enabled BOOLEAN;
  v_tx UUID;
  v_qualify BOOLEAN;
BEGIN
  SELECT * INTO v_ref FROM public.referrals WHERE referred_id = p_referred_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  IF v_ref.status IN ('qualified', 'rewarded') THEN RETURN; END IF;

  -- referred must be verified
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_referred_id AND verification_status = 'verified'
  ) THEN
    UPDATE public.referrals SET status = 'verified', updated_at = now()
    WHERE id = v_ref.id AND status IN ('pending', 'registered');
    RETURN;
  END IF;

  SELECT COALESCE((value #>> '{}')::boolean, true) INTO v_qualify
  FROM public.system_settings WHERE key = 'referral_qualify_on_verified';
  IF v_qualify IS DISTINCT FROM true AND v_qualify IS DISTINCT FROM NULL THEN
    -- if setting false, just mark verified
    UPDATE public.referrals SET status = 'verified', updated_at = now() WHERE id = v_ref.id;
    RETURN;
  END IF;

  UPDATE public.referrals
  SET status = 'qualified', qualified_at = now(), updated_at = now()
  WHERE id = v_ref.id
  RETURNING * INTO v_ref;

  SELECT COALESCE((value #>> '{}')::boolean, true) INTO v_enabled
  FROM public.system_settings WHERE key = 'referral_reward_enabled';

  SELECT COALESCE((value #>> '{}')::numeric, 200) INTO v_amount
  FROM public.system_settings WHERE key = 'referral_reward_amount_lkr';

  IF COALESCE(v_enabled, true) AND COALESCE(v_amount, 0) > 0 AND v_ref.reward_transaction_id IS NULL THEN
    v_tx := public.wallet_credit(
      v_ref.referrer_id,
      v_amount,
      'referral_bonus'::public.transaction_type,
      'Referral reward for qualified signup',
      v_ref.id,
      'referral',
      jsonb_build_object('referred_id', p_referred_id),
      NULL
    );
    UPDATE public.referrals
    SET status = 'rewarded',
        reward_amount_lkr = v_amount,
        rewarded_at = now(),
        reward_transaction_id = v_tx,
        updated_at = now()
    WHERE id = v_ref.id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Hook: when profile verification_status becomes verified
CREATE OR REPLACE FUNCTION public.on_profile_verification_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status = 'verified'
     AND (OLD.verification_status IS DISTINCT FROM 'verified') THEN
    PERFORM public.try_qualify_referral(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_profile_verification_referral ON public.profiles;
CREATE TRIGGER trg_profile_verification_referral
  AFTER UPDATE OF verification_status ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.on_profile_verification_change();

-- Manual attach (if registered without code, optional once)
CREATE OR REPLACE FUNCTION public.attach_referral_code(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_code TEXT := upper(trim(p_code));
  referrer UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF v_code = '' THEN RAISE EXCEPTION 'Code required'; END IF;

  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = v_uid) THEN
    RAISE EXCEPTION 'Referral already set';
  END IF;

  SELECT id INTO referrer FROM public.profiles
  WHERE upper(referral_code) = v_code AND id <> v_uid LIMIT 1;
  IF referrer IS NULL THEN RAISE EXCEPTION 'Invalid referral code'; END IF;

  UPDATE public.profiles SET referred_by = referrer WHERE id = v_uid;
  INSERT INTO public.referrals (referrer_id, referred_id, status)
  VALUES (referrer, v_uid, 'registered');

  RETURN jsonb_build_object('ok', true, 'referrer_id', referrer);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Referral game leaderboard (qualified counts in window)
CREATE OR REPLACE FUNCTION public.referral_game_leaderboard(p_game_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  qualified_count BIGINT,
  score BIGINT,
  first_qualified_at TIMESTAMPTZ
) AS $$
DECLARE
  v_game public.referral_games%ROWTYPE;
BEGIN
  SELECT * INTO v_game FROM public.referral_games WHERE id = p_game_id;
  IF NOT FOUND THEN RETURN; END IF;

  RETURN QUERY
  WITH counts AS (
    SELECT
      r.referrer_id AS uid,
      COUNT(*)::BIGINT AS qcount,
      MIN(r.qualified_at) AS first_q
    FROM public.referrals r
    WHERE r.status IN ('qualified', 'rewarded')
      AND r.qualified_at IS NOT NULL
      AND r.qualified_at >= v_game.starts_at
      AND r.qualified_at <= v_game.ends_at
    GROUP BY r.referrer_id
    HAVING COUNT(*) >= v_game.min_qualified_for_leaderboard
  )
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY c.qcount DESC, c.first_q ASC NULLS LAST, c.uid ASC
    ) AS rank,
    c.uid AS user_id,
    p.display_name,
    c.qcount AS qualified_count,
    (c.qcount * v_game.points_per_qualified)::BIGINT AS score,
    c.first_q AS first_qualified_at
  FROM counts c
  JOIN public.profiles p ON p.id = c.uid
  ORDER BY rank
  LIMIT GREATEST(COALESCE(p_limit, v_game.leaderboard_size), 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Select winner (admin)
CREATE OR REPLACE FUNCTION public.select_referral_game_winner(
  p_game_id UUID,
  p_user_id UUID,
  p_rank INTEGER,
  p_note TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_admin UUID := auth.uid();
  v_game public.referral_games%ROWTYPE;
  v_score INTEGER := 0;
  v_q INTEGER := 0;
  v_id UUID;
BEGIN
  IF v_admin IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  SELECT * INTO v_game FROM public.referral_games WHERE id = p_game_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Game not found'; END IF;

  SELECT COALESCE(qualified_count, 0), COALESCE(score, 0)
  INTO v_q, v_score
  FROM public.referral_game_leaderboard(p_game_id, 1000)
  WHERE user_id = p_user_id;

  INSERT INTO public.referral_game_winners (
    game_id, user_id, rank, score, qualified_count,
    prize_amount_lkr, admin_note, selected_by
  ) VALUES (
    p_game_id, p_user_id, p_rank, v_score, v_q,
    v_game.prize_amount_lkr, p_note, v_admin
  )
  ON CONFLICT (game_id, user_id) DO UPDATE
  SET rank = EXCLUDED.rank,
      score = EXCLUDED.score,
      qualified_count = EXCLUDED.qualified_count,
      admin_note = EXCLUDED.admin_note,
      selected_by = v_admin,
      selected_at = now()
  RETURNING id INTO v_id;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (v_admin, 'select_referral_game_winner', 'referral_game_winners', v_id,
    jsonb_build_object('game_id', p_game_id, 'user_id', p_user_id, 'rank', p_rank));

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Award referral game prize
CREATE OR REPLACE FUNCTION public.award_referral_game_prize(p_winner_id UUID)
RETURNS UUID AS $$
DECLARE
  v_admin UUID := auth.uid();
  v_w public.referral_game_winners%ROWTYPE;
  v_tx UUID;
BEGIN
  IF v_admin IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  SELECT * INTO v_w FROM public.referral_game_winners WHERE id = p_winner_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Winner not found'; END IF;
  IF v_w.prize_awarded THEN RAISE EXCEPTION 'Prize already awarded'; END IF;
  IF COALESCE(v_w.prize_amount_lkr, 0) <= 0 THEN RAISE EXCEPTION 'No prize amount'; END IF;

  v_tx := public.wallet_credit(
    v_w.user_id,
    v_w.prize_amount_lkr,
    'reward'::public.transaction_type,
    'Referral game prize',
    v_w.id,
    'referral_game',
    jsonb_build_object('game_id', v_w.game_id, 'rank', v_w.rank),
    v_admin
  );

  UPDATE public.referral_game_winners
  SET prize_awarded = true,
      prize_transaction_id = v_tx,
      awarded_at = now()
  WHERE id = p_winner_id;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (v_admin, 'award_referral_game_prize', 'referral_game_winners', p_winner_id,
    jsonb_build_object('amount', v_w.prize_amount_lkr, 'user_id', v_w.user_id));

  RETURN v_tx;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS
ALTER TABLE public.referral_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_game_winners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read enabled referral games" ON public.referral_games;
CREATE POLICY "Public read enabled referral games"
  ON public.referral_games FOR SELECT
  USING (
    is_enabled = true AND status IN ('published', 'live', 'ended')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admins manage referral games" ON public.referral_games;
CREATE POLICY "Admins manage referral games"
  ON public.referral_games FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read referral game winners" ON public.referral_game_winners;
CREATE POLICY "Public read referral game winners"
  ON public.referral_game_winners FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage referral game winners" ON public.referral_game_winners;
CREATE POLICY "Admins manage referral game winners"
  ON public.referral_game_winners FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Grants
GRANT EXECUTE ON FUNCTION public.attach_referral_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.referral_game_leaderboard(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.referral_game_leaderboard(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.select_referral_game_winner(UUID, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_referral_game_prize(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.try_qualify_referral(UUID) TO authenticated;


-- Allow referrers to see limited profile info of people they referred
DROP POLICY IF EXISTS "Referrers read referred profiles" ON public.profiles;
CREATE POLICY "Referrers read referred profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.referrals r
      WHERE r.referrer_id = auth.uid() AND r.referred_id = profiles.id
    )
  );

-- Admins already have broader access via existing policies
