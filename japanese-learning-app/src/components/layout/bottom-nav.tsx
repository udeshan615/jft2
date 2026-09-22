'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  Users,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/earnings', label: 'Earnings', icon: Wallet },
  { href: '/referral', label: 'Referral', icon: Users },
  { href: '/contact', label: 'Contact', icon: MessageCircle },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe md:hidden">
      <div className="mx-auto max-w-lg px-3 pb-3 pt-1">
        <div className="flex h-16 items-center justify-around rounded-2xl border border-border/80 bg-card/95 px-1 shadow-lg shadow-black/5 backdrop-blur-xl">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex min-h-[48px] min-w-[64px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-all duration-300',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground active:scale-95'
                )}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300',
                    isActive && 'bg-primary/12 scale-105'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-[22px] w-[22px] transition-transform duration-300',
                      isActive && 'scale-110'
                    )}
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium tracking-wide transition-all duration-300',
                    isActive ? 'opacity-100' : 'opacity-70'
                  )}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
