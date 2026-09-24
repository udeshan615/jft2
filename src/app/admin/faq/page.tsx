import { requireAdmin } from '@/lib/services/auth';
import { listAllFaqs } from '@/lib/services/support';
import { FaqAdmin } from '@/components/admin/faq-admin';

export const metadata = { title: 'Admin · FAQ' };

export default async function Page() {
  await requireAdmin();
  const faqs = await listAllFaqs();
  return <FaqAdmin faqs={faqs} />;
}
