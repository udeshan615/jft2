'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BadgeCheck,
  Wallet,
  Banknote,
  Share2,
  Gamepad2,
  Megaphone,
  BookOpen,
  FileText,
  ScrollText,
  Languages,
  BookA,
  Headphones,
  BookMarked,
  Image,
  Settings,
  Shield,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';

const sections = [
  {
    title: 'Main',
    items: [
      { href: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/verification', label: 'Verification', icon: BadgeCheck },
    ],
  },
  {
    title: 'Finance',
    items: [
      { href: '/admin/earnings', label: 'Earnings', icon: Wallet },
      { href: '/admin/withdrawals', label: 'Withdrawals', icon: Banknote },
      { href: '/admin/referrals', label: 'Referrals', icon: Share2 },
      { href: '/admin/daily-game', label: 'Daily Game', icon: Gamepad2 },
    ],
  },
  {
    title: 'Content',
    items: [
      { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
      { href: '/admin/learning', label: 'Learning Content', icon: BookOpen },
      { href: '/admin/model-papers', label: 'Model Papers', icon: FileText },
      { href: '/admin/past-papers', label: 'Past Papers', icon: ScrollText },
      { href: '/admin/kanji', label: 'Kanji Practice', icon: Languages },
      { href: '/admin/grammar', label: 'Grammar Practice', icon: BookA },
      { href: '/admin/listening', label: 'Listening Practice', icon: Headphones },
      { href: '/admin/reading', label: 'Reading Practice', icon: BookMarked },
      { href: '/admin/media', label: 'Media / Assets', icon: Image },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/admin/system-settings', label: 'System Settings', icon: Settings },
      { href: '/admin/admin-settings', label: 'Admin Settings', icon: Shield },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <>
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link href="/admin/overview" className="flex items-center gap-2">
          <span className="text-lg font-semibold text-primary">Admin</span>
        </Link>
        <Link href="/dashboard" className="hidden md:block">
          <Button variant="ghost" size="icon-sm" title="Back to app">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-1.5 hover:bg-muted"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-semibold text-primary">Admin Panel</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
