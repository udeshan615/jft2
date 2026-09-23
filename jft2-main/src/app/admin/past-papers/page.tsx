import { ContentAdmin } from '@/components/admin/content-admin';

export const metadata = { title: 'Admin · Past Papers' };

export default function Page() {
  return (
    <ContentAdmin
      kind="past_paper"
      title="Past Papers"
      description="Manage past papers. Published papers require user verification."
      showPaperNumber
      requiresVerificationDefault
    />
  );
}
