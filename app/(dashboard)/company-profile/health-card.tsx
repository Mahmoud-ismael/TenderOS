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
        'border-zinc-800 bg-zinc-900/60 backdrop-blur transition-all',
        isBlocked
          ? 'border-red-500/40 bg-red-950/10'
          : isWarning
          ? 'border-amber-500/40 bg-amber-950/10'
          : 'border-emerald-500/30 bg-emerald-950/10'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl border',
                isBlocked
                  ? 'border-red-500/30 bg-red-500/10 text-red-400'
                  : isWarning
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
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
                <CardTitle className="text-base text-zinc-100">
                  Compliance & Tender Readiness Health
                </CardTitle>
                <Badge
                  variant={isBlocked ? 'destructive' : isWarning ? 'warning' : 'success'}
                  className="uppercase text-[10px] tracking-wider"
                >
                  {report.overallStatus}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {report.plainSummary}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5">
              <FileCheck2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-semibold text-zinc-200">{report.validCount}</span>
              <span className="text-[11px] text-zinc-500">Valid</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold text-zinc-200">{report.expiringCount}</span>
              <span className="text-[11px] text-zinc-500">&lt;60d</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5">
              <XCircle className="h-3.5 w-3.5 text-red-400" />
              <span className="font-semibold text-zinc-200">{report.expiredCount}</span>
              <span className="text-[11px] text-zinc-500">Expired</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5">
              <FileX className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-semibold text-zinc-200">{report.missingCount}</span>
              <span className="text-[11px] text-zinc-500">Missing</span>
            </div>
          </div>
        </div>
      </CardHeader>

      {(report.blockingReasons.length > 0 || report.recommendations.length > 0) && (
        <CardContent className="pt-0">
          <div className="space-y-2 border-t border-zinc-800/80 pt-3">
            {report.blockingReasons.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <XCircle className="h-3 w-3" /> Tender Eligibility Blockers:
                </p>
                <ul className="list-inside space-y-1 text-xs text-zinc-300">
                  {report.blockingReasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-red-300/90">
                      <span className="text-red-400">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.recommendations.length > 0 && (
              <div className="space-y-1 pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" /> Actionable Recommendations:
                </p>
                <ul className="list-inside space-y-1 text-xs text-zinc-400">
                  {report.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-amber-300/80">
                      <span className="text-amber-400">•</span>
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
