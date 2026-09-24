/**
 * Server-side email helper.
 * Credentials MUST only exist in server env: EMAIL_USER, EMAIL_APP_PASSWORD.
 * Never import this module from client components.
 */

import { createClient } from '@/lib/supabase/server';

export type EmailTemplateKey = 'verification_success' | 'withdrawal_confirmation';

export interface SendTemplateParams {
  to: string;
  templateKey: EmailTemplateKey;
  placeholders?: Record<string, string>;
}

function applyPlaceholders(text: string, map: Record<string, string>): string {
  let out = text;
  for (const [k, v] of Object.entries(map)) {
    out = out.replaceAll(`{{${k}}}`, v ?? '');
  }
  return out;
}

export async function getEmailTemplate(key: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_key', key)
    .maybeSingle();
  return data;
}

export async function isEmailEnabled(settingKey: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', settingKey)
    .maybeSingle();
  if (!data) return true;
  const raw = data.value;
  const s = typeof raw === 'string' ? raw.replace(/^"|"$/g, '') : String(raw);
  return s === 'true' || s === '1' || s === 'yes';
}

/**
 * Send via SMTP using EMAIL_USER + EMAIL_APP_PASSWORD.
 * Uses nodemailer if available; otherwise logs and no-ops in dev.
 */
export async function sendSystemEmail(params: SendTemplateParams): Promise<{ ok: boolean; error?: string }> {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn('[email] EMAIL_USER / EMAIL_APP_PASSWORD not configured — skip send');
    return { ok: false, error: 'Email not configured' };
  }

  const tpl = await getEmailTemplate(params.templateKey);
  if (!tpl || tpl.is_enabled === false) {
    return { ok: false, error: 'Template disabled or missing' };
  }

  const map = params.placeholders || {};
  const subject = applyPlaceholders(tpl.subject, map);
  const html = applyPlaceholders(tpl.body_html, map);
  const text = applyPlaceholders(tpl.body_text || '', map);

  try {
    // Dynamic import so build does not require nodemailer until installed
    const nodemailer = await import('nodemailer').catch(() => null);
    if (!nodemailer) {
      console.warn('[email] nodemailer not installed. Run: npm i nodemailer');
      console.info('[email] would send:', { to: params.to, subject });
      return { ok: false, error: 'nodemailer not installed' };
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

    const fromName = process.env.EMAIL_FROM_NAME || 'Nihongo Rewards';
    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: params.to,
      subject,
      html,
      text: text || undefined,
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Send failed';
    console.error('[email]', msg);
    return { ok: false, error: msg };
  }
}
