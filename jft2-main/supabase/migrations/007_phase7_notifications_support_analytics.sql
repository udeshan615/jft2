-- ============================================================
-- PHASE 7: Notifications, support tickets, FAQ, activity, hardening
-- Run AFTER 001–006
-- ============================================================

-- Notification types (text for flexibility)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'general',
  category TEXT NOT NULL DEFAULT 'system'
    CHECK (category IN (
      'account', 'earnings', 'game', 'referral', 'product', 'learning', 'announcement', 'support', 'system'
    )),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  reference_type TEXT,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(category);

-- Notification preferences (per user)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  earnings BOOLEAN NOT NULL DEFAULT true,
  game BOOLEAN NOT NULL DEFAULT true,
  referral BOOLEAN NOT NULL DEFAULT true,
  product BOOLEAN NOT NULL DEFAULT true,
  learning BOOLEAN NOT NULL DEFAULT true,
  announcement BOOLEAN NOT NULL DEFAULT true,
  support BOOLEAN NOT NULL DEFAULT true,
  -- account/system cannot be fully disabled
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'account', 'payment', 'verification', 'technical', 'other')),
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'waiting_user', 'waiting_support', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_user ON public.support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false, -- admin-only notes
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id, created_at);

-- FAQ
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faqs_status ON public.faqs(status, sort_order);

-- User activity (lightweight)
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON public.user_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_action ON public.user_activity(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.user_activity(created_at DESC);

-- Announcement enhancements
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS link_url TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'all'
    CHECK (audience IN ('all', 'verified', 'unverified'));

-- Contact settings seeds
INSERT INTO public.system_settings (key, value, description, is_public) VALUES
  ('contact_email', '"support@example.com"', 'Public support email', true),
  ('contact_whatsapp', '""', 'WhatsApp number with country code', true),
  ('contact_message', '"We are happy to help. Reach out anytime."', 'Contact page intro', true),
  ('support_hours', '"Mon–Fri 9:00–17:00"', 'Support hours display', true),
  ('app_name', '"Nihongo Rewards"', 'Application name', true),
  ('registration_enabled', 'true', 'Allow new registrations', true),
  ('notify_earnings', 'true', 'System default: earnings notifications', false),
  ('notify_games', 'true', 'System default: game notifications', false),
  ('notify_learning', 'true', 'System default: learning notifications', false)
ON CONFLICT (key) DO NOTHING;

-- Triggers
DO $$ BEGIN
  CREATE TRIGGER set_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_faqs_updated_at
    BEFORE UPDATE ON public.faqs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Inserts only via SECURITY DEFINER functions or admin
DROP POLICY IF EXISTS "System insert notifications" ON public.notifications;
CREATE POLICY "System insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own notif prefs" ON public.notification_preferences;
CREATE POLICY "Users manage own notif prefs"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users manage own tickets" ON public.support_tickets;
CREATE POLICY "Users manage own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users create tickets" ON public.support_tickets;
CREATE POLICY "Users create tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own open tickets" ON public.support_tickets;
CREATE POLICY "Users update own open tickets"
  ON public.support_tickets FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins all tickets" ON public.support_tickets;
CREATE POLICY "Admins all tickets"
  ON public.support_tickets FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Read ticket messages" ON public.support_messages;
CREATE POLICY "Read ticket messages"
  ON public.support_messages FOR SELECT
  USING (
    public.is_admin()
    OR (
      is_internal = false
      AND EXISTS (
        SELECT 1 FROM public.support_tickets t
        WHERE t.id = support_messages.ticket_id AND t.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Insert ticket messages" ON public.support_messages;
CREATE POLICY "Insert ticket messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      public.is_admin()
      OR (
        is_internal = false
        AND EXISTS (
          SELECT 1 FROM public.support_tickets t
          WHERE t.id = ticket_id AND t.user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Public read published FAQs" ON public.faqs;
CREATE POLICY "Public read published FAQs"
  ON public.faqs FOR SELECT
  USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage FAQs" ON public.faqs;
CREATE POLICY "Admins manage FAQs"
  ON public.faqs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users read own activity" ON public.user_activity;
CREATE POLICY "Users read own activity"
  ON public.user_activity FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Insert own activity" ON public.user_activity;
CREATE POLICY "Insert own activity"
  ON public.user_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins read all activity" ON public.user_activity;
CREATE POLICY "Admins read all activity"
  ON public.user_activity FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- RPC: Create notification (respects user prefs for non-critical)
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'system',
  p_type TEXT DEFAULT 'general',
  p_link TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_prefs public.notification_preferences%ROWTYPE;
  v_allowed BOOLEAN := true;
BEGIN
  -- Critical categories always allowed
  IF p_category NOT IN ('account', 'system') THEN
    SELECT * INTO v_prefs FROM public.notification_preferences WHERE user_id = p_user_id;
    IF FOUND THEN
      CASE p_category
        WHEN 'earnings' THEN v_allowed := v_prefs.earnings;
        WHEN 'game' THEN v_allowed := v_prefs.game;
        WHEN 'referral' THEN v_allowed := v_prefs.referral;
        WHEN 'product' THEN v_allowed := v_prefs.product;
        WHEN 'learning' THEN v_allowed := v_prefs.learning;
        WHEN 'announcement' THEN v_allowed := v_prefs.announcement;
        WHEN 'support' THEN v_allowed := v_prefs.support;
        ELSE v_allowed := true;
      END CASE;
    END IF;
  END IF;

  IF NOT v_allowed THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (
    user_id, title, body, category, type, link, reference_type, reference_id
  ) VALUES (
    p_user_id, p_title, p_body, p_category, p_type, p_link, p_reference_type, p_reference_id
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;

-- Mark all read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now()
  WHERE user_id = auth.uid() AND is_read = false;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;

-- Log activity helper
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.user_activity (user_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, COALESCE(p_metadata, '{}'))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_user_activity TO authenticated;

-- Admin analytics snapshot (aggregates only)
CREATE OR REPLACE FUNCTION public.admin_analytics_snapshot(
  p_from TIMESTAMPTZ DEFAULT (now() - interval '30 days'),
  p_to TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT jsonb_build_object(
    'users_total', (SELECT COUNT(*) FROM public.profiles),
    'users_new', (SELECT COUNT(*) FROM public.profiles WHERE created_at BETWEEN p_from AND p_to),
    'users_verified', (SELECT COUNT(*) FROM public.profiles WHERE verification_status = 'verified'),
    'users_unverified', (SELECT COUNT(*) FROM public.profiles WHERE verification_status IS DISTINCT FROM 'verified'),
    'withdrawals_pending', (SELECT COUNT(*) FROM public.withdrawal_requests WHERE status = 'pending'),
    'withdrawals_paid_amount', (
      SELECT COALESCE(SUM(amount_lkr), 0) FROM public.withdrawal_requests
      WHERE status IN ('paid', 'approved') AND created_at BETWEEN p_from AND p_to
    ),
    'commissions_pending', (
      SELECT COALESCE(SUM(amount_lkr), 0) FROM public.referral_commissions WHERE status = 'pending'
    ),
    'commissions_paid', (
      SELECT COALESCE(SUM(amount_lkr), 0) FROM public.referral_commissions
      WHERE status = 'paid' AND COALESCE(paid_at, created_at) BETWEEN p_from AND p_to
    ),
    'product_revenue', (
      SELECT COALESCE(SUM(amount_lkr), 0) FROM public.product_orders
      WHERE status = 'paid' AND COALESCE(paid_at, created_at) BETWEEN p_from AND p_to
    ),
    'orders_paid', (
      SELECT COUNT(*) FROM public.product_orders
      WHERE status = 'paid' AND COALESCE(paid_at, created_at) BETWEEN p_from AND p_to
    ),
    'referrals_total', (SELECT COUNT(*) FROM public.referrals),
    'referrals_period', (SELECT COUNT(*) FROM public.referrals WHERE created_at BETWEEN p_from AND p_to),
    'practice_sessions', (
      SELECT COUNT(*) FROM public.practice_sessions WHERE started_at BETWEEN p_from AND p_to
    ),
    'tickets_open', (
      SELECT COUNT(*) FROM public.support_tickets WHERE status IN ('open', 'waiting_support', 'waiting_user')
    ),
    'from', p_from,
    'to', p_to
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_analytics_snapshot TO authenticated;

-- Ensure new users get notification prefs
CREATE OR REPLACE FUNCTION public.ensure_notification_prefs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_notif_prefs ON public.profiles;
CREATE TRIGGER on_profile_notif_prefs
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_notification_prefs();
