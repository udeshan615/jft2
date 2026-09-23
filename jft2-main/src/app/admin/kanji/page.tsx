import { ContentAdmin } from '@/components/admin/content-admin';

export const metadata = { title: 'Admin · Kanji Practice' };

export default function Page() {
  return (
    <ContentAdmin
      kind="kanji_book"
      title="Kanji Practice"
      description="Manage Iradori books and kanji entries. Import TXT then review before publish."
      showBookNumber
    />
  );
}
