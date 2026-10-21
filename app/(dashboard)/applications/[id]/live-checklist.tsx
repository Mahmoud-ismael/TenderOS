'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  CircleDashed,
  FileCheck,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import type { ChecklistItem } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

export function LiveChecklist({
  applicationId,
  checklist,
}: {
  applicationId: string;
  checklist: ChecklistItem[];
}) {
  const total = checklist.length;
  const verified = checklist.filter((i) => i.status === 'verified').length;
  const attached = checklist.filter((i) => i.status === 'attached').length;
  const pendingRequired = checklist.filter((i) => i.required && i.status !== 'verified').length;
  const percentage = total > 0 ? Math.round((verified / total) * 100) : 0;
  const isAllVerified = total > 0 && verified === total;

  return (
    <Card className="border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <CardHeader className="p-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Live Application Bid Checklist
              </CardTitle>
              <Badge
                variant={isAllVerified ? 'success' : 'outline'}
                className="text-[10px] tracking-wider uppercase font-semibold border-zinc-300 dark:border-zinc-700"
              >
                {isAllVerified ? 'Ready to Assemble' : `${verified} / ${total} Complete (${percentage}%)`}
              </Badge>
            </div>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Statutory compliance items and proposal documents required for this tender submission.
            </CardDescription>
          </div>

          <Link
            href={`/documents?applicationId=${applicationId}`}
            className="inline-flex items-center rounded-md bg-purple-600 hover:bg-purple-700 px-3 py-1.5 text-xs font-medium text-white transition-colors self-start sm:self-auto shadow-xs"
          >
            Open Document Studio <ArrowRight className="h-3 w-3 ml-1.5" />
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="pt-2 space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <div
              className={cn(
                'h-full transition-all duration-500',
                isAllVerified
                  ? 'bg-emerald-600'
                  : 'bg-purple-600'
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
            <span>
              {pendingRequired > 0 ? (
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                  {pendingRequired} mandatory item(s) pending finalization
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  All mandatory bid requirements finalized
                </span>
              )}
            </span>
            <span>{percentage}% Completion</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {checklist.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No specific checklist items parsed for this application.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {checklist.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors shadow-2xs',
                  item.status === 'verified'
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                    : item.status === 'attached'
                    ? 'border-purple-200 bg-purple-50 dark:border-purple-900/40 dark:bg-purple-950/20'
                    : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950'
                )}
              >
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  <div className="shrink-0">
                    {item.status === 'verified' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : item.status === 'attached' ? (
                      <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <CircleDashed className="h-4 w-4 text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.item}</p>
                    <p className="text-[10px] text-zinc-500">
                      {item.required ? (
                        <span className="text-red-600 dark:text-red-400 font-medium">Mandatory</span>
                      ) : (
                        'Supplementary'
                      )}
                    </p>
                  </div>
                </div>

                <Badge
                  variant={
                    item.status === 'verified'
                      ? 'success'
                      : item.status === 'attached'
                      ? 'outline'
                      : 'secondary'
                  }
                  className={cn(
                    'text-[9px] uppercase font-semibold shrink-0',
                    item.status === 'attached' && 'border-purple-300 text-purple-700 bg-purple-100 dark:border-purple-800 dark:text-purple-300 dark:bg-purple-950/40'
                  )}
                >
                  {item.status === 'verified' ? 'Finalized' : item.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
