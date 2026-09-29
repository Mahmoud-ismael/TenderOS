'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import type { PipelineStageCounts } from '@/lib/data/dashboard';
import { cn } from '@/lib/utils';

export function PipelineFunnel({
  counts,
  totalPipelineValue,
}: {
  counts: PipelineStageCounts;
  totalPipelineValue: number;
}) {
  const stages = [
    {
      key: 'discovered',
      label: 'Discovered',
      count: counts.discovered,
      color: 'text-zinc-900 dark:text-zinc-100',
      bgColor: 'bg-zinc-100 border-zinc-300 dark:bg-zinc-800/80 dark:border-zinc-700',
      href: '/discovery',
      desc: 'Portals scraped',
    },
    {
      key: 'qualifying',
      label: 'Qualifying',
      count: counts.qualifying,
      color: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-50/80 border-amber-300 dark:bg-amber-950/40 dark:border-amber-600/40',
      href: '/qualification',
      desc: 'AI evaluating',
    },
    {
      key: 'qualified',
      label: 'Qualified',
      count: counts.qualified,
      color: 'text-cyan-700 dark:text-cyan-400',
      bgColor: 'bg-cyan-50/80 border-cyan-300 dark:bg-cyan-950/40 dark:border-cyan-600/40',
      href: '/qualification',
      desc: 'Pursuit match',
    },
    {
      key: 'in_progress',
      label: 'In Progress',
      count: counts.in_progress,
      color: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-50/80 border-blue-300 dark:bg-blue-950/40 dark:border-blue-600/40',
      href: '/documents',
      desc: 'Drafting bid',
    },
    {
      key: 'submitted',
      label: 'Submitted',
      count: counts.submitted,
      color: 'text-purple-700 dark:text-purple-400',
      bgColor: 'bg-purple-50/80 border-purple-300 dark:bg-purple-950/40 dark:border-purple-600/40',
      href: '/applications',
      desc: 'Awaiting award',
    },
    {
      key: 'won',
      label: 'Won (Awarded)',
      count: counts.won,
      color: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-600/40',
      href: '/applications',
      desc: 'Contracts signed',
    },
  ];

  return (
    <Card className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#14151b]">
      <CardHeader className="p-4 pb-3 border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              Tender Opportunity Pipeline Funnel
            </CardTitle>
            <CardDescription className="text-xs text-zinc-600 dark:text-zinc-400">
              Progression from automated discovery through AI qualification to final contract award.
            </CardDescription>
          </div>

          <div className="flex items-center space-x-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg text-xs self-start sm:self-auto shadow-xs">
            <span className="text-zinc-600 dark:text-zinc-300 font-medium">Active Pipeline Value:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              KES {totalPipelineValue.toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {stages.map((st, idx) => (
            <Link
              key={st.key}
              href={st.href}
              className={cn(
                'group relative flex flex-col justify-between p-3 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-md',
                st.bgColor
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                    {st.label}
                  </span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
                    #{idx + 1}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{st.desc}</p>
              </div>

              <div className="pt-3 flex items-baseline justify-between">
                <span className={cn('text-2xl font-bold tracking-tight', st.color)}>
                  {st.count}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-600 dark:group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
