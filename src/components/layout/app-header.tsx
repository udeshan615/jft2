'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  Users,
  MessageCircle,
  LogOut,
  Shield,
  BookOpen,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { NotificationBell } from '@/components/notifications/notification-bell';
import type { AppUser } from '@/lib/types/database';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/learning', label: 'Learning', icon: BookOpen },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/earnings', label: 'Earnings', icon: Wallet },
  { href: '/referral', label: 'Referral', icon: Users },
];

interface AppHeaderProps {
  user: AppUser;
}

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const displayName =
    user.profile?.display_name || user.email?.split('@')[0] || 'User';

  return (
    <header className="sticky top-0 z-40 hidden border-b border-border bg-card/95 backdrop-blur-md md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-[#123f6b]">Hela</span>
              <span className="text-[#c99a2e]">JFT</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell userId={user.id} />
          {user.role === 'admin' && (
            <Link href="/admin/overview">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Admin
              </Button>
            </Link>
          )}
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#123f6b]/10 text-base">
              👤
            </span>
            <span className="max-w-[120px] truncate text-sm font-medium">
              {displayName}
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLogout}
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
