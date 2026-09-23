import { headers } from 'next/headers';

/**
 * Canonical public site origin for referral links, emails, metadata.
 * Prefer NEXT_PUBLIC_SITE_URL in production (custom domain).
 * Falls back to request host so Vercel preview/production still works.
 */
export async function getSiteUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') || h.get('host');
    const proto = h.get('x-forwarded-proto') || 'https';
    if (host) return `${proto === 'http' ? 'http' : 'https'}://${host}`;
  } catch {
    // headers() unavailable outside request context
  }

  return 'http://localhost:3000';
}
