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
    <div className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-[#123f6b]/10 bg-gradient-to-r from-[#f7fafc] via-white to-[#faf6ee] px-3 backdrop-blur-md md:hidden">
      <Link href="/dashboard" className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-lg font-bold tracking-tight">
          <span className="text-[#123f6b]">Hela</span>
          <span className="text-[#c99a2e]">JFT</span>
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-0.5">
        <NotificationBell userId={userId} />
        {isAdmin && (
          <Link href="/admin/overview">
            <Button variant="ghost" size="icon-sm" aria-label="Admin panel">
              <Shield className="h-4 w-4 text-[#123f6b]" />
            </Button>
          </Link>
        )}
        <Link href="/profile">
          <Button variant="ghost" size="icon-sm" aria-label="Profile">
            <span className="text-base">👤</span>
          </Button>
        </Link>
        <Link href="/settings">
          <Button variant="ghost" size="icon-sm" aria-label="Settings">
            <Settings className="h-4 w-4 text-[#123f6b]" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
