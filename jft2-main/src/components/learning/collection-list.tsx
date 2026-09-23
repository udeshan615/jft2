'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Lock } from 'lucide-react';
import type { ContentCollection } from '@/lib/types/database';

interface Props {
  title: string;
  description: string;
  items: ContentCollection[];
  locked?: boolean;
  practiceKind: string;
}

export function CollectionList({ title, description, items, locked, practiceKind }: Props) {
  if (locked) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Lock className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Verification required</p>
              <p className="text-sm text-muted-foreground mt-1">
                Complete verification to unlock Past Papers.
              </p>
            </div>
            <Link
              href="/verification"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Go to Verification
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {items.length === 0 ? (
        <EmptyState title="Nothing published yet" description="Check back soon." />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Link key={item.id} href={`/learning/practice?collection=${item.id}&kind=${practiceKind}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    {item.difficulty && <Badge variant="outline">{item.difficulty}</Badge>}
                  </div>
                  <CardDescription>
                    {item.description || 'Start practice'}
                    {item.paper_number != null && ` · Paper ${item.paper_number}`}
                    {item.book_number != null && ` · Book ${item.book_number}`}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
