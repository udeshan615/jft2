import { getCurrentUser } from '@/lib/services/auth';
import {
  getMyReferrals,
  getMyReferralStats,
  getCurrentReferralGame,
  getReferralGameLeaderboard,
} from '@/lib/services/referrals';
import { getPublicSettings } from '@/lib/services/settings';
import { ReferralClient } from '@/components/referral/referral-client';

export const metadata = { title: 'Referral' };

export default async function ReferralPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const code = user.profile?.referral_code ?? '';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const [referrals, stats, game, settings] = await Promise.all([
    getMyReferrals(user.id),
    getMyReferralStats(user.id),
    getCurrentReferralGame(),
    getPublicSettings(),
  ]);

  const leaderboard = game
    ? await getReferralGameLeaderboard(game.id, game.leaderboard_size || 10)
    : [];

  const myEntry = leaderboard.find((r) => r.user_id === user.id);
  const myQualifiedInGame = myEntry?.qualified_count ?? 0;
  const myRank = myEntry?.rank ?? null;

  const commissionPercent =
    Number(settings.referral_commission_percent ?? 10) || 10;
  const requireVerification =
    settings.referral_require_verification === true ||
    settings.referral_require_verification === 'true' ||
    settings.referral_require_verification === undefined;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Referral</h1>
        <p className="text-muted-foreground">
          Invite friends and earn commission on qualifying purchases
        </p>
      </div>
      <ReferralClient
        code={code}
        siteUrl={siteUrl}
        stats={stats}
        referrals={referrals}
        game={game}
        leaderboard={leaderboard}
        myRank={myRank}
        myQualifiedInGame={myQualifiedInGame}
        commissionPercent={commissionPercent}
        requireVerification={!!requireVerification}
      />
    </div>
  );
}
