'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  Users,
  Menu,
  X,
  User,
  MessageCircle,
  ShoppingBag,
  Package,
  BadgeCheck,
  Settings,
  Bell,
  Shield,
  Gamepad2,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/** Phase 8 primary: Dashboard, Earnings, Referral, Contact */
const primaryItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/earnings', label: 'Earn', icon: Wallet },
  { href: '/referral', label: 'Refer', icon: Users },
  { href: '/contact', label: 'Contact', icon: MessageCircle },
];

const moreItems = [
  { href: '/learning', label: 'Learning', icon: BookOpen },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/purchases', label: 'Purchases', icon: Package },
  { href: '/daily-game', label: 'Daily Game', icon: Gamepad2 },
  { href: '/verification', label: 'Verification', icon: BadgeCheck },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive =
    moreItems.some(
      (i) => pathname === i.href || pathname.startsWith(i.href + '/')
    ) ||
    (isAdmin && pathname.startsWith('/admin'));

  return (
    <>
      {moreOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/40 md:hidden"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[70] max-h-[85dvh] overflow-y-auto rounded-t-3xl border border-border bg-card pb-safe shadow-xl md:hidden">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <span className="text-base font-semibold">More</span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 p-4 pb-10">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition active:scale-95',
                      active
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-border/80 bg-muted/40 text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                    <span className="text-[11px] font-medium leading-tight">{item.label}</span>
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  href="/admin/overview"
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition active:scale-95',
                    pathname.startsWith('/admin')
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border/80 bg-muted/40 text-foreground'
                  )}
                >
                  <Shield className="h-5 w-5" strokeWidth={1.75} />
                  <span className="text-[11px] font-medium leading-tight">Admin</span>
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe md:hidden" aria-label="Main">
        <div className="mx-auto max-w-lg px-2 pb-2 pt-1 sm:px-3 sm:pb-3">
          <div className="flex h-[64px] items-center justify-around rounded-2xl border border-border/80 bg-card/95 px-0.5 shadow-lg shadow-black/5 backdrop-blur-xl">
            {primaryItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 transition',
                    isActive ? 'text-primary' : 'text-muted-foreground active:scale-95'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl',
                      isActive && 'bg-primary/12'
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />
                  </div>
                  <span
                    className={cn(
                      'max-w-full truncate text-[10px] font-medium leading-none',
                      isActive ? 'opacity-100' : 'opacity-75'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                'relative flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1',
                moreActive || moreOpen ? 'text-primary' : 'text-muted-foreground active:scale-95'
              )}
              aria-label="Open more menu"
              aria-expanded={moreOpen}
            >
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl',
                  (moreActive || moreOpen) && 'bg-primary/12'
                )}
              >
                <Menu className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <span className="text-[10px] font-medium leading-none opacity-75">More</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
