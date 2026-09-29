'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  FileCheck2,
} from 'lucide-react';
import type { UpcomingDeadlinesItem } from '@/lib/data/dashboard';
import { cn } from '@/lib/utils';

export function UpcomingDeadlinesCard({
  items,
}: {
  items: UpcomingDeadlinesItem[];
}) {
  return (
    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14151b] shadow-sm flex flex-col justify-between">
      <CardHeader className="p-4 pb-3 border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Upcoming Submission Deadlines (Next 14 Days)
              </CardTitle>
              <CardDescription className="text-xs text-zinc-600 dark:text-zinc-400">
                Sorted by statutory cutoff urgency. Late delivery results in automatic disqualification.
              </CardDescription>
            </div>
          </div>

          <Badge variant="outline" className="border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[10px]">
            {items.length} Active Notice{items.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1">
        {items.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 space-y-1">
            <Clock className="h-6 w-6 mx-auto text-zinc-400 dark:text-zinc-600 mb-1" />
            <p className="text-zinc-700 dark:text-zinc-300 font-medium">No critical deadlines in the next 14 days</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              New deadlines will appear as new tenders are discovered and qualified.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => {
              const isCritical = item.daysRemaining <= 2;
              const isCaution = item.daysRemaining > 2 && item.daysRemaining <= 5;

              return (
                <div
                  key={item.id}
                  className={cn(
                    'p-3 rounded-lg border text-xs transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
                    isCritical
                      ? 'border-red-300 dark:border-red-500/40 bg-red-50/70 dark:bg-red-950/20'
                      : isCaution
                      ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/20'
                      : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-[#0f1015] hover:border-zinc-300 dark:hover:border-zinc-700'
                  )}
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={isCritical ? 'destructive' : isCaution ? 'warning' : 'outline'}
                        className="text-[9px] uppercase font-bold py-0"
                      >
                        {item.daysRemaining === 0
                          ? 'Closes Today'
                          : item.daysRemaining === 1
                          ? 'Closes Tomorrow'
                          : `${item.daysRemaining} Days Left`}
                      </Badge>

                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                        {item.external_reference || 'REF-N/A'}
                      </span>

                      {item.estimated_value && (
                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          KES {item.estimated_value.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate line-clamp-1">
                      {item.title}
                    </h4>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-600 dark:text-zinc-300">
                      <span className="flex items-center gap-1 truncate">
                        <Building2 className="h-3 w-3 text-zinc-400 dark:text-zinc-500 shrink-0" />
                        {item.procuring_entity}
                      </span>
                      <span>·</span>
                      <span className="shrink-0 text-zinc-500 dark:text-zinc-400">
                        Cutoff: {new Date(item.submission_deadline).toLocaleDateString()}
                      </span>
                    </div>

                    {item.checklistProgress && (
                      <div className="pt-1 flex items-center gap-2 max-w-xs">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${item.checklistProgress.pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500">
                          {item.checklistProgress.verified}/{item.checklistProgress.total} ready
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 self-start sm:self-center">
                    {item.applicationId ? (
                      <Link
                        href={`/applications/${item.applicationId}`}
                        className="inline-flex items-center rounded-md bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white transition-colors shadow-sm"
                      >
                        <FileCheck2 className="h-3 w-3 mr-1.5" /> Submit Dossier
                      </Link>
                    ) : (
                      <Link
                        href={`/qualification?tenderId=${item.id}`}
                        className="inline-flex items-center rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-colors shadow-sm"
                      >
                        Qualify <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
