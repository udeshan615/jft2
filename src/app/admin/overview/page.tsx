import { requireAdmin } from '@/lib/services/auth';
import { AnalyticsOverview } from '@/components/admin/analytics-overview';

export const metadata = { title: 'Admin Overview' };

export default async function AdminOverviewPage() {
  await requireAdmin();
  return <AnalyticsOverview />;
}
