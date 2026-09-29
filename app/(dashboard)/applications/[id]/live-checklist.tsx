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
    <Card className="border-zinc-800 bg-zinc-900/40">
      <CardHeader className="p-4 pb-3 border-b border-zinc-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-400" />
                Live Application Bid Checklist
              </CardTitle>
              <Badge
                variant={isAllVerified ? 'success' : 'outline'}
                className="text-[10px] tracking-wider uppercase font-semibold"
              >
                {isAllVerified ? 'Ready to Assemble' : `${verified} / ${total} Complete (${percentage}%)`}
              </Badge>
            </div>
            <CardDescription className="text-xs text-zinc-400">
              Statutory compliance items and proposal documents required for this tender submission.
            </CardDescription>
          </div>

          <Link
            href={`/documents?applicationId=${applicationId}`}
            className="inline-flex items-center rounded-md bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors self-start sm:self-auto"
          >
            Open Document Studio <ArrowRight className="h-3 w-3 ml-1.5" />
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="pt-2 space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className={cn(
                'h-full transition-all duration-500',
                isAllVerified
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-400">
            <span>
              {pendingRequired > 0 ? (
                <span className="text-amber-400 font-medium">
                  {pendingRequired} mandatory item(s) pending finalization
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">
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
                  'flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors',
                  item.status === 'verified'
                    ? 'border-emerald-500/20 bg-emerald-950/10'
                    : item.status === 'attached'
                    ? 'border-blue-500/20 bg-blue-950/10'
                    : 'border-zinc-800 bg-zinc-950/40'
                )}
              >
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  <div className="shrink-0">
                    {item.status === 'verified' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : item.status === 'attached' ? (
                      <FileText className="h-4 w-4 text-blue-400" />
                    ) : (
                      <CircleDashed className="h-4 w-4 text-zinc-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-200 truncate">{item.item}</p>
                    <p className="text-[10px] text-zinc-500">
                      {item.required ? (
                        <span className="text-red-400 font-medium">Mandatory</span>
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
                    item.status === 'attached' && 'border-blue-500/40 text-blue-400 bg-blue-500/10'
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
