import { requireAdmin } from '@/lib/services/auth';
import { getAllSettingsAdmin } from '@/lib/services/settings';
import { SystemSettingsAdmin } from '@/components/admin/system-settings-admin';

export const metadata = { title: 'Admin · System Settings' };

export default async function AdminSystemSettingsPage() {
  await requireAdmin();
  const settings = await getAllSettingsAdmin();

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Contact info, daily game times, and general configuration
        </p>
      </div>
      <SystemSettingsAdmin settings={settings} />
    </div>
  );
}
