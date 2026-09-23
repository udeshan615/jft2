import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCollection, listModules, listKanji } from '@/lib/services/content';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Admin · Manage Content' };

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = await getCollection(id);
  if (!collection) notFound();

  const modules = await listModules(id);
  const kanji =
    collection.kind === 'kanji_book' ? await listKanji(id) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{collection.title}</h1>
          <p className="text-muted-foreground">
            {collection.kind.replace('_', ' ')} · v{collection.version}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{collection.status}</Badge>
          {collection.is_active_version && <Badge>Active</Badge>}
          <Link href="/admin/learning">
            <Button variant="outline" size="sm">
              Back
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            Modules and entries in this collection. Use Learning Content → Import TXT to add
            questions, then Publish from the list page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            <span className="text-muted-foreground">Description:</span>{' '}
            {collection.description || '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Modules:</span> {modules.length}
          </p>
          {collection.kind === 'kanji_book' && (
            <p>
              <span className="text-muted-foreground">Kanji entries:</span> {kanji.length}
            </p>
          )}
          {modules.length > 0 && (
            <ul className="list-disc pl-5 space-y-1">
              {modules.map((m) => (
                <li key={m.id}>
                  {m.title}{' '}
                  <Badge variant="outline" className="ml-1">
                    {m.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          {kanji.length > 0 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {kanji.slice(0, 48).map((k) => (
                <div
                  key={k.id}
                  className="rounded-lg border border-border p-2 text-center text-xl"
                  title={k.meaning_en ?? k.reading ?? ''}
                >
                  {k.kanji}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
