import { requireAdmin } from '@/lib/services/auth';
import { getAllReferralGamesAdmin } from '@/lib/services/referrals';
import { ReferralGameAdmin } from '@/components/admin/referral-game-admin';

export const metadata = { title: 'Admin · Referral Game' };

export default async function AdminReferralGamePage() {
  await requireAdmin();
  const games = await getAllReferralGamesAdmin();

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Referral Game
        </h1>
        <p className="text-muted-foreground">
          Create games, view leaderboards, select winners, award prizes
        </p>
      </div>
      <ReferralGameAdmin games={games} />
    </div>
  );
}
