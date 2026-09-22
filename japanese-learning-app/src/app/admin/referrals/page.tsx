import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata = { title: 'Admin · Referrals' };

export default function Page() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Referrals</h1>
        <p className="text-muted-foreground">
          Manage Referrals settings and data.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Referrals</CardTitle>
          <CardDescription>
            This section will be fully implemented in a later phase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Coming soon"
            description="The admin controls for this area are part of Phase 2+ development. The navigation and database architecture are already in place."
          />
        </CardContent>
      </Card>
    </div>
  );
}
