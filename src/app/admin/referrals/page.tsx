import { requireAdmin } from '@/lib/services/auth';
import {
  getAdminReferralOverview,
  getAdminReferralsList,
} from '@/lib/services/referrals';
import { getPublicSettings } from '@/lib/services/settings';
import { ReferralsAdmin } from '@/components/admin/referrals-admin';

export const metadata = { title: 'Admin · Referrals' };

export default async function AdminReferralsPage() {
  await requireAdmin();
  const [overview, referrals, settings] = await Promise.all([
    getAdminReferralOverview(),
    getAdminReferralsList(50),
    getPublicSettings(),
  ]);

  const rewardEnabled =
    settings.referral_reward_enabled === true ||
    settings.referral_reward_enabled === 'true';
  const rewardAmount = Number(settings.referral_reward_amount_lkr ?? 200) || 200;
  const rawTrigger = String(settings.referral_reward_trigger ?? 'on_verified').replace(/"/g, '');
  const rewardTrigger =
    rawTrigger === 'on_join' ? 'on_join' as const : 'on_verified' as const;

  return (
    <div className="animate-fade-in space-y-2">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Referrals</h1>
        <p className="text-muted-foreground">
          Overview, rewards config, and recent referrals
        </p>
      </div>
      <ReferralsAdmin
        overview={overview}
        referrals={referrals}
        rewardEnabled={rewardEnabled}
        rewardAmount={rewardAmount}
        rewardTrigger={rewardTrigger}
      />
    </div>
  );
}
