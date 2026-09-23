-- ============================================================
-- PHASE 6: Paid products, referral commissions, purchase flow
-- Extends Phase 4 referrals + wallet. Run AFTER 001–005.
-- ============================================================

-- Extra transaction types (safe add)
DO $$ BEGIN
  ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'referral_commission';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'product_referral_commission';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'commission_reversal';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'referral_game_prize';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'product_purchase';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Referral columns for commission tracking
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS referral_code_used TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'signup',
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- System settings for commission rules
INSERT INTO public.system_settings (key, value, description, is_public) VALUES
  ('referral_commission_enabled', 'true', 'Global referral commission on/off', true),
  ('referral_commission_percent', '10', 'Default commission % on qualifying purchases', true),
  ('referral_require_verification', 'true', 'Referred user must be verified to qualify', true),
  ('referral_min_purchase_lkr', '0', 'Minimum purchase amount for commission', true),
  ('referral_attribution_days', '30', 'Days to keep ref= attribution cookie/window', true),
  ('referral_self_blocked', 'true', 'Block self-referrals', false),
  ('products_currency', '"LKR"', 'Display currency for products', true),
  ('payment_provider', '"manual"', 'Payment provider: manual | mock_test | external', false),
  ('payment_test_mode', 'true', 'Allow test/manual payment confirmation by admin', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  price_lkr NUMERIC(12, 2) NOT NULL CHECK (price_lkr >= 0),
  currency TEXT NOT NULL DEFAULT 'LKR',
  category TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'disabled', 'archived')),
  is_available BOOLEAN NOT NULL DEFAULT true,
  whats_included TEXT,
  commission_enabled BOOLEAN NOT NULL DEFAULT true,
  commission_percent NUMERIC(5, 2), -- NULL = use global
  commission_fixed_lkr NUMERIC(12, 2), -- optional fixed override
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_products_sort ON public.products(sort_order);

-- ============================================================
-- ORDERS / PURCHASES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  amount_lkr NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'LKR',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'awaiting_payment', 'paid', 'failed', 'cancelled', 'refunded')),
  payment_provider TEXT DEFAULT 'manual',
  payment_reference TEXT,
  payment_note TEXT,
  referrer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  access_granted BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.product_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_product ON public.product_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.product_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_referrer ON public.product_orders(referrer_id);

-- One active paid access per user+product (allow repurchase only if previous refunded)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_user_product_paid
  ON public.product_orders(user_id, product_id)
  WHERE status = 'paid';

-- ============================================================
-- PRODUCT ACCESS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.product_orders(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'revoked', 'expired')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_access_user ON public.product_access(user_id);

-- ============================================================
-- REFERRAL COMMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.product_orders(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'product_purchase', -- product_purchase | qualification | manual
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'paid', 'reversed', 'cancelled')),
  base_amount_lkr NUMERIC(12, 2) NOT NULL DEFAULT 0,
  percent NUMERIC(5, 2),
  amount_lkr NUMERIC(12, 2) NOT NULL CHECK (amount_lkr >= 0),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  reversal_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  idempotency_key TEXT UNIQUE, -- prevent duplicate commission for same event
  admin_note TEXT,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  reversed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commissions_referrer ON public.referral_commissions(referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.referral_commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_order ON public.referral_commissions(order_id);

-- ============================================================
-- TRIGGERS
-- ============================================================
DO $$ BEGIN
  CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_product_orders_updated_at
    BEFORE UPDATE ON public.product_orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_referral_commissions_updated_at
    BEFORE UPDATE ON public.referral_commissions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published products" ON public.products;
CREATE POLICY "Public read published products"
  ON public.products FOR SELECT
  USING (
    public.is_admin()
    OR (status = 'published' AND is_available = true)
  );

DROP POLICY IF EXISTS "Admins manage products" ON public.products;
CREATE POLICY "Admins manage products"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users read own orders" ON public.product_orders;
CREATE POLICY "Users read own orders"
  ON public.product_orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users create own orders" ON public.product_orders;
CREATE POLICY "Users create own orders"
  ON public.product_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage orders" ON public.product_orders;
CREATE POLICY "Admins manage orders"
  ON public.product_orders FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users read own access" ON public.product_access;
CREATE POLICY "Users read own access"
  ON public.product_access FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage access" ON public.product_access;
CREATE POLICY "Admins manage access"
  ON public.product_access FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users read own commissions" ON public.referral_commissions;
CREATE POLICY "Users read own commissions"
  ON public.referral_commissions FOR SELECT
  USING (auth.uid() = referrer_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage commissions" ON public.referral_commissions;
CREATE POLICY "Admins manage commissions"
  ON public.referral_commissions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- RPC: Create order (pending) with referral attribution
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_product_order(p_product_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_product public.products%ROWTYPE;
  v_order_id UUID;
  v_referrer UUID;
  v_referral_id UUID;
  v_existing UUID;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_product FROM public.products
  WHERE id = p_product_id AND status = 'published' AND is_available = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not available';
  END IF;

  -- Already has paid access?
  SELECT id INTO v_existing FROM public.product_access
  WHERE user_id = v_user AND product_id = p_product_id AND status = 'active';
  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'Already purchased';
  END IF;

  -- Pending order?
  SELECT id INTO v_existing FROM public.product_orders
  WHERE user_id = v_user AND product_id = p_product_id AND status IN ('pending', 'awaiting_payment');
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Referral: who referred this user?
  SELECT id, referrer_id INTO v_referral_id, v_referrer
  FROM public.referrals
  WHERE referred_id = v_user
    AND status NOT IN ('rejected', 'blocked')
  LIMIT 1;

  INSERT INTO public.product_orders (
    user_id, product_id, amount_lkr, currency, status,
    payment_provider, referrer_id, referral_id
  ) VALUES (
    v_user, p_product_id, v_product.price_lkr, v_product.currency, 'awaiting_payment',
    COALESCE((SELECT value::text FROM public.system_settings WHERE key = 'payment_provider'), 'manual'),
    v_referrer, v_referral_id
  )
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_product_order(UUID) TO authenticated;

-- ============================================================
-- RPC: Mark order paid (admin or secure payment webhook)
-- Grants access + creates pending commission if eligible
-- ============================================================
CREATE OR REPLACE FUNCTION public.confirm_product_payment(
  p_order_id UUID,
  p_payment_reference TEXT DEFAULT NULL,
  p_payment_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID := auth.uid();
  v_order public.product_orders%ROWTYPE;
  v_product public.products%ROWTYPE;
  v_commission_id UUID;
  v_percent NUMERIC(5, 2);
  v_amount NUMERIC(12, 2);
  v_global_enabled BOOLEAN;
  v_min_purchase NUMERIC(12, 2);
  v_require_verified BOOLEAN;
  v_referred_verified BOOLEAN;
  v_idempotency TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only — payment confirmation is server/admin controlled';
  END IF;

  SELECT * INTO v_order FROM public.product_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status = 'paid' THEN
    RETURN jsonb_build_object('ok', true, 'message', 'Already paid', 'order_id', p_order_id);
  END IF;

  IF v_order.status NOT IN ('pending', 'awaiting_payment') THEN
    RAISE EXCEPTION 'Order cannot be marked paid from status %', v_order.status;
  END IF;

  SELECT * INTO v_product FROM public.products WHERE id = v_order.product_id;

  UPDATE public.product_orders
  SET
    status = 'paid',
    paid_at = now(),
    access_granted = true,
    payment_reference = COALESCE(p_payment_reference, payment_reference),
    payment_note = COALESCE(p_payment_note, payment_note),
    updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.product_access (user_id, product_id, order_id, status)
  VALUES (v_order.user_id, v_order.product_id, p_order_id, 'active')
  ON CONFLICT (user_id, product_id) DO UPDATE
    SET status = 'active', order_id = p_order_id, granted_at = now(), revoked_at = NULL;

  -- Commission
  SELECT COALESCE((value #>> '{}')::boolean, (value::text = 'true'), false)
  INTO v_global_enabled
  FROM public.system_settings WHERE key = 'referral_commission_enabled';

  SELECT COALESCE((value #>> '{}')::numeric, (value::text)::numeric, 0)
  INTO v_min_purchase
  FROM public.system_settings WHERE key = 'referral_min_purchase_lkr';

  SELECT COALESCE((value #>> '{}')::boolean, (value::text = 'true'), true)
  INTO v_require_verified
  FROM public.system_settings WHERE key = 'referral_require_verification';

  IF v_order.referrer_id IS NOT NULL
     AND COALESCE(v_global_enabled, true)
     AND v_order.amount_lkr >= COALESCE(v_min_purchase, 0)
     AND COALESCE(v_product.commission_enabled, true)
  THEN
    -- verification check on referred user
    SELECT (verification_status = 'verified') INTO v_referred_verified
    FROM public.profiles WHERE id = v_order.user_id;

    IF NOT v_require_verified OR COALESCE(v_referred_verified, false) THEN
      -- percent priority: product override > global
      IF v_product.commission_fixed_lkr IS NOT NULL THEN
        v_amount := v_product.commission_fixed_lkr;
        v_percent := NULL;
      ELSE
        v_percent := COALESCE(
          v_product.commission_percent,
          (SELECT COALESCE((value #>> '{}')::numeric, (value::text)::numeric, 10)
           FROM public.system_settings WHERE key = 'referral_commission_percent')
        );
        v_amount := ROUND(v_order.amount_lkr * v_percent / 100.0, 2);
      END IF;

      IF v_amount > 0 THEN
        v_idempotency := 'order:' || p_order_id::text || ':commission';
        INSERT INTO public.referral_commissions (
          referrer_id, referred_id, referral_id, order_id, product_id,
          source, status, base_amount_lkr, percent, amount_lkr, idempotency_key
        ) VALUES (
          v_order.referrer_id, v_order.user_id, v_order.referral_id, p_order_id, v_order.product_id,
          'product_purchase', 'pending', v_order.amount_lkr, v_percent, v_amount, v_idempotency
        )
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id INTO v_commission_id;
      END IF;
    END IF;
  END IF;

  INSERT INTO public.admin_audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_admin, 'confirm_product_payment', 'product_orders', p_order_id,
    jsonb_build_object('commission_id', v_commission_id, 'amount', v_order.amount_lkr)
  );

  RETURN jsonb_build_object(
    'ok', true,
    'order_id', p_order_id,
    'commission_id', v_commission_id,
    'access_granted', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_product_payment(UUID, TEXT, TEXT) TO authenticated;

-- ============================================================
-- RPC: Approve & pay commission into wallet
-- ============================================================
CREATE OR REPLACE FUNCTION public.approve_referral_commission(p_commission_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID := auth.uid();
  v_c public.referral_commissions%ROWTYPE;
  v_wallet_id UUID;
  v_balance NUMERIC(12, 2);
  v_tx UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT * INTO v_c FROM public.referral_commissions WHERE id = p_commission_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Commission not found';
  END IF;

  IF v_c.status = 'paid' THEN
    RETURN v_c.transaction_id;
  END IF;

  IF v_c.status NOT IN ('pending', 'approved') THEN
    RAISE EXCEPTION 'Cannot pay commission in status %', v_c.status;
  END IF;

  SELECT id, balance_lkr INTO v_wallet_id, v_balance
  FROM public.wallets WHERE user_id = v_c.referrer_id FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  v_balance := COALESCE(v_balance, 0) + v_c.amount_lkr;

  UPDATE public.wallets SET balance_lkr = v_balance, updated_at = now()
  WHERE id = v_wallet_id;

  INSERT INTO public.transactions (
    user_id, wallet_id, type, status, amount_lkr, balance_after,
    description, reference_id, reference_type, created_by
  ) VALUES (
    v_c.referrer_id, v_wallet_id, 'product_referral_commission', 'completed',
    v_c.amount_lkr, v_balance,
    'Referral commission', p_commission_id, 'referral_commission', v_admin
  )
  RETURNING id INTO v_tx;

  UPDATE public.referral_commissions
  SET status = 'paid', transaction_id = v_tx, paid_at = now(),
      approved_by = v_admin, approved_at = COALESCE(approved_at, now()),
      updated_at = now()
  WHERE id = p_commission_id;

  INSERT INTO public.admin_audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (v_admin, 'approve_referral_commission', 'referral_commissions', p_commission_id,
    jsonb_build_object('amount', v_c.amount_lkr, 'tx', v_tx));

  RETURN v_tx;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_referral_commission(UUID) TO authenticated;

-- ============================================================
-- RPC: Reverse commission
-- ============================================================
CREATE OR REPLACE FUNCTION public.reverse_referral_commission(
  p_commission_id UUID,
  p_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID := auth.uid();
  v_c public.referral_commissions%ROWTYPE;
  v_wallet_id UUID;
  v_balance NUMERIC(12, 2);
  v_tx UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT * INTO v_c FROM public.referral_commissions WHERE id = p_commission_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Commission not found';
  END IF;

  IF v_c.status = 'reversed' THEN
    RETURN v_c.reversal_transaction_id;
  END IF;

  IF v_c.status = 'paid' AND v_c.transaction_id IS NOT NULL THEN
    SELECT id, balance_lkr INTO v_wallet_id, v_balance
    FROM public.wallets WHERE user_id = v_c.referrer_id FOR UPDATE;

    v_balance := COALESCE(v_balance, 0) - v_c.amount_lkr;

    UPDATE public.wallets SET balance_lkr = v_balance, updated_at = now()
    WHERE id = v_wallet_id;

    INSERT INTO public.transactions (
      user_id, wallet_id, type, status, amount_lkr, balance_after,
      description, reference_id, reference_type, created_by
    ) VALUES (
      v_c.referrer_id, v_wallet_id, 'commission_reversal', 'completed',
      -v_c.amount_lkr, v_balance,
      COALESCE(p_note, 'Commission reversal'), p_commission_id, 'referral_commission', v_admin
    )
    RETURNING id INTO v_tx;
  END IF;

  UPDATE public.referral_commissions
  SET status = 'reversed',
      reversal_transaction_id = v_tx,
      reversed_at = now(),
      admin_note = COALESCE(p_note, admin_note),
      updated_at = now()
  WHERE id = p_commission_id;

  INSERT INTO public.admin_audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (v_admin, 'reverse_referral_commission', 'referral_commissions', p_commission_id,
    jsonb_build_object('amount', v_c.amount_lkr, 'note', p_note));

  RETURN v_tx;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reverse_referral_commission(UUID, TEXT) TO authenticated;

-- ============================================================
-- RPC: Refund order (cancels pending commission / reverses paid)
-- ============================================================
CREATE OR REPLACE FUNCTION public.refund_product_order(p_order_id UUID, p_note TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID := auth.uid();
  v_order public.product_orders%ROWTYPE;
  v_c RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT * INTO v_order FROM public.product_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  UPDATE public.product_orders
  SET status = 'refunded', refunded_at = now(), access_granted = false, updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.product_access
  SET status = 'revoked', revoked_at = now()
  WHERE order_id = p_order_id;

  FOR v_c IN
    SELECT id, status FROM public.referral_commissions WHERE order_id = p_order_id
  LOOP
    IF v_c.status IN ('pending', 'approved') THEN
      UPDATE public.referral_commissions
      SET status = 'cancelled', admin_note = COALESCE(p_note, admin_note), updated_at = now()
      WHERE id = v_c.id;
    ELSIF v_c.status = 'paid' THEN
      PERFORM public.reverse_referral_commission(v_c.id, COALESCE(p_note, 'Order refunded'));
    END IF;
  END LOOP;

  INSERT INTO public.admin_audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (v_admin, 'refund_product_order', 'product_orders', p_order_id,
    jsonb_build_object('note', p_note));

  RETURN 'SUCCESS: Order refunded and commissions handled.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.refund_product_order(UUID, TEXT) TO authenticated;
