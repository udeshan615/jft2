import { getPublicSettings } from '@/lib/services/settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Mail, ExternalLink } from 'lucide-react';

export const metadata = { title: 'Contact' };

export default async function ContactPage() {
  const settings = await getPublicSettings();

  const email = String(settings.contact_email ?? 'support@example.com').replace(/"/g, '');
  const whatsapp = String(settings.contact_whatsapp ?? '').replace(/"/g, '');
  const message = String(
    settings.contact_message ?? 'We are happy to help. Reach out anytime.'
  ).replace(/"/g, '');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contact</h1>
        <p className="text-muted-foreground">Get help or send us a message</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <CardTitle>Support</CardTitle>
          </div>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3 transition hover:bg-muted"
            >
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </a>
          )}
          {whatsapp && (
            <a
              href={
                whatsapp.startsWith('http')
                  ? whatsapp
                  : `https://wa.me/${whatsapp.replace(/\D/g, '')}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3 transition hover:bg-muted"
            >
              <ExternalLink className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">WhatsApp</p>
                <p className="text-sm text-muted-foreground">{whatsapp}</p>
              </div>
            </a>
          )}
          {!email && !whatsapp && (
            <p className="text-sm text-muted-foreground">
              Contact details will appear once configured by the admin.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
