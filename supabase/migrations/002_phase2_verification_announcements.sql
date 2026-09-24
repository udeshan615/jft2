-- ============================================================
-- Phase 2: Verification flow support, user preferences, seeds
-- Run after 001_initial_schema.sql
-- ============================================================

-- User preferences (intro modals, etc.)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  verification_intro_seen BOOLEAN NOT NULL DEFAULT false,
  dashboard_intro_seen BOOLEAN NOT NULL DEFAULT false,
  earnings_intro_seen BOOLEAN NOT NULL DEFAULT false,
  referral_intro_seen BOOLEAN NOT NULL DEFAULT false,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON public.user_preferences(user_id);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all preferences"
  ON public.user_preferences FOR SELECT
  USING (public.is_admin());

CREATE TRIGGER set_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create preferences on signup (extend handle_new_user if needed via separate trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_created_preferences ON public.profiles;
CREATE TRIGGER on_profile_created_preferences
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();

-- Contact & dashboard settings seeds
INSERT INTO public.system_settings (key, value, description, is_public)
VALUES
  ('contact_email', '"support@example.com"', 'Support email shown on Contact page', true),
  ('contact_whatsapp', '""', 'WhatsApp support number or link', true),
  ('contact_message', '"We are happy to help. Reach out anytime."', 'Contact page friendly message', true),
  ('daily_game_start_time', '"09:00"', 'Daily game start (HH:MM, local/server)', true),
  ('daily_game_end_time', '"21:00"', 'Daily game end (HH:MM)', true),
  ('daily_game_enabled', 'true', 'Whether daily game is enabled', true),
  ('verification_checking_minutes', '0', 'Minutes to show checking state before pending (0 = immediate pending)', false)
ON CONFLICT (key) DO NOTHING;

-- Seed default verification tasks (only if none exist)
INSERT INTO public.verification_tasks (title, description, task_type, requirements, sort_order, is_enabled, is_required)
SELECT * FROM (VALUES
  (
    'Join WhatsApp Channel',
    'Join our official WhatsApp channel/group and upload a screenshot as proof that you joined.',
    'whatsapp_join'::public.task_type,
    '{"whatsapp_url": "", "checking_minutes": 0}'::jsonb,
    1,
    true,
    true
  ),
  (
    'Refer 2 Users',
    'Invite 2 friends to register using your referral code. The count updates automatically when they sign up.',
    'referral_count'::public.task_type,
    '{"min_referrals": 2}'::jsonb,
    2,
    true,
    true
  )
) AS v(title, description, task_type, requirements, sort_order, is_enabled, is_required)
WHERE NOT EXISTS (SELECT 1 FROM public.verification_tasks LIMIT 1);

-- Helper: count referrals for a user (approved/active)
CREATE OR REPLACE FUNCTION public.count_user_referrals(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.referrals
  WHERE referrer_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Helper: recompute verification status for a user (call after approve/reject or referral)
CREATE OR REPLACE FUNCTION public.recompute_user_verification(p_user_id UUID)
RETURNS void AS $$
DECLARE
  required_count INTEGER;
  completed_count INTEGER;
  new_status public.verification_status;
BEGIN
  SELECT COUNT(*) INTO required_count
  FROM public.verification_tasks
  WHERE is_enabled = true AND is_required = true;

  -- Completed = approved submissions for required enabled tasks
  SELECT COUNT(DISTINCT vs.task_id) INTO completed_count
  FROM public.verification_submissions vs
  JOIN public.verification_tasks vt ON vt.id = vs.task_id
  WHERE vs.user_id = p_user_id
    AND vs.status = 'approved'
    AND vt.is_enabled = true
    AND vt.is_required = true;

  -- Also count referral_count tasks that meet requirement without submission
  -- (handled in app layer for referral tasks; admin can approve or we auto-approve via trigger)

  IF required_count > 0 AND completed_count >= required_count THEN
    new_status := 'verified';
  ELSIF completed_count > 0 THEN
    new_status := 'pending';
  ELSE
    new_status := 'unverified';
  END IF;

  UPDATE public.profiles
  SET verification_status = new_status, updated_at = now()
  WHERE id = p_user_id;

  UPDATE public.user_verification
  SET
    status = new_status,
    completed_tasks = completed_count,
    required_tasks = required_count,
    verified_at = CASE WHEN new_status = 'verified' THEN COALESCE(verified_at, now()) ELSE NULL END,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: after submission status change, recompute
CREATE OR REPLACE FUNCTION public.on_submission_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.recompute_user_verification(NEW.user_id);
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.recompute_user_verification(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_submission_recompute ON public.verification_submissions;
CREATE TRIGGER trg_submission_recompute
  AFTER INSERT OR UPDATE OF status ON public.verification_submissions
  FOR EACH ROW EXECUTE FUNCTION public.on_submission_status_change();

-- Note: Storage policies for avatars & verification buckets should be set in Dashboard.
-- Recommended avatars policy (public read, owner write):
--   SELECT: true (or authenticated)
--   INSERT/UPDATE: auth.uid()::text = (storage.foldername(name))[1]
-- verification bucket: private, owner + admin only
