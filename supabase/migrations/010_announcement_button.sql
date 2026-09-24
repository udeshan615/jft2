-- Optional CTA button on announcements (e.g. WhatsApp join, external link)
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS link_url TEXT,
  ADD COLUMN IF NOT EXISTS button_label TEXT;

COMMENT ON COLUMN public.announcements.link_url IS 'Optional CTA URL (WhatsApp, Telegram, external page, etc.)';
COMMENT ON COLUMN public.announcements.button_label IS 'Optional button text shown under the announcement (e.g. Join WhatsApp)';
