import { ContentAdmin } from '@/components/admin/content-admin';

export const metadata = { title: 'Admin · Reading Practice' };

export default function Page() {
  return (
    <ContentAdmin
      kind="reading"
      title="Reading Practice"
      description="Passages and reading comprehension questions."
    />
  );
}
