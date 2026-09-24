'use client';

import Link from 'next/link';
import { Settings, Shield, User } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { Button } from '@/components/ui/button';

export function MobileTopBar({
  userId,
  isAdmin = false,
}: {
  userId: string;
  isAdmin?: boolean;
}) {
  return (
    <div className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-border bg-card/95 px-3 backdrop-blur-md md:hidden">
      <Link href="/dashboard" className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-lg font-semibold tracking-tight text-primary">
          Nihongo Rewards
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-0.5">
        <NotificationBell userId={userId} />
        {isAdmin && (
          <Link href="/admin/overview">
            <Button variant="ghost" size="icon-sm" aria-label="Admin panel">
              <Shield className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <Link href="/profile">
          <Button variant="ghost" size="icon-sm" aria-label="Profile">
            <User className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/settings">
          <Button variant="ghost" size="icon-sm" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
