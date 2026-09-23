import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AppUser, VerificationStatus } from '@/lib/types/database';

interface ProfileHeaderProps {
  user: AppUser;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const displayName =
    user.profile?.display_name || user.email?.split('@')[0] || 'Learner';
  const status: VerificationStatus =
    user.profile?.verification_status ?? 'unverified';

  const statusVariant =
    status === 'verified'
      ? 'success'
      : status === 'pending'
        ? 'warning'
        : status === 'rejected'
          ? 'destructive'
          : 'muted';

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/profile"
          className="flex items-center gap-4 transition-opacity hover:opacity-90"
        >
          <Avatar
            src={user.profile?.avatar_url}
            alt={displayName}
            fallback={displayName}
            size="lg"
          />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Hello, {displayName}
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant as 'success' | 'warning' | 'destructive' | 'muted'}>
                {status === 'verified' ? '✓ Verified' : status}
              </Badge>
              {user.role === 'admin' && <Badge variant="default">Admin</Badge>}
            </div>
          </div>
        </Link>
        <div className="rounded-xl bg-muted/60 px-4 py-3 text-center sm:min-w-[120px] sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Balance
          </p>
          <p className="text-2xl font-semibold text-primary">
            LKR {(user.wallet?.balance_lkr ?? 0).toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
