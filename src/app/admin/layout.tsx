import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/services/auth';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/admin/overview');
  }

  if (user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-background md:flex-row">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 pb-8 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
