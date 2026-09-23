'use client';

import Link from 'next/link';
import {
  Gamepad2,
  FileText,
  ScrollText,
  Sparkles,
  Languages,
  BookOpen,
  Headphones,
  BookMarked,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

const modules = [
  {
    title: 'Daily Game',
    desc: 'Play daily & earn',
    icon: Gamepad2,
    href: '/earnings',
    accent: 'from-primary/15 to-primary/5',
    iconColor: 'text-primary',
  },
  {
    title: 'Model Papers',
    desc: 'Practice papers',
    icon: FileText,
    href: '#',
    accent: 'from-sky-500/15 to-sky-500/5',
    iconColor: 'text-sky-700',
  },
  {
    title: 'Past Papers',
    desc: 'Exam archives',
    icon: ScrollText,
    href: '#',
    accent: 'from-violet-500/15 to-violet-500/5',
    iconColor: 'text-violet-700',
  },
  {
    title: 'JFT New Update',
    desc: 'Latest updates',
    icon: Sparkles,
    href: '#',
    accent: 'from-amber-500/15 to-amber-500/5',
    iconColor: 'text-amber-700',
  },
  {
    title: 'Kanji Practice',
    desc: 'Master characters',
    icon: Languages,
    href: '#',
    accent: 'from-rose-500/15 to-rose-500/5',
    iconColor: 'text-rose-700',
  },
  {
    title: 'Grammar Practice',
    desc: 'Build structure',
    icon: BookOpen,
    href: '#',
    accent: 'from-emerald-500/15 to-emerald-500/5',
    iconColor: 'text-emerald-700',
  },
  {
    title: 'Listening Practice',
    desc: 'Train your ear',
    icon: Headphones,
    href: '#',
    accent: 'from-indigo-500/15 to-indigo-500/5',
    iconColor: 'text-indigo-700',
  },
  {
    title: 'Reading Practice',
    desc: 'Improve fluency',
    icon: BookMarked,
    href: '#',
    accent: 'from-teal-500/15 to-teal-500/5',
    iconColor: 'text-teal-700',
  },
];

export function LearningCards() {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold tracking-tight">
        Learning & Practice
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {modules.map((m) => {
          const Icon = m.icon;
          const content = (
            <Card
              className={cn(
                'group h-full overflow-hidden transition-all duration-200 hover:shadow-md active:scale-[0.98]'
              )}
            >
              <CardContent className="flex flex-col items-start gap-3 p-4">
                <div
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br transition-transform duration-200 group-hover:scale-105',
                    m.accent
                  )}
                >
                  <Icon className={cn('h-5 w-5', m.iconColor)} />
                </div>
                <div>
                  <h3 className="text-sm font-medium leading-tight">
                    {m.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {m.desc}
                  </p>
                </div>
              </CardContent>
            </Card>
          );

          if (m.href === '#') {
            return (
              <div key={m.title} className="opacity-90">
                {content}
              </div>
            );
          }
          return (
            <Link key={m.title} href={m.href} className="block">
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
