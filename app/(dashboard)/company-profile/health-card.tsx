'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ComplianceHealthReport } from '@/lib/data/company-profile-types';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Clock,
  XCircle,
  FileX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ComplianceHealthCard({
  report,
}: {
  report: ComplianceHealthReport;
}) {
  const isBlocked = report.overallStatus === 'blocked';
  const isWarning = report.overallStatus === 'warning';

  return (
    <Card
      className={cn(
        'border transition-all shadow-xs',
        isBlocked
          ? 'border-red-200 bg-red-50/30 dark:border-red-900/40 dark:bg-zinc-900'
          : isWarning
          ? 'border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-zinc-900'
          : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl border',
                isBlocked
                  ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400'
                  : isWarning
                  ? 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
              )}
            >
              {isBlocked ? (
                <ShieldAlert className="h-5 w-5" />
              ) : isWarning ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Compliance & Tender Readiness Health
                </CardTitle>
                <Badge
                  variant={isBlocked ? 'destructive' : isWarning ? 'warning' : 'success'}
                  className="uppercase text-[10px] tracking-wider font-semibold"
                >
                  {report.overallStatus}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {report.plainSummary}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 px-2.5 py-1.5 shadow-xs">
              <FileCheck2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{report.validCount}</span>
              <span className="text-[11px] text-zinc-500">Valid</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 px-2.5 py-1.5 shadow-xs">
              <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{report.expiringCount}</span>
              <span className="text-[11px] text-zinc-500">&lt;60d</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 px-2.5 py-1.5 shadow-xs">
              <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{report.expiredCount}</span>
              <span className="text-[11px] text-zinc-500">Expired</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 px-2.5 py-1.5 shadow-xs">
              <FileX className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{report.missingCount}</span>
              <span className="text-[11px] text-zinc-500">Missing</span>
            </div>
          </div>
        </div>
      </CardHeader>

      {(report.blockingReasons.length > 0 || report.recommendations.length > 0) && (
        <CardContent className="pt-0">
          <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
            {report.blockingReasons.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <XCircle className="h-3 w-3" /> Tender Eligibility Blockers:
                </p>
                <ul className="list-inside space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                  {report.blockingReasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-red-700 dark:text-red-300">
                      <span className="text-red-600 font-bold">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.recommendations.length > 0 && (
              <div className="space-y-1 pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" /> Actionable Recommendations:
                </p>
                <ul className="list-inside space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                  {report.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-amber-800 dark:text-amber-300">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
