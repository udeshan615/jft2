-- ============================================================
-- PHASE 9: Data integrity & production hardening
-- Safe additive migration — run after 001–007
-- ============================================================

-- Ensure wallet balances cannot go negative (idempotent)
DO $$ BEGIN
  ALTER TABLE public.wallets
    DROP CONSTRAINT IF EXISTS wallets_balance_lkr_check;
  ALTER TABLE public.wallets
    ADD CONSTRAINT wallets_balance_lkr_check CHECK (balance_lkr >= 0);
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.wallets
    DROP CONSTRAINT IF EXISTS wallets_pending_lkr_check;
  ALTER TABLE public.wallets
    ADD CONSTRAINT wallets_pending_lkr_check CHECK (pending_lkr >= 0);
EXCEPTION WHEN others THEN NULL;
END $$;

-- Prevent self-referral at DB level if missing
DO $$ BEGIN
  ALTER TABLE public.referrals
    DROP CONSTRAINT IF EXISTS referrals_no_self;
  ALTER TABLE public.referrals
    ADD CONSTRAINT referrals_no_self CHECK (referrer_id <> referred_id);
EXCEPTION WHEN others THEN NULL;
END $$;

-- One referral row per referred user
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_referred_unique
  ON public.referrals (referred_id);

-- At most one pending withdrawal per user (reduces double-submit risk)
CREATE UNIQUE INDEX IF NOT EXISTS idx_withdrawals_one_pending_per_user
  ON public.withdrawal_requests (user_id)
  WHERE status = 'pending';

-- Notification preferences for existing users who missed trigger
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Helpful indexes for admin analytics
CREATE INDEX IF NOT EXISTS idx_transactions_created
  ON public.transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status_created
  ON public.withdrawal_requests (status, created_at DESC);

-- Comment for operators
COMMENT ON INDEX idx_withdrawals_one_pending_per_user IS
  'Phase 9: only one pending withdrawal per user at a time';
