import { ContentAdmin } from '@/components/admin/content-admin';

export const metadata = { title: 'Admin · Grammar Practice' };

export default function Page() {
  return (
    <ContentAdmin
      kind="grammar"
      title="Grammar Practice"
      description="Grammar points, examples, and practice questions."
    />
  );
}
