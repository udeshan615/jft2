-- ============================================================
-- Japanese Learning & Rewards App - Phase 1 Initial Schema
-- ============================================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Or via Supabase CLI: supabase db push
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE public.user_role AS ENUM ('user', 'admin');
CREATE TYPE public.verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE public.task_type AS ENUM (
  'whatsapp_join',
  'referral_count',
  'screenshot_upload',
  'custom',
  'external_link'
);
CREATE TYPE public.submission_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.transaction_type AS ENUM (
  'credit',
  'debit',
  'referral_bonus',
  'daily_game',
  'withdrawal',
  'adjustment',
  'reward'
);
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'paid', 'cancelled');
CREATE TYPE public.payment_method_type AS ENUM ('bank', 'mobile_money', 'other');
CREATE TYPE public.announcement_status AS ENUM ('draft', 'published', 'archived');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX idx_profiles_referred_by ON public.profiles(referred_by);
CREATE INDEX idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ============================================================
-- USER ROLES (role-based access - never trust frontend alone)
-- ============================================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'user',
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- ============================================================
-- SYSTEM SETTINGS (database-driven configuration)
-- ============================================================

CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false, -- if true, readable by authenticated users
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_settings_key ON public.system_settings(key);

-- Seed essential settings
INSERT INTO public.system_settings (key, value, description, is_public) VALUES
  ('referral_percentage', '10', 'Percentage of earnings given as referral bonus', true),
  ('referral_leaderboard_limit', '10', 'Number of top referrers shown on leaderboard', true),
  ('min_withdrawal_amount', '500', 'Minimum withdrawal amount in LKR', true),
  ('daily_game_enabled', 'true', 'Whether daily game is available', true),
  ('daily_game_start_time', '"00:00"', 'Daily game start time (HH:MM)', true),
  ('daily_game_end_time', '"23:59"', 'Daily game end time (HH:MM)', true),
  ('site_name', '"Nihongo Rewards"', 'Application display name', true),
  ('support_email', '"support@example.com"', 'Support contact email', true),
  ('first_admin_setup_secret', '""', 'One-time secret for first admin bootstrap (clear after use)', false);

-- ============================================================
-- VERIFICATION TASKS (admin-configurable)
-- ============================================================

CREATE TABLE public.verification_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  task_type public.task_type NOT NULL DEFAULT 'custom',
  requirements JSONB NOT NULL DEFAULT '{}', -- e.g. {"min_referrals": 2, "whatsapp_link": "..."}
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_tasks_enabled ON public.verification_tasks(is_enabled);
CREATE INDEX idx_verification_tasks_sort ON public.verification_tasks(sort_order);

-- ============================================================
-- VERIFICATION SUBMISSIONS
-- ============================================================

CREATE TABLE public.verification_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.verification_tasks(id) ON DELETE CASCADE,
  status public.submission_status NOT NULL DEFAULT 'pending',
  proof_url TEXT, -- storage path for screenshot etc.
  proof_metadata JSONB DEFAULT '{}',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_id)
);

CREATE INDEX idx_verification_submissions_user ON public.verification_submissions(user_id);
CREATE INDEX idx_verification_submissions_status ON public.verification_submissions(status);
CREATE INDEX idx_verification_submissions_task ON public.verification_submissions(task_id);

-- ============================================================
-- USER VERIFICATION (aggregate status helper / history)
-- ============================================================

CREATE TABLE public.user_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.verification_status NOT NULL DEFAULT 'unverified',
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  required_tasks INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_verification_status ON public.user_verification(status);

-- ============================================================
-- WALLETS / BALANCES
-- ============================================================

CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance_lkr NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (balance_lkr >= 0),
  pending_lkr NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (pending_lkr >= 0),
  lifetime_earned_lkr NUMERIC(12, 2) NOT NULL DEFAULT 0,
  lifetime_withdrawn_lkr NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);

-- ============================================================
-- TRANSACTIONS
-- ============================================================

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'completed',
  amount_lkr NUMERIC(12, 2) NOT NULL,
  balance_after NUMERIC(12, 2),
  description TEXT,
  reference_id UUID, -- polymorphic reference (referral, game, etc.)
  reference_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_reference ON public.transactions(reference_type, reference_id);

-- ============================================================
-- PAYMENT METHODS
-- ============================================================

CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.payment_method_type NOT NULL DEFAULT 'bank',
  label TEXT, -- e.g. "My HNB Account"
  account_name TEXT,
  account_number TEXT,
  bank_name TEXT,
  branch TEXT,
  phone_number TEXT, -- for mobile money
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_methods_user_id ON public.payment_methods(user_id);

-- ============================================================
-- WITHDRAWAL REQUESTS
-- ============================================================

CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  amount_lkr NUMERIC(12, 2) NOT NULL CHECK (amount_lkr > 0),
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_withdrawal_requests_user ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);

-- ============================================================
-- REFERRALS
-- ============================================================

CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, rewarded
  reward_amount_lkr NUMERIC(12, 2) DEFAULT 0,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON public.referrals(referred_id);

-- ============================================================
-- REFERRAL SETTINGS (can also use system_settings; this for game-specific)
-- ============================================================

CREATE TABLE public.referral_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.referral_settings (key, value, description) VALUES
  ('game_start_date', 'null', 'Referral game start date'),
  ('game_end_date', 'null', 'Referral game end date'),
  ('leaderboard_prizes', '[]', 'Array of prize objects for referral leaderboard');

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================

CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  status public.announcement_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_status ON public.announcements(status);
CREATE INDEX idx_announcements_dates ON public.announcements(starts_at, ends_at);

-- ============================================================
-- UPLOADED ASSETS / MEDIA METADATA
-- ============================================================

CREATE TABLE public.uploaded_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  filename TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  purpose TEXT, -- profile_avatar, verification_proof, announcement, paper, audio, etc.
  metadata JSONB DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bucket, path)
);

CREATE INDEX idx_uploaded_assets_owner ON public.uploaded_assets(owner_id);
CREATE INDEX idx_uploaded_assets_purpose ON public.uploaded_assets(purpose);

-- ============================================================
-- ADMIN AUDIT LOGS
-- ============================================================

CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- e.g. 'update_setting', 'approve_withdrawal', 'grant_role'
  target_entity TEXT, -- e.g. 'system_settings', 'withdrawal_requests', 'profiles'
  target_id UUID,
  previous_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_logs_admin ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_created ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_admin_audit_logs_target ON public.admin_audit_logs(target_entity, target_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_verification_tasks_updated_at
  BEFORE UPDATE ON public.verification_tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_verification_submissions_updated_at
  BEFORE UPDATE ON public.verification_submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_verification_updated_at
  BEFORE UPDATE ON public.user_verification
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_referral_settings_updated_at
  BEFORE UPDATE ON public.referral_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_uploaded_assets_updated_at
  BEFORE UPDATE ON public.uploaded_assets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE + WALLET + ROLE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_referral_code TEXT;
BEGIN
  -- Generate unique referral code
  new_referral_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO public.profiles (id, email, display_name, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    new_referral_code
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);

  INSERT INTO public.user_verification (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- HELPER: Check if current user is admin
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================================
-- HELPER: Get current user role
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ---------- PROFILES ----------
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Profiles are insertable by trigger only"
  ON public.profiles FOR INSERT
  WITH CHECK (false); -- handled by trigger

-- ---------- USER ROLES ----------
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------- SYSTEM SETTINGS ----------
CREATE POLICY "Public settings readable by authenticated"
  ON public.system_settings FOR SELECT
  USING (is_public = true OR public.is_admin());

CREATE POLICY "Only admins can modify settings"
  ON public.system_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------- VERIFICATION TASKS ----------
CREATE POLICY "Enabled tasks visible to authenticated users"
  ON public.verification_tasks FOR SELECT
  USING (is_enabled = true OR public.is_admin());

CREATE POLICY "Only admins manage verification tasks"
  ON public.verification_tasks FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------- VERIFICATION SUBMISSIONS ----------
CREATE POLICY "Users manage own submissions"
  ON public.verification_submissions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own submissions"
  ON public.verification_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending submissions"
  ON public.verification_submissions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all submissions"
  ON public.verification_submissions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------- USER VERIFICATION ----------
CREATE POLICY "Users view own verification"
  ON public.user_verification FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins manage user verification"
  ON public.user_verification FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------- WALLETS ----------
CREATE POLICY "Users view own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can update wallets"
  ON public.wallets FOR UPDATE
  USING (public.is_admin());

-- No direct insert/delete by users (trigger + admin only)

-- ---------- TRANSACTIONS ----------
CREATE POLICY "Users view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins manage transactions"
  ON public.transactions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------- PAYMENT METHODS ----------
CREATE POLICY "Users manage own payment methods"
  ON public.payment_methods FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all payment methods"
  ON public.payment_methods FOR SELECT
  USING (public.is_admin());

-- ---------- WITHDRAWAL REQUESTS ----------
CREATE POLICY "Users manage own withdrawals"
  ON public.withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create withdrawal requests"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own pending withdrawals"
  ON public.withdrawal_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all withdrawals"
  ON public.withdrawal_requests FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------- REFERRALS ----------
CREATE POLICY "Users view own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.is_admin());

CREATE POLICY "System/admins insert referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (public.is_admin() OR auth.uid() = referrer_id);

CREATE POLICY "Admins update referrals"
  ON public.referrals FOR UPDATE
  USING (public.is_admin());

-- ---------- REFERRAL SETTINGS ----------
CREATE POLICY "Authenticated can read referral settings"
  ON public.referral_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage referral settings"
  ON public.referral_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------- ANNOUNCEMENTS ----------
CREATE POLICY "Published announcements visible"
  ON public.announcements FOR SELECT
  USING (
    status = 'published'
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
    OR public.is_admin()
  );

CREATE POLICY "Admins manage announcements"
  ON public.announcements FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------- UPLOADED ASSETS ----------
CREATE POLICY "Users view own assets or public"
  ON public.uploaded_assets FOR SELECT
  USING (owner_id = auth.uid() OR is_public = true OR public.is_admin());

CREATE POLICY "Users insert own assets"
  ON public.uploaded_assets FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users update own assets"
  ON public.uploaded_assets FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Admins manage all assets"
  ON public.uploaded_assets FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------- ADMIN AUDIT LOGS ----------
CREATE POLICY "Only admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Only admins can insert audit logs"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (public.is_admin());

-- ============================================================
-- STORAGE BUCKETS (run in SQL or via Dashboard > Storage)
-- ============================================================
-- Note: Buckets are created via Supabase Dashboard or Storage API.
-- Recommended buckets:
--   avatars          (public read for avatars, private write)
--   verification     (private)
--   announcements    (public read)
--   educational      (authenticated read, admin write)
--   papers           (authenticated read, admin write)
--   audio            (authenticated read, admin write)
--   media            (general private)

-- Storage policies will be documented in README / setup guide.
-- Example for avatars (to be applied after bucket creation):

-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('verification', 'verification', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('announcements', 'announcements', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('educational', 'educational', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('papers', 'papers', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', false);

-- ============================================================
-- FIRST ADMIN BOOTSTRAP FUNCTION (secure one-time use)
-- ============================================================
-- Call this from SQL Editor AFTER creating your user account via the app,
-- using the secret you set in system_settings or directly.
-- See README for beginner-friendly steps.

CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(
  target_email TEXT,
  setup_secret TEXT
)
RETURNS TEXT AS $$
DECLARE
  stored_secret TEXT;
  target_user_id UUID;
  existing_admin_count INTEGER;
BEGIN
  -- Count existing admins
  SELECT COUNT(*) INTO existing_admin_count
  FROM public.user_roles WHERE role = 'admin';

  IF existing_admin_count > 0 THEN
    RETURN 'ERROR: An admin already exists. Bootstrap is disabled.';
  END IF;

  -- Get stored secret (or allow empty only if no secret set - but recommend setting one)
  SELECT value::text INTO stored_secret
  FROM public.system_settings
  WHERE key = 'first_admin_setup_secret';

  -- Remove quotes if JSON string
  stored_secret := trim(both '"' from COALESCE(stored_secret, ''));

  IF stored_secret IS NULL OR stored_secret = '' OR stored_secret = '""' THEN
    RETURN 'ERROR: first_admin_setup_secret is not set. Set it in system_settings first.';
  END IF;

  IF setup_secret IS DISTINCT FROM stored_secret THEN
    RETURN 'ERROR: Invalid setup secret.';
  END IF;

  -- Find user by email
  SELECT id INTO target_user_id
  FROM public.profiles
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RETURN 'ERROR: No user found with that email. Register first via the app.';
  END IF;

  -- Grant admin role
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (target_user_id, 'admin', target_user_id)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Clear the secret after successful use
  UPDATE public.system_settings
  SET value = '""', updated_at = now()
  WHERE key = 'first_admin_setup_secret';

  RETURN 'SUCCESS: User ' || target_email || ' is now an admin. Secret has been cleared.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
