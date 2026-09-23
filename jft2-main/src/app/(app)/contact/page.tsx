import { getCurrentUser } from '@/lib/services/auth';
import { getPublicSettings } from '@/lib/services/settings';
import { getMyTickets, listPublishedFaqs } from '@/lib/services/support';
import { SupportClient } from '@/components/support/support-client';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Contact' };

export default async function ContactPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const [settings, tickets, faqs] = await Promise.all([
    getPublicSettings(),
    getMyTickets(user.id),
    listPublishedFaqs(),
  ]);
  const strip = (v: unknown, fb = '') => String(v ?? fb).replace(/^"|"$/g, '');
  return (
    <SupportClient
      tickets={tickets}
      faqs={faqs}
      contactEmail={strip(settings.contact_email, 'support@example.com')}
      contactWhatsapp={strip(settings.contact_whatsapp)}
      contactMessage={strip(
        settings.contact_message,
        'We are happy to help. Reach out anytime.'
      )}
      supportHours={strip(settings.support_hours, 'Mon–Fri 9:00–17:00')}
    />
  );
}
