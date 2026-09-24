import { getCurrentUser } from '@/lib/services/auth';
import { redirect } from 'next/navigation';
import {
  getUserWallet,
  getUserTransactions,
  getUserPaymentMethods,
  getUserWithdrawals,
} from '@/lib/services/wallet';
import { getPublicSettings } from '@/lib/services/settings';
import { getCurrentDailyGame } from '@/lib/services/daily-game';
import { EarningsClient } from '@/components/earnings/earnings-client';

export const metadata = { title: 'Earnings' };

export default async function EarningsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [wallet, transactions, paymentMethods, withdrawals, settings, currentGame] =
    await Promise.all([
      getUserWallet(user.id),
      getUserTransactions(user.id),
      getUserPaymentMethods(user.id),
      getUserWithdrawals(user.id),
      getPublicSettings(),
      getCurrentDailyGame(),
    ]);

  return (
    <EarningsClient
      userId={user.id}
      wallet={wallet}
      transactions={transactions}
      paymentMethods={paymentMethods}
      withdrawals={withdrawals}
      settings={settings}
      currentGame={currentGame}
    />
  );
}
