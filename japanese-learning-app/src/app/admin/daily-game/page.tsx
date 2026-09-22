import { requireAdmin } from '@/lib/services/auth';
import { getAllGamesAdmin } from '@/lib/services/daily-game';
import { DailyGameAdmin } from '@/components/admin/daily-game-admin';

export const metadata = { title: 'Admin · Daily Game' };

export default async function AdminDailyGamePage() {
  const admin = await requireAdmin();
  const games = await getAllGamesAdmin();

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Daily Game</h1>
        <p className="text-muted-foreground">
          Create games, questions, leaderboard and winners
        </p>
      </div>
      <DailyGameAdmin games={games} adminId={admin.id} />
    </div>
  );
}
