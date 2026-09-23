/**
 * Central display helpers — LKR currency and dates.
 * Authoritative money values always come from the database; this is display only.
 */

export function formatLkr(
  value: number | string | null | undefined,
  opts?: { compact?: boolean }
): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 'LKR 0.00';
  if (opts?.compact && Math.abs(n) >= 100_000) {
    return `LKR ${n.toLocaleString('en-LK', {
      maximumFractionDigits: 0,
    })}`;
  }
  return `LKR ${n.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateTime(
  value: string | Date | null | undefined,
  opts?: { dateOnly?: boolean }
): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  if (opts?.dateOnly) {
    return d.toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return d.toLocaleString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Remaining ms → friendly countdown; never negative. */
export function formatCountdown(ms: number): string {
  const safe = Math.max(0, Math.floor(ms));
  const totalSec = Math.floor(safe / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export function friendlyError(err: unknown): string {
  if (!err) return 'Something went wrong. Please try again.';
  const msg =
    typeof err === 'string'
      ? err
      : err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : '';
  const lower = msg.toLowerCase();
  if (
    lower.includes('jwt') ||
    lower.includes('session') ||
    lower.includes('auth')
  ) {
    return 'Your session expired. Please sign in again.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network error. Check your connection and try again.';
  }
  if (lower.includes('permission') || lower.includes('rls') || lower.includes('42501')) {
    return 'You do not have permission to do that.';
  }
  if (lower.includes('duplicate') || lower.includes('unique')) {
    return 'This action was already completed.';
  }
  // Avoid leaking SQL / PostgREST internals
  if (
    lower.includes('postgrest') ||
    lower.includes('postgres') ||
    lower.includes('pgrst') ||
    lower.includes('relation') ||
    lower.includes('column')
  ) {
    return 'Something went wrong. Please try again.';
  }
  if (msg.length > 0 && msg.length < 120 && !lower.includes('exception')) {
    return msg;
  }
  return 'Something went wrong. Please try again.';
}
