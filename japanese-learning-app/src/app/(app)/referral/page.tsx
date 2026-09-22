import { getCurrentUser } from '@/lib/services/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Users, Link2, Trophy } from 'lucide-react';

export const metadata = { title: 'Referral' };

export default async function ReferralPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const code = user.profile?.referral_code ?? '—';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Referral</h1>
        <p className="text-muted-foreground">
          Invite friends and earn bonuses
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <CardTitle>Your referral code</CardTitle>
          </div>
          <CardDescription>
            Share this code or link with friends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center">
            <p className="text-3xl font-semibold tracking-widest text-primary">
              {code}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Full referral link and copy button will be available in Phase 2+
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Your referrals</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No referrals yet"
            description="When someone signs up with your code they will appear here."
            icon={<Users className="h-6 w-6" />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <CardTitle>Referral leaderboard</CardTitle>
          </div>
          <CardDescription>
            Top referrers and prizes (admin-configured)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Leaderboard coming soon"
            description="Referral games, dates and prizes will be managed from the Admin Panel."
            icon={<Trophy className="h-6 w-6" />}
          />
        </CardContent>
      </Card>
    </div>
  );
}
