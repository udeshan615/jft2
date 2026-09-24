import { requireAdmin } from '@/lib/services/auth';
import { getPendingWithdrawalsAdmin } from '@/lib/services/wallet';
import { WithdrawalsAdmin } from '@/components/admin/withdrawals-admin';

export const metadata = { title: 'Admin · Withdrawals' };

export default async function AdminWithdrawalsPage() {
  await requireAdmin();
  const rows = await getPendingWithdrawalsAdmin();

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Withdrawals</h1>
        <p className="text-muted-foreground">
          Review and process user withdrawal requests
        </p>
      </div>
      <WithdrawalsAdmin
        rows={rows as Parameters<typeof WithdrawalsAdmin>[0]['rows']}
      />
    </div>
  );
}
