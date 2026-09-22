import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BadgeCheck, Wallet, Megaphone } from 'lucide-react';

export const metadata = { title: 'Admin Overview' };

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          Welcome to the Admin Panel. Use the sidebar to manage the platform.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Users', desc: 'Manage accounts & roles', icon: Users },
          { title: 'Verification', desc: 'Tasks & submissions', icon: BadgeCheck },
          { title: 'Earnings', desc: 'Balances & rewards', icon: Wallet },
          { title: 'Announcements', desc: 'Publish updates', icon: Megaphone },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader className="pb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">{item.title}</CardTitle>
              <CardDescription>{item.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Phase 1 status</CardTitle>
          <CardDescription>
            Foundation complete. Full management screens come in later phases.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Authentication & roles ready</p>
          <p>Database schema & RLS ready</p>
          <p>Admin route protection ready</p>
          <p>Navigation structure ready</p>
        </CardContent>
      </Card>
    </div>
  );
}
