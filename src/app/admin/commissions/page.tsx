import { requireAdmin } from '@/lib/services/auth';
import { listCommissions } from '@/lib/services/products';
import { CommissionsAdmin } from '@/components/admin/commissions-admin';

export const metadata = { title: 'Admin · Commissions' };

export default async function Page() {
  await requireAdmin();
  const commissions = await listCommissions({ limit: 100 });
  return <CommissionsAdmin commissions={commissions} />;
}
