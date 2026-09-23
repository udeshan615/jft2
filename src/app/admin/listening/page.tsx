import { ContentAdmin } from '@/components/admin/content-admin';

export const metadata = { title: 'Admin · Listening Practice' };

export default function Page() {
  return (
    <ContentAdmin
      kind="listening"
      title="Listening Practice"
      description="Audio, kaiwa, transcripts and listening questions."
    />
  );
}
