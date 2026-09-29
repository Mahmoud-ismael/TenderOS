'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Bot,
  Compass,
  Sparkles,
  FileCheck2,
  Clock,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import type { NotificationRow } from '@/lib/data/notifications';
import { cn } from '@/lib/utils';

function formatRelativeTime(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHrs > 0) return `${diffHrs}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return 'Just now';
  } catch {
    return 'Recently';
  }
}

function getActivityIcon(type: string, severity: string) {
  switch (type) {
    case 'tender_discovered':
      return <Compass className="h-3.5 w-3.5 text-cyan-400" />;
    case 'qualification_pending':
      return <Sparkles className="h-3.5 w-3.5 text-violet-400" />;
    case 'checklist_incomplete':
      return <FileCheck2 className="h-3.5 w-3.5 text-purple-400" />;
    case 'compliance_expiring':
      return <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />;
    case 'deadline_approaching':
      return <Clock className="h-3.5 w-3.5 text-red-400" />;
    default:
      return severity === 'critical' ? (
        <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
      ) : (
        <Bot className="h-3.5 w-3.5 text-blue-400" />
      );
  }
}

export function RecentActivityCard({
  activities,
}: {
  activities: NotificationRow[];
}) {
  return (
    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14151b] shadow-sm flex flex-col justify-between">
      <CardHeader className="p-4 pb-3 border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Recent Agent Activity Feed
                <Badge variant="outline" className="border-violet-300 dark:border-violet-500/30 text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 text-[10px]">
                  Autonomous Ops
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-zinc-600 dark:text-zinc-400">
                Live stream of scheduled portal scraping, AI qualifications, and pipeline updates.
              </CardDescription>
            </div>
          </div>

          <Link
            href="/agent"
            className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
          >
            <span>Ask Agent</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 space-y-1">
            <Bot className="h-6 w-6 mx-auto text-zinc-400 dark:text-zinc-600 mb-1" />
            <p className="text-zinc-700 dark:text-zinc-300 font-medium">No recent automated actions recorded</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Actions will populate as tenders are scraped, auto-qualified, and documents generated.
            </p>
            <div className="pt-2">
              <Link
                href="/discovery"
                className="inline-flex items-center text-xs text-violet-600 dark:text-violet-400 hover:underline"
              >
                <span>Trigger Manual Portal Discovery</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activities.slice(0, 6).map((item) => {
              const targetLink =
                item.link ||
                (item.entity_type === 'tender'
                  ? `/qualification?tenderId=${item.entity_id}`
                  : item.entity_type === 'application'
                  ? `/applications/${item.entity_id}`
                  : item.entity_type === 'compliance_doc'
                  ? '/company-profile'
                  : '/agent');

              return (
                <div
                  key={item.id}
                  className="group flex items-start gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0f1015] p-2.5 text-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-xs"
                >
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    {getActivityIcon(item.type, item.severity)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate line-clamp-1">
                        {item.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-zinc-500 dark:text-zinc-400">
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 line-clamp-2">
                      {item.message}
                    </p>

                    <div className="pt-0.5">
                      <Link
                        href={targetLink}
                        className="inline-flex items-center text-[10px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors gap-0.5"
                      >
                        <span>View Detail</span>
                        <ArrowRight className="h-2.5 w-2.5" />
                      </Link>
                    </div>
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
