'use client';

import Link from 'next/link';
import {
  FileText,
  ScrollText,
  Languages,
  BookA,
  Headphones,
  BookMarked,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { UserProgress } from '@/lib/types/database';

const MODULES = [
  {
    href: '/learning/model-papers',
    title: 'Model Papers',
    desc: 'Practice full exam-style papers',
    icon: FileText,
    kind: 'model_paper',
  },
  {
    href: '/learning/past-papers',
    title: 'Past Papers',
    desc: 'Official-style past exams (verification required)',
    icon: ScrollText,
    kind: 'past_paper',
    locked: true,
  },
  {
    href: '/learning/kanji',
    title: 'Kanji Practice',
    desc: 'Iradori books — meaning & reading',
    icon: Languages,
    kind: 'kanji_book',
  },
  {
    href: '/learning/grammar',
    title: 'Grammar Practice',
    desc: 'Grammar points with examples',
    icon: BookA,
    kind: 'grammar',
  },
  {
    href: '/learning/listening',
    title: 'Listening Practice',
    desc: 'Audio & kaiwa comprehension',
    icon: Headphones,
    kind: 'listening',
  },
  {
    href: '/learning/reading',
    title: 'Reading Practice',
    desc: 'Passages and comprehension',
    icon: BookMarked,
    kind: 'reading',
  },
];

interface LearningHubProps {
  verified: boolean;
  progress: UserProgress[];
}

export function LearningHub({ verified, progress }: LearningHubProps) {
  function progressFor(kind: string) {
    const rows = progress.filter((p) => p.kind === kind);
    if (!rows.length) return null;
    const best = Math.max(...rows.map((r) => Number(r.best_score) || 0));
    const completed = rows.filter((r) => r.is_completed).length;
    return { best, completed, total: rows.length };
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Learning</h1>
        <p className="text-muted-foreground">
          Choose a module to practice. Your progress is saved automatically.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {MODULES.map((m) => {
          const Icon = m.icon;
          const locked = m.locked && !verified;
          const pg = progressFor(m.kind);
          return (
            <Link key={m.href} href={locked ? '/verification' : m.href} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {locked ? <Lock className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    {locked && <Badge variant="outline">Verification required</Badge>}
                    {pg && !locked && (
                      <Badge variant="secondary">{Math.round(pg.best)}% best</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{m.title}</CardTitle>
                  <CardDescription>{m.desc}</CardDescription>
                </CardHeader>
                {pg && !locked && (
                  <CardContent className="text-sm text-muted-foreground">
                    {pg.completed} completed · Continue practicing
                  </CardContent>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
