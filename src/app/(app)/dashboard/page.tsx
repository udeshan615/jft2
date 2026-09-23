import { getCurrentUser } from '@/lib/services/auth';
import { getActiveAnnouncements } from '@/lib/services/announcements';
import { getUserVerification } from '@/lib/services/verification';
import { getPublicSettings } from '@/lib/services/settings';
import { ProfileHeader } from '@/components/dashboard/profile-header';
import { VerificationStatusCard } from '@/components/dashboard/verification-status-card';
import { AnnouncementSlideshow } from '@/components/dashboard/announcement-slideshow';
import { DailyGameCard } from '@/components/dashboard/daily-game-card';
import { LearningCards } from '@/components/dashboard/learning-cards';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [announcements, userVerification, settings] = await Promise.all([
    getActiveAnnouncements(),
    getUserVerification(user.id),
    getPublicSettings(),
  ]);

  const status = user.profile?.verification_status ?? 'unverified';
  const completed = userVerification?.completed_tasks ?? 0;
  const required = userVerification?.required_tasks ?? 0;

  const dailyEnabled =
    settings.daily_game_enabled === true ||
    settings.daily_game_enabled === 'true';
  const startTime = String(settings.daily_game_start_time ?? '09:00').replace(
    /"/g,
    ''
  );
  const endTime = String(settings.daily_game_end_time ?? '21:00').replace(
    /"/g,
    ''
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <ProfileHeader user={user} />

      <VerificationStatusCard
        status={status}
        completedTasks={completed}
        requiredTasks={required}
      />

      <AnnouncementSlideshow announcements={announcements} />

      <DailyGameCard
        enabled={dailyEnabled}
        startTime={startTime}
        endTime={endTime}
      />

      <LearningCards />
    </div>
  );
}
