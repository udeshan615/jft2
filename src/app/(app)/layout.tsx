import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/services/auth';
import { AppHeader } from '@/components/layout/app-header';
import { MobileTopBar } from '@/components/layout/mobile-top-bar';
import { BottomNav } from '@/components/layout/bottom-nav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader user={user} />
      <MobileTopBar userId={user.id} isAdmin={isAdmin} />
      {/* pb leaves room for fixed bottom nav + safe area on phones */}
      <main className="min-w-0 flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
        <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-6">
          {children}
        </div>
      </main>
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
