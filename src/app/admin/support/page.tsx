import { requireAdmin } from '@/lib/services/auth';
import { listAllTickets } from '@/lib/services/support';
import { SupportAdmin } from '@/components/admin/support-admin';

export const metadata = { title: 'Admin · Support' };

export default async function Page() {
  await requireAdmin();
  const tickets = await listAllTickets(100);
  return <SupportAdmin tickets={tickets} />;
}
