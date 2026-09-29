'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  FileX2,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import type { ComplianceHealthReport } from '@/lib/data/company-profile';
import { cn } from '@/lib/utils';

export function ComplianceHealthCard({
  report,
}: {
  report: ComplianceHealthReport;
}) {
  const isReady = report.overallStatus === 'ready';
  const isBlocked = report.overallStatus === 'blocked';
  const isWarning = report.overallStatus === 'warning';

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14151b] shadow-sm flex flex-col justify-between">
      <CardHeader className="p-4 pb-3 border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border',
                isReady
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                  : isBlocked
                  ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30'
                  : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
              )}
            >
              {isReady ? (
                <ShieldCheck className="h-4 w-4" />
              ) : isBlocked ? (
                <ShieldAlert className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
            </div>

            <div>
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Compliance Health Summary
                <Badge
                  variant={isReady ? 'success' : isBlocked ? 'destructive' : 'warning'}
                  className="text-[10px] uppercase font-bold py-0"
                >
                  {isReady ? 'Tender Ready' : isBlocked ? 'Eligibility Blocked' : 'Action Needed'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-zinc-600 dark:text-zinc-400">
                Statutory certificate status for mandatory AGPO and KRA bidding eligibility.
              </CardDescription>
            </div>
          </div>

          <Link
            href="/company-profile"
            className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
          >
            <span>Manage</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3.5 flex-1">
        {/* Metric pills */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 text-center">
            <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1">
              <FileCheck2 className="h-3 w-3" /> Valid
            </div>
            <div className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">
              {report.validCount}
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/30 p-2.5 text-center">
            <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" /> &lt;60 Days
            </div>
            <div className="text-xl font-bold text-amber-800 dark:text-amber-300 mt-0.5">
              {report.expiringCount}
            </div>
          </div>

          <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50/70 dark:bg-red-950/30 p-2.5 text-center">
            <div className="text-[10px] font-semibold text-red-700 dark:text-red-300 flex items-center justify-center gap-1">
              <FileX2 className="h-3 w-3" /> Expired / Due
            </div>
            <div className="text-xl font-bold text-red-800 dark:text-red-300 mt-0.5">
              {report.expiredCount + report.missingCount}
            </div>
          </div>
        </div>

        {/* Plain language note on eligibility */}
        <div
          className={cn(
            'rounded-lg p-3 text-xs border leading-relaxed',
            isReady
              ? 'border-emerald-200 dark:border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
              : isBlocked
              ? 'border-red-200 dark:border-red-500/40 bg-red-50/80 dark:bg-red-950/30 text-red-900 dark:text-red-200'
              : 'border-amber-200 dark:border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
          )}
        >
          <div className="font-semibold mb-1 flex items-center gap-1.5">
            {isReady ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Fully compliant for public procurement</span>
              </>
            ) : isBlocked ? (
              <>
                <ShieldAlert className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0" />
                <span>Disqualification Risk</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Renewal Attention Recommended</span>
              </>
            )}
          </div>
          <p className="text-[11px] opacity-90">{report.plainSummary}</p>

          {report.blockingReasons && report.blockingReasons.length > 0 && (
            <ul className="mt-2 space-y-1 text-[11px] list-disc list-inside opacity-95">
              {report.blockingReasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="pt-1">
          <Link
            href="/company-profile"
            className="w-full inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 hover:bg-zinc-100 dark:bg-[#0f1015] dark:hover:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-200 dark:hover:text-white transition-colors gap-1.5 shadow-sm"
          >
            <span>Review Statutory Documents & AGPO Category</span>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-400" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
