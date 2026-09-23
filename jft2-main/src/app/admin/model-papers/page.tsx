import { ContentAdmin } from '@/components/admin/content-admin';

export const metadata = { title: 'Admin · Model Papers' };

export default function Page() {
  return (
    <ContentAdmin
      kind="model_paper"
      title="Model Papers"
      description="Create, import, review and publish model exam papers."
      showPaperNumber
    />
  );
}
