-- ============================================================
-- Phase 3: Earnings, Withdrawals, Daily Game
-- Run AFTER 001 and 002
-- ============================================================

-- Extend withdrawal status with processing
DO $$ BEGIN
  ALTER TYPE public.withdrawal_status ADD VALUE IF NOT EXISTS 'processing';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Payment method settings seeds
INSERT INTO public.system_settings (key, value, description, is_public)
VALUES
  ('payment_bank_enabled', 'true', 'Allow bank account payment methods', true),
  ('payment_mobile_enabled', 'true', 'Allow mobile money payment methods', true),
  ('payment_bank_instructions', '"Enter your bank account details carefully."', 'Help text for bank form', true),
  ('payment_mobile_instructions', '"Enter the phone number registered for mobile money."', 'Help text for mobile form', true),
  ('max_withdrawal_amount', '100000', 'Maximum single withdrawal in LKR (0 = no max)', true),
  ('app_timezone', '"Asia/Colombo"', 'Display timezone for game times', true),
  ('daily_game_leaderboard_size', '10', 'Default top N on leaderboard', true)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- DAILY GAMES
-- ============================================================

CREATE TYPE public.daily_game_status AS ENUM (
  'draft',
  'published',
  'live',
  'ended',
  'cancelled'
);

CREATE TABLE public.daily_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status public.daily_game_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  prize_amount_lkr NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (prize_amount_lkr >= 0),
  max_winners INTEGER NOT NULL DEFAULT 1 CHECK (max_winners >= 1),
  leaderboard_size INTEGER NOT NULL DEFAULT 10 CHECK (leaderboard_size >= 1),
  require_verified BOOLEAN NOT NULL DEFAULT false,
  max_attempts INTEGER NOT NULL DEFAULT 1 CHECK (max_attempts >= 1),
  time_limit_seconds INTEGER, -- null = no limit
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX idx_daily_games_status ON public.daily_games(status);
CREATE INDEX idx_daily_games_starts ON public.daily_games(starts_at);
CREATE INDEX idx_daily_games_ends ON public.daily_games(ends_at);

CREATE TABLE public.daily_game_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.daily_games(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice', -- multiple_choice, text
  image_url TEXT,
  options JSONB NOT NULL DEFAULT '[]', -- [{id, text}]
  correct_option_id TEXT, -- for MCQ
  points INTEGER NOT NULL DEFAULT 1 CHECK (points >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_game_questions_game ON public.daily_game_questions(game_id);

CREATE TABLE public.daily_game_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.daily_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER, -- completion time in ms
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, submitted, abandoned
  answers JSONB NOT NULL DEFAULT '{}', -- {question_id: option_id or text}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_game_attempts_game ON public.daily_game_attempts(game_id);
CREATE INDEX idx_daily_game_attempts_user ON public.daily_game_attempts(user_id);
CREATE UNIQUE INDEX idx_daily_game_attempts_one_submitted
  ON public.daily_game_attempts(game_id, user_id)
  WHERE status = 'submitted';

CREATE TABLE public.daily_game_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.daily_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES public.daily_game_attempts(id) ON DELETE SET NULL,
  rank INTEGER,
  score INTEGER,
  prize_amount_lkr NUMERIC(12, 2) NOT NULL DEFAULT 0,
  prize_awarded BOOLEAN NOT NULL DEFAULT false,
  prize_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  notes TEXT,
  selected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, user_id)
);

CREATE INDEX idx_daily_game_winners_game ON public.daily_game_winners(game_id);

-- Triggers updated_at
CREATE TRIGGER set_daily_games_updated_at
  BEFORE UPDATE ON public.daily_games
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_daily_game_questions_updated_at
  BEFORE UPDATE ON public.daily_game_questions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_daily_game_attempts_updated_at
  BEFORE UPDATE ON public.daily_game_attempts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- RLS for Daily Game
-- ============================================================

ALTER TABLE public.daily_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_game_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_game_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_game_winners ENABLE ROW LEVEL SECURITY;

-- Games: published/live/ended visible to authenticated; admins all
CREATE POLICY "Users view published games"
  ON public.daily_games FOR SELECT
  USING (
    public.is_admin()
    OR (is_enabled = true AND status IN ('published', 'live', 'ended'))
  );

CREATE POLICY "Admins manage games"
  ON public.daily_games FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Questions: visible for published games (without correct answers exposure handled in app by not selecting correct for users - still need policy)
-- Users can read questions of visible games; correct_option_id is sensitive - strip in RPC/view later
CREATE POLICY "Users view questions of visible games"
  ON public.daily_game_questions FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.daily_games g
      WHERE g.id = game_id
        AND g.is_enabled = true
        AND g.status IN ('published', 'live', 'ended')
    )
  );

CREATE POLICY "Admins manage questions"
  ON public.daily_game_questions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Attempts: own only
CREATE POLICY "Users manage own attempts"
  ON public.daily_game_attempts FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users insert own attempts"
  ON public.daily_game_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own in-progress attempts"
  ON public.daily_game_attempts FOR UPDATE
  USING (auth.uid() = user_id AND status = 'in_progress')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all attempts"
  ON public.daily_game_attempts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Winners: readable by authenticated for ended games; admin manage
CREATE POLICY "Users view winners"
  ON public.daily_game_winners FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage winners"
  ON public.daily_game_winners FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- SECURE WALLET FUNCTIONS
-- ============================================================

-- Credit wallet (admin or system only via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.wallet_credit(
  p_user_id UUID,
  p_amount NUMERIC,
  p_type public.transaction_type,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_admin_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
  v_balance NUMERIC;
  v_tx_id UUID;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Only admin (or internal call with admin check) — allow if caller is admin OR service role
  IF p_admin_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = p_admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_admin_id IS NULL AND auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized to credit wallet';
  END IF;

  SELECT id, balance_lkr INTO v_wallet_id, v_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  v_balance := v_balance + p_amount;

  UPDATE public.wallets
  SET
    balance_lkr = v_balance,
    lifetime_earned_lkr = lifetime_earned_lkr + p_amount,
    updated_at = now()
  WHERE id = v_wallet_id;

  INSERT INTO public.transactions (
    user_id, wallet_id, type, status, amount_lkr, balance_after,
    description, reference_id, reference_type, metadata, created_by
  ) VALUES (
    p_user_id, v_wallet_id, p_type, 'completed', p_amount, v_balance,
    p_description, p_reference_id, p_reference_type, p_metadata,
    COALESCE(p_admin_id, auth.uid())
  )
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$;

-- Create withdrawal request (holds balance)
CREATE OR REPLACE FUNCTION public.create_withdrawal_request(
  p_amount NUMERIC,
  p_payment_method_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_wallet_id UUID;
  v_balance NUMERIC;
  v_pending NUMERIC;
  v_min NUMERIC;
  v_max NUMERIC;
  v_pm_owner UUID;
  v_tx_id UUID;
  v_wd_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  -- Min/max from settings
  SELECT COALESCE((value #>> '{}')::NUMERIC, 500) INTO v_min
  FROM public.system_settings WHERE key = 'min_withdrawal_amount';
  IF v_min IS NULL THEN v_min := 500; END IF;

  SELECT COALESCE((value #>> '{}')::NUMERIC, 0) INTO v_max
  FROM public.system_settings WHERE key = 'max_withdrawal_amount';
  IF v_max IS NULL THEN v_max := 0; END IF;

  IF p_amount < v_min THEN
    RAISE EXCEPTION 'Amount below minimum withdrawal of %', v_min;
  END IF;
  IF v_max > 0 AND p_amount > v_max THEN
    RAISE EXCEPTION 'Amount exceeds maximum withdrawal of %', v_max;
  END IF;

  -- Payment method ownership
  SELECT user_id INTO v_pm_owner
  FROM public.payment_methods
  WHERE id = p_payment_method_id;

  IF v_pm_owner IS NULL OR v_pm_owner <> v_user_id THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;

  SELECT id, balance_lkr, pending_lkr INTO v_wallet_id, v_balance, v_pending
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF p_amount > v_balance THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Hold funds
  UPDATE public.wallets
  SET
    balance_lkr = balance_lkr - p_amount,
    pending_lkr = pending_lkr + p_amount,
    updated_at = now()
  WHERE id = v_wallet_id;

  INSERT INTO public.transactions (
    user_id, wallet_id, type, status, amount_lkr, balance_after,
    description, reference_type, metadata
  ) VALUES (
    v_user_id, v_wallet_id, 'withdrawal', 'pending', p_amount,
    (SELECT balance_lkr FROM public.wallets WHERE id = v_wallet_id),
    'Withdrawal request', 'withdrawal_request',
    jsonb_build_object('payment_method_id', p_payment_method_id)
  )
  RETURNING id INTO v_tx_id;

  INSERT INTO public.withdrawal_requests (
    user_id, payment_method_id, amount_lkr, status, transaction_id
  ) VALUES (
    v_user_id, p_payment_method_id, p_amount, 'pending', v_tx_id
  )
  RETURNING id INTO v_wd_id;

  -- Link reference
  UPDATE public.transactions
  SET reference_id = v_wd_id
  WHERE id = v_tx_id;

  RETURN v_wd_id;
END;
$$;

-- Admin: process withdrawal status
CREATE OR REPLACE FUNCTION public.process_withdrawal(
  p_withdrawal_id UUID,
  p_new_status public.withdrawal_status,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID := auth.uid();
  v_wd RECORD;
  v_wallet_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_wd
  FROM public.withdrawal_requests
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  -- Valid transitions
  IF p_new_status = 'approved' AND v_wd.status <> 'pending' THEN
    RAISE EXCEPTION 'Can only approve pending withdrawals';
  END IF;
  IF p_new_status = 'processing' AND v_wd.status NOT IN ('pending', 'approved') THEN
    RAISE EXCEPTION 'Invalid transition to processing';
  END IF;
  IF p_new_status = 'paid' AND v_wd.status NOT IN ('pending', 'approved', 'processing') THEN
    RAISE EXCEPTION 'Invalid transition to paid';
  END IF;
  IF p_new_status = 'rejected' AND v_wd.status NOT IN ('pending', 'approved', 'processing') THEN
    RAISE EXCEPTION 'Invalid transition to rejected';
  END IF;
  IF p_new_status = 'cancelled' AND v_wd.status NOT IN ('pending') THEN
    RAISE EXCEPTION 'Can only cancel pending';
  END IF;

  SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = v_wd.user_id FOR UPDATE;

  IF p_new_status IN ('rejected', 'cancelled') THEN
    -- Release hold
    UPDATE public.wallets
    SET
      balance_lkr = balance_lkr + v_wd.amount_lkr,
      pending_lkr = GREATEST(0, pending_lkr - v_wd.amount_lkr),
      updated_at = now()
    WHERE id = v_wallet_id;

    UPDATE public.transactions
    SET status = 'cancelled', updated_at = now()
    WHERE id = v_wd.transaction_id;
  ELSIF p_new_status = 'paid' THEN
    UPDATE public.wallets
    SET
      pending_lkr = GREATEST(0, pending_lkr - v_wd.amount_lkr),
      lifetime_withdrawn_lkr = lifetime_withdrawn_lkr + v_wd.amount_lkr,
      updated_at = now()
    WHERE id = v_wallet_id;

    UPDATE public.transactions
    SET status = 'completed', updated_at = now()
    WHERE id = v_wd.transaction_id;
  END IF;

  UPDATE public.withdrawal_requests
  SET
    status = p_new_status,
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    processed_by = v_admin,
    processed_at = now(),
    updated_at = now()
  WHERE id = p_withdrawal_id;

  INSERT INTO public.admin_audit_logs (admin_id, action, target_entity, target_id, new_value)
  VALUES (
    v_admin,
    'withdrawal_' || p_new_status::text,
    'withdrawal_requests',
    p_withdrawal_id,
    jsonb_build_object('status', p_new_status, 'notes', p_admin_notes)
  );
END;
$$;

-- Submit daily game attempt and score server-side
CREATE OR REPLACE FUNCTION public.submit_daily_game_attempt(
  p_attempt_id UUID,
  p_answers JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_attempt RECORD;
  v_game RECORD;
  v_q RECORD;
  v_score INTEGER := 0;
  v_max INTEGER := 0;
  v_duration INTEGER;
  v_selected TEXT;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_attempt
  FROM public.daily_game_attempts
  WHERE id = p_attempt_id AND user_id = v_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;

  IF v_attempt.status <> 'in_progress' THEN
    RAISE EXCEPTION 'Attempt already submitted';
  END IF;

  SELECT * INTO v_game FROM public.daily_games WHERE id = v_attempt.game_id;

  IF v_game IS NULL OR NOT v_game.is_enabled THEN
    RAISE EXCEPTION 'Game not available';
  END IF;

  IF now() < v_game.starts_at OR now() > v_game.ends_at THEN
    RAISE EXCEPTION 'Game is not live';
  END IF;

  IF v_game.require_verified THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = v_user AND verification_status = 'verified'
    ) THEN
      RAISE EXCEPTION 'Verification required';
    END IF;
  END IF;

  FOR v_q IN
    SELECT * FROM public.daily_game_questions WHERE game_id = v_game.id
  LOOP
    v_max := v_max + v_q.points;
    v_selected := p_answers ->> v_q.id::text;
    IF v_q.correct_option_id IS NOT NULL AND v_selected IS NOT NULL
       AND v_selected = v_q.correct_option_id THEN
      v_score := v_score + v_q.points;
    END IF;
  END LOOP;

  v_duration := GREATEST(0, (EXTRACT(EPOCH FROM (now() - v_attempt.started_at)) * 1000)::INTEGER);

  IF v_game.time_limit_seconds IS NOT NULL
     AND v_duration > v_game.time_limit_seconds * 1000 THEN
    -- Still accept but could penalize; for now just record
    NULL;
  END IF;

  UPDATE public.daily_game_attempts
  SET
    answers = p_answers,
    score = v_score,
    max_score = v_max,
    duration_ms = v_duration,
    submitted_at = now(),
    status = 'submitted',
    updated_at = now()
  WHERE id = p_attempt_id;

  RETURN jsonb_build_object(
    'score', v_score,
    'max_score', v_max,
    'duration_ms', v_duration
  );
END;
$$;

-- Award prize to winner
CREATE OR REPLACE FUNCTION public.award_daily_game_prize(
  p_winner_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID := auth.uid();
  v_w RECORD;
  v_tx UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_w
  FROM public.daily_game_winners
  WHERE id = p_winner_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Winner not found';
  END IF;

  IF v_w.prize_awarded THEN
    RAISE EXCEPTION 'Prize already awarded';
  END IF;

  IF v_w.prize_amount_lkr <= 0 THEN
    RAISE EXCEPTION 'No prize amount';
  END IF;

  v_tx := public.wallet_credit(
    v_w.user_id,
    v_w.prize_amount_lkr,
    'daily_game',
    'Daily Game prize',
    v_w.game_id,
    'daily_game',
    jsonb_build_object('winner_id', p_winner_id),
    v_admin
  );

  UPDATE public.daily_game_winners
  SET
    prize_awarded = true,
    prize_transaction_id = v_tx
  WHERE id = p_winner_id;

  INSERT INTO public.admin_audit_logs (admin_id, action, target_entity, target_id, new_value)
  VALUES (
    v_admin, 'award_daily_game_prize', 'daily_game_winners', p_winner_id,
    jsonb_build_object('amount', v_w.prize_amount_lkr, 'user_id', v_w.user_id)
  );

  RETURN v_tx;
END;
$$;

-- Admin manual wallet adjustment
CREATE OR REPLACE FUNCTION public.admin_wallet_adjust(
  p_user_id UUID,
  p_amount NUMERIC,
  p_direction TEXT, -- 'credit' or 'debit'
  p_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID := auth.uid();
  v_wallet_id UUID;
  v_balance NUMERIC;
  v_tx UUID;
  v_signed NUMERIC;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN
    RAISE EXCEPTION 'Reason required';
  END IF;

  SELECT id, balance_lkr INTO v_wallet_id, v_balance
  FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF p_direction = 'credit' THEN
    v_signed := p_amount;
    v_balance := v_balance + p_amount;
    UPDATE public.wallets SET
      balance_lkr = v_balance,
      lifetime_earned_lkr = lifetime_earned_lkr + p_amount,
      updated_at = now()
    WHERE id = v_wallet_id;
  ELSIF p_direction = 'debit' THEN
    IF p_amount > v_balance THEN
      RAISE EXCEPTION 'Insufficient balance for debit';
    END IF;
    v_signed := p_amount;
    v_balance := v_balance - p_amount;
    UPDATE public.wallets SET
      balance_lkr = v_balance,
      updated_at = now()
    WHERE id = v_wallet_id;
  ELSE
    RAISE EXCEPTION 'direction must be credit or debit';
  END IF;

  INSERT INTO public.transactions (
    user_id, wallet_id, type, status, amount_lkr, balance_after,
    description, reference_type, metadata, created_by
  ) VALUES (
    p_user_id, v_wallet_id,
    CASE WHEN p_direction = 'credit' THEN 'adjustment'::public.transaction_type
         ELSE 'debit'::public.transaction_type END,
    'completed', v_signed, v_balance,
    p_reason, 'admin_adjustment',
    jsonb_build_object('direction', p_direction),
    v_admin
  )
  RETURNING id INTO v_tx;

  INSERT INTO public.admin_audit_logs (admin_id, action, target_entity, target_id, new_value)
  VALUES (
    v_admin, 'wallet_adjustment', 'wallets', v_wallet_id,
    jsonb_build_object('user_id', p_user_id, 'direction', p_direction, 'amount', p_amount, 'reason', p_reason)
  );

  RETURN v_tx;
END;
$$;

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION public.create_withdrawal_request(NUMERIC, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_daily_game_attempt(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_withdrawal(UUID, public.withdrawal_status, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_daily_game_prize(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_credit(UUID, NUMERIC, public.transaction_type, TEXT, UUID, TEXT, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_wallet_adjust(UUID, NUMERIC, TEXT, TEXT) TO authenticated;
