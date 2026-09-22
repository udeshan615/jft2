import { requireAdmin } from '@/lib/services/auth';
import {
  getAllVerificationTasksAdmin,
  getPendingSubmissionsAdmin,
} from '@/lib/services/verification';
import { VerificationAdmin } from '@/components/admin/verification-admin';

export const metadata = { title: 'Admin · Verification' };

export default async function AdminVerificationPage() {
  const admin = await requireAdmin();
  const [tasks, submissions] = await Promise.all([
    getAllVerificationTasksAdmin(),
    getPendingSubmissionsAdmin(),
  ]);

  return (
    <div className="space-y-2 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Verification</h1>
        <p className="text-muted-foreground">
          Manage tasks and review user submissions
        </p>
      </div>
      <VerificationAdmin
        tasks={tasks}
        submissions={submissions as Parameters<typeof VerificationAdmin>[0]['submissions']}
        adminId={admin.id}
      />
    </div>
  );
}
