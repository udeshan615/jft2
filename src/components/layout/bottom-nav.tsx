'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  Users,
  BookOpen,
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
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const primaryItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/learning', label: 'Learn', icon: BookOpen },
  { href: '/earnings', label: 'Earn', icon: Wallet },
  { href: '/referral', label: 'Refer', icon: Users },
];

const moreItems = [
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/purchases', label: 'My Purchases', icon: Package },
  { href: '/daily-game', label: 'Daily Game', icon: Gamepad2 },
  { href: '/verification', label: 'Verification', icon: BadgeCheck },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/contact', label: 'Contact', icon: MessageCircle },
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
          <div className="fixed bottom-0 left-0 right-0 z-[70] max-h-[85vh] overflow-y-auto rounded-t-3xl border border-border bg-card pb-safe shadow-xl md:hidden">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <span className="text-base font-semibold">Menu</span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-xl p-2 hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 p-4 pb-8">
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
                      'flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-border/80 px-2 py-3 text-center transition active:scale-95',
                      active
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'bg-muted/40 text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                    <span className="text-[11px] font-medium leading-tight">{item.label}</span>
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  href="/admin/overview"
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-border/80 px-2 py-3 text-center transition active:scale-95',
                    pathname.startsWith('/admin')
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'bg-muted/40 text-foreground'
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

      <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe md:hidden">
        <div className="mx-auto max-w-lg px-3 pb-3 pt-1">
          <div className="flex h-16 items-center justify-around rounded-2xl border border-border/80 bg-card/95 px-1 shadow-lg shadow-black/5 backdrop-blur-xl">
            {primaryItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-all',
                    isActive ? 'text-primary' : 'text-muted-foreground active:scale-95'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl',
                      isActive && 'bg-primary/12'
                    )}
                  >
                    <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.25 : 1.75} />
                  </div>
                  <span className={cn('text-[10px] font-medium', isActive ? 'opacity-100' : 'opacity-70')}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                'relative flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5',
                moreActive || moreOpen ? 'text-primary' : 'text-muted-foreground active:scale-95'
              )}
              aria-label="More menu"
            >
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl',
                  (moreActive || moreOpen) && 'bg-primary/12'
                )}
              >
                <Menu className="h-[22px] w-[22px]" strokeWidth={1.75} />
              </div>
              <span className="text-[10px] font-medium opacity-70">More</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
