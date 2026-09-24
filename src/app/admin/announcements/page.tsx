import { requireAdmin } from '@/lib/services/auth';
import { getAllAnnouncementsAdmin } from '@/lib/services/announcements';
import { AnnouncementsAdmin } from '@/components/admin/announcements-admin';

export const metadata = { title: 'Admin · Announcements' };

export default async function AdminAnnouncementsPage() {
  const admin = await requireAdmin();
  const announcements = await getAllAnnouncementsAdmin();

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">
          Manage slideshow content on the Dashboard
        </p>
      </div>
      <AnnouncementsAdmin announcements={announcements} adminId={admin.id} />
    </div>
  );
}
