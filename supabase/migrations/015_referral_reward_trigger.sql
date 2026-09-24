-- Admin chooses when referral wallet credit is given:
--   on_verified (default) — referred user must be verified
--   on_join              — as soon as referred user registers with code

INSERT INTO public.system_settings (key, value, description, is_public)
VALUES
  ('referral_reward_trigger', '"on_verified"', 'When to credit referral reward: on_verified | on_join', true)
ON CONFLICT (key) DO NOTHING;

-- Credit referrer if trigger matches and not already rewarded
CREATE OR REPLACE FUNCTION public.try_pay_referral_reward(p_referred_id UUID, p_reason TEXT DEFAULT 'verified')
RETURNS VOID AS $$
DECLARE
  v_ref public.referrals%ROWTYPE;
  v_amount NUMERIC(12,2);
  v_enabled BOOLEAN;
  v_trigger TEXT;
  v_tx UUID;
BEGIN
  SELECT * INTO v_ref FROM public.referrals WHERE referred_id = p_referred_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  IF v_ref.status = 'rewarded' OR v_ref.reward_transaction_id IS NOT NULL THEN RETURN; END IF;

  SELECT COALESCE(trim(both '"' from (value #>> '{}')), 'on_verified') INTO v_trigger
  FROM public.system_settings WHERE key = 'referral_reward_trigger';
  IF v_trigger IS NULL OR v_trigger = '' THEN
    -- fallback to old boolean setting
    IF EXISTS (
      SELECT 1 FROM public.system_settings
      WHERE key = 'referral_qualify_on_verified'
        AND COALESCE((value #>> '{}')::boolean, true) = false
    ) THEN
      v_trigger := 'on_join';
    ELSE
      v_trigger := 'on_verified';
    END IF;
  END IF;

  IF p_reason = 'join' AND v_trigger <> 'on_join' THEN
    RETURN;
  END IF;

  IF p_reason = 'verified' AND v_trigger <> 'on_verified' THEN
    -- still mark verified status on referral row
    UPDATE public.referrals SET status = 'verified', updated_at = now()
    WHERE id = v_ref.id AND status IN ('pending', 'registered');
    RETURN;
  END IF;

  IF p_reason = 'verified' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = p_referred_id AND verification_status = 'verified'
    ) THEN
      RETURN;
    END IF;
  END IF;

  SELECT COALESCE((value #>> '{}')::boolean, true) INTO v_enabled
  FROM public.system_settings WHERE key = 'referral_reward_enabled';

  SELECT COALESCE((value #>> '{}')::numeric, 200) INTO v_amount
  FROM public.system_settings WHERE key = 'referral_reward_amount_lkr';

  IF NOT COALESCE(v_enabled, true) OR COALESCE(v_amount, 0) <= 0 THEN
    UPDATE public.referrals
    SET status = CASE WHEN p_reason = 'verified' THEN 'qualified' ELSE status END,
        qualified_at = CASE WHEN p_reason = 'verified' THEN now() ELSE qualified_at END,
        updated_at = now()
    WHERE id = v_ref.id;
    RETURN;
  END IF;

  v_tx := public.wallet_credit(
    v_ref.referrer_id,
    v_amount,
    'referral_bonus'::public.transaction_type,
    CASE WHEN p_reason = 'join'
      THEN 'Referral reward (on join)'
      ELSE 'Referral reward (on verified)'
    END,
    v_ref.id,
    'referral',
    jsonb_build_object('referred_id', p_referred_id, 'trigger', p_reason),
    NULL
  );

  UPDATE public.referrals
  SET status = 'rewarded',
      reward_amount_lkr = v_amount,
      rewarded_at = now(),
      qualified_at = COALESCE(qualified_at, now()),
      reward_transaction_id = v_tx,
      updated_at = now()
  WHERE id = v_ref.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Replace qualify function to use shared payer
CREATE OR REPLACE FUNCTION public.try_qualify_referral(p_referred_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM public.try_pay_referral_reward(p_referred_id, 'verified');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- After referral row is inserted on signup, optionally pay on join
CREATE OR REPLACE FUNCTION public.on_referral_inserted()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.try_pay_referral_reward(NEW.referred_id, 'join');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_referral_on_insert ON public.referrals;
CREATE TRIGGER trg_referral_on_insert
  AFTER INSERT ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.on_referral_inserted();
