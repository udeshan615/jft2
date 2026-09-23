-- ============================================================
-- Phase 9+: Auto verification (10 min), referral auto-complete,
-- bank fee, email templates & toggles
-- ============================================================

-- Settings: verification auto-approve delay, bank fee, email toggles
INSERT INTO public.system_settings (key, value, description, is_public)
VALUES
  ('verification_auto_approve_minutes', '10', 'Minutes after WhatsApp proof submit before auto-approve', false),
  ('bank_fee_enabled', 'true', 'Whether bank withdrawal fee is applied', true),
  ('bank_fee_amount', '30', 'Bank withdrawal fee in LKR', true),
  ('verification_email_enabled', 'true', 'Send verification success email', false),
  ('withdrawal_email_enabled', 'true', 'Send withdrawal confirmation email', false),
  ('email_from_name', '"Nihongo Rewards"', 'Display name for outbound system emails', false),
  ('homepage_hero_title', '"YOUR WAY TO LEARN JAPANESE WITH AI!"', 'Homepage hero title', true),
  ('homepage_hero_subtitle', '"Learn Rōmaji, Kanji, Grammar, Listening, Reading, Kaiwa, Past Papers and more."', 'Homepage hero subtitle', true),
  ('homepage_hero_image', '""', 'Homepage hero image URL', true)
ON CONFLICT (key) DO NOTHING;

-- Email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage email templates" ON public.email_templates;
CREATE POLICY "Admins manage email templates"
  ON public.email_templates FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated read enabled templates" ON public.email_templates;
CREATE POLICY "Authenticated read enabled templates"
  ON public.email_templates FOR SELECT
  USING (auth.role() = 'authenticated');

INSERT INTO public.email_templates (template_key, subject, body_html, body_text, is_enabled)
VALUES
  (
    'verification_success',
    'You are verified',
    '<p>Hi {{name}},</p><p>Your account has been successfully verified.</p><p>You can now access full rewards and features.</p><p>— Nihongo Rewards</p>',
    'Hi {{name}}, Your account has been successfully verified. You can now access full rewards and features.',
    true
  ),
  (
    'withdrawal_confirmation',
    'Withdrawal request received',
    '<p>Hi {{name}},</p><p>Your withdrawal request has been submitted.</p><ul><li>Amount: Rs. {{amount}}</li><li>Fee: Rs. {{fee}}</li><li>Total deducted: Rs. {{total}}</li><li>Method: {{payment_method}}</li><li>Status: {{status}}</li><li>Date: {{date}}</li></ul><p>— Nihongo Rewards</p>',
    'Hi {{name}}, Withdrawal of Rs. {{amount}} (fee Rs. {{fee}}, total Rs. {{total}}) via {{payment_method}} is {{status}} on {{date}}.',
    true
  )
ON CONFLICT (template_key) DO NOTHING;

-- Homepage content categories (admin-manageable)
CREATE TABLE IF NOT EXISTS public.homepage_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon_key TEXT,
  image_url TEXT,
  destination_route TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read homepage categories" ON public.homepage_categories;
CREATE POLICY "Public read homepage categories"
  ON public.homepage_categories FOR SELECT
  USING (is_enabled = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage homepage categories" ON public.homepage_categories;
CREATE POLICY "Admins manage homepage categories"
  ON public.homepage_categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.homepage_categories (title, description, icon_key, destination_route, sort_order, is_enabled)
SELECT * FROM (VALUES
  ('Rōmaji', 'Learn Japanese pronunciation using Rōmaji', 'romaji', '/learning', 1, true),
  ('Kanji', 'Learn and practice Japanese Kanji', 'kanji', '/learning/kanji', 2, true),
  ('Grammar', 'Practice Japanese grammar', 'grammar', '/learning/grammar', 3, true),
  ('Listening', 'Improve your Japanese listening skills', 'listening', '/learning/listening', 4, true),
  ('Reading', 'Practice Japanese reading', 'reading', '/learning/reading', 5, true),
  ('Kaiwa', 'Practice Japanese conversations', 'kaiwa', '/learning/listening', 6, true),
  ('Past Papers', 'Practice previous exam papers', 'past', '/learning/past-papers', 7, true),
  ('Model Papers', 'Practice model exam papers', 'model', '/learning/model-papers', 8, true),
  ('Games', 'Learn Japanese through practice games', 'games', '/daily-game', 9, true),
  ('Practice', 'General practice questions', 'practice', '/learning/practice', 10, true)
) AS v(title, description, icon_key, destination_route, sort_order, is_enabled)
WHERE NOT EXISTS (SELECT 1 FROM public.homepage_categories LIMIT 1);

-- Column for auto-approve scheduling on submissions
ALTER TABLE public.verification_submissions
  ADD COLUMN IF NOT EXISTS auto_approve_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_verification_submissions_auto_approve
  ON public.verification_submissions (auto_approve_at)
  WHERE status = 'pending' AND auto_approve_at IS NOT NULL;

-- Auto-approve pending WhatsApp (and similar screenshot) submissions after delay
CREATE OR REPLACE FUNCTION public.process_auto_approvals()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  n INTEGER := 0;
BEGIN
  FOR r IN
    SELECT vs.id, vs.user_id, vs.task_id
    FROM public.verification_submissions vs
    JOIN public.verification_tasks vt ON vt.id = vs.task_id
    WHERE vs.status = 'pending'
      AND vs.auto_approve_at IS NOT NULL
      AND vs.auto_approve_at <= now()
      AND vt.task_type IN ('whatsapp_join', 'screenshot', 'upload')
  LOOP
    UPDATE public.verification_submissions
    SET
      status = 'approved',
      reviewed_at = now(),
      admin_note = COALESCE(admin_note, 'Auto-approved after verification period'),
      updated_at = now()
    WHERE id = r.id AND status = 'pending';

    n := n + 1;
    -- recompute triggered by status update
  END LOOP;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_auto_approvals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_auto_approvals() TO service_role;

-- When a WhatsApp/screenshot submission is inserted as pending, set auto_approve_at
CREATE OR REPLACE FUNCTION public.set_verification_auto_approve()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_minutes NUMERIC;
  v_task_type public.task_type;
BEGIN
  SELECT task_type INTO v_task_type
  FROM public.verification_tasks WHERE id = NEW.task_id;

  IF NEW.status = 'pending' AND v_task_type IN ('whatsapp_join', 'screenshot', 'upload') THEN
    SELECT COALESCE((value #>> '{}')::NUMERIC, 10) INTO v_minutes
    FROM public.system_settings WHERE key = 'verification_auto_approve_minutes';
    IF v_minutes IS NULL THEN v_minutes := 10; END IF;

    NEW.auto_approve_at := now() + (v_minutes || ' minutes')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_verification_auto_approve ON public.verification_submissions;
CREATE TRIGGER trg_set_verification_auto_approve
  BEFORE INSERT OR UPDATE OF status, proof_url ON public.verification_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_verification_auto_approve();

-- Auto-complete referral_count verification task when min referrals reached
CREATE OR REPLACE FUNCTION public.try_auto_complete_referral_task(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t RECORD;
  v_count INTEGER;
  v_min INTEGER;
  v_existing UUID;
BEGIN
  v_count := public.count_user_referrals(p_user_id);

  FOR t IN
    SELECT id, requirements
    FROM public.verification_tasks
    WHERE is_enabled = true
      AND task_type = 'referral_count'
  LOOP
    v_min := COALESCE((t.requirements->>'min_referrals')::INTEGER, 2);
    IF v_count >= v_min THEN
      SELECT id INTO v_existing
      FROM public.verification_submissions
      WHERE user_id = p_user_id AND task_id = t.id
      LIMIT 1;

      IF v_existing IS NULL THEN
        INSERT INTO public.verification_submissions (
          user_id, task_id, status, proof_metadata, reviewed_at, admin_note
        ) VALUES (
          p_user_id, t.id, 'approved',
          jsonb_build_object('referral_count', v_count, 'required', v_min, 'auto', true),
          now(), 'Auto-approved: referral requirement met'
        );
      ELSE
        UPDATE public.verification_submissions
        SET
          status = 'approved',
          proof_metadata = jsonb_build_object('referral_count', v_count, 'required', v_min, 'auto', true),
          reviewed_at = COALESCE(reviewed_at, now()),
          admin_note = COALESCE(admin_note, 'Auto-approved: referral requirement met'),
          updated_at = now()
        WHERE id = v_existing AND status IS DISTINCT FROM 'approved';
      END IF;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.try_auto_complete_referral_task(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.try_auto_complete_referral_task(UUID) TO service_role;

-- Trigger on referrals insert/update to auto-complete referral task
CREATE OR REPLACE FUNCTION public.on_referral_change_auto_verify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.try_auto_complete_referral_task(NEW.referrer_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_referral_auto_verify ON public.referrals;
CREATE TRIGGER trg_referral_auto_verify
  AFTER INSERT OR UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.on_referral_change_auto_verify();

-- Updated withdrawal with bank fee support
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
  v_pm_type TEXT;
  v_tx_id UUID;
  v_wd_id UUID;
  v_fee NUMERIC := 0;
  v_fee_enabled BOOLEAN := false;
  v_fee_amount NUMERIC := 30;
  v_total NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

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

  SELECT user_id, type INTO v_pm_owner, v_pm_type
  FROM public.payment_methods
  WHERE id = p_payment_method_id;

  IF v_pm_owner IS NULL OR v_pm_owner <> v_user_id THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;

  -- Bank fee only for bank type
  IF v_pm_type = 'bank' THEN
    SELECT COALESCE((value #>> '{}')::BOOLEAN, true) INTO v_fee_enabled
    FROM public.system_settings WHERE key = 'bank_fee_enabled';
    IF v_fee_enabled IS NULL THEN
      -- also accept string "true"/"false"
      SELECT CASE WHEN lower(COALESCE(value #>> '{}', 'true')) IN ('true', '1', 'yes') THEN true ELSE false END
      INTO v_fee_enabled
      FROM public.system_settings WHERE key = 'bank_fee_enabled';
    END IF;
    IF v_fee_enabled THEN
      SELECT COALESCE((value #>> '{}')::NUMERIC, 30) INTO v_fee_amount
      FROM public.system_settings WHERE key = 'bank_fee_amount';
      IF v_fee_amount IS NULL THEN v_fee_amount := 30; END IF;
      v_fee := v_fee_amount;
    END IF;
  END IF;

  v_total := p_amount + v_fee;

  SELECT id, balance_lkr, pending_lkr INTO v_wallet_id, v_balance, v_pending
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_total > v_balance THEN
    RAISE EXCEPTION 'Insufficient balance (need % including fee %)', v_total, v_fee;
  END IF;

  UPDATE public.wallets
  SET
    balance_lkr = balance_lkr - v_total,
    pending_lkr = pending_lkr + v_total,
    updated_at = now()
  WHERE id = v_wallet_id;

  INSERT INTO public.transactions (
    user_id, wallet_id, type, status, amount_lkr, balance_after,
    description, reference_type, metadata
  ) VALUES (
    v_user_id, v_wallet_id, 'withdrawal', 'pending', v_total,
    (SELECT balance_lkr FROM public.wallets WHERE id = v_wallet_id),
    CASE WHEN v_fee > 0 THEN format('Withdrawal %s + bank fee %s', p_amount, v_fee) ELSE 'Withdrawal request' END,
    'withdrawal_request',
    jsonb_build_object(
      'payment_method_id', p_payment_method_id,
      'withdrawal_amount', p_amount,
      'bank_fee', v_fee,
      'total_deducted', v_total
    )
  )
  RETURNING id INTO v_tx_id;

  INSERT INTO public.withdrawal_requests (
    user_id, payment_method_id, amount_lkr, status, transaction_id, admin_notes
  ) VALUES (
    v_user_id, p_payment_method_id, p_amount, 'pending', v_tx_id,
    CASE WHEN v_fee > 0 THEN format('Bank fee: %s', v_fee) ELSE NULL END
  )
  RETURNING id INTO v_wd_id;

  UPDATE public.transactions
  SET reference_id = v_wd_id
  WHERE id = v_tx_id;

  RETURN v_wd_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_withdrawal_request(NUMERIC, UUID) TO authenticated;

-- Client-callable: process due auto-approvals (safe; only approves expired pending)
-- Users call this on verification page load so approval happens without external cron
CREATE OR REPLACE FUNCTION public.run_due_auto_approvals()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.process_auto_approvals();
END;
$$;

GRANT EXECUTE ON FUNCTION public.run_due_auto_approvals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_due_auto_approvals() TO service_role;
