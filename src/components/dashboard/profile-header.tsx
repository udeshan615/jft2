import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import type { AppUser, VerificationStatus } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

interface ProfileHeaderProps {
  user: AppUser;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const displayName =
    user.profile?.display_name || user.email?.split('@')[0] || 'Learner';
  const status: VerificationStatus =
    user.profile?.verification_status ?? 'unverified';

  const isVerified = status === 'verified';
  const isPending = status === 'pending';

  return (
    <Link href="/profile" className="block group">
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl p-[1px] transition-transform duration-300 group-hover:scale-[1.01]',
          'bg-gradient-to-br from-[#123f6b] via-[#2a6f97] to-[#c99a2e]',
          'shadow-[0_12px_40px_-12px_rgba(18,63,107,0.55)]'
        )}
      >
        {/* Soft glow */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#c99a2e]/30 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-sky-300/25 blur-2xl" />

        <div className="relative rounded-[15px] bg-gradient-to-br from-[#0f355c] via-[#164a7a] to-[#1a5a6e] px-5 py-5 text-white">
          <div className="flex items-center gap-4">
            {/* User emoji only — no photo */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 text-3xl ring-2 ring-white/25 shadow-inner sm:h-16 sm:w-16 sm:text-4xl">
              👤
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-white/60">
                Hello
              </p>
              <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                {displayName}
              </h1>
              {user.email && (
                <p className="mt-0.5 truncate text-sm text-white/70">{user.email}</p>
              )}

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {/* Verified = green · Unverified = red */}
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/40">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                ) : isPending ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-200 ring-1 ring-amber-400/40">
                    Pending
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/25 px-2.5 py-0.5 text-xs font-semibold text-red-300 ring-1 ring-red-400/50">
                    Unverified
                  </span>
                )}
                {user.role === 'admin' && (
                  <span className="inline-flex rounded-full bg-[#c99a2e]/25 px-2.5 py-0.5 text-xs font-semibold text-[#f0d78c] ring-1 ring-[#c99a2e]/40">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
