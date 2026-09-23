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
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <AppHeader user={user} />
      <MobileTopBar userId={user.id} isAdmin={isAdmin} />
      <main className="flex-1 pb-28 md:pb-8">
        <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-6">{children}</div>
      </main>
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
