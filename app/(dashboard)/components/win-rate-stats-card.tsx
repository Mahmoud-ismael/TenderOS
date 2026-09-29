'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  TrendingUp,
  SendHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Target,
} from 'lucide-react';
import type { ApplicationWinRateStats } from '@/lib/data/applications';

export function WinRateStatsCard({
  stats,
}: {
  stats: ApplicationWinRateStats;
}) {
  const hasHistory = stats.totalSubmitted > 0 || stats.totalApplications > 0;
  const decidedCount = stats.awardedCount + stats.rejectedCount;

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14151b] shadow-sm flex flex-col justify-between">
      <CardHeader className="p-4 pb-3 border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Conversion &amp; Win Rate
                {hasHistory && (
                  <Badge variant="outline" className="border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 text-[10px]">
                    {stats.winRate}% Success Rate
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-zinc-600 dark:text-zinc-400">
                Performance benchmark across submitted Kenyan public tenders.
              </CardDescription>
            </div>
          </div>

          <Link
            href="/applications"
            className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
          >
            <span>Dossiers</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3.5 flex-1">
        {!hasHistory ? (
          <div className="py-6 text-center text-xs text-zinc-500 space-y-2">
            <Target className="h-7 w-7 mx-auto text-zinc-400 dark:text-zinc-500 mb-1" />
            <p className="text-zinc-700 dark:text-zinc-200 font-medium">Awaiting First Submission Record</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
              As you qualify tenders and assemble submission dossiers, this card will calculate Hisako&apos;s
              win-rate conversion, contract revenue won, and evaluation outcomes.
            </p>
            <div className="pt-2">
              <Link
                href="/qualification"
                className="inline-flex items-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0f1015] px-3 py-1.5 text-xs text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors shadow-sm font-medium"
              >
                <span>Qualify Discovered Tenders</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Top Stat Highlights */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0f1015] p-3">
                <div className="text-[11px] text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" /> Total Won Value
                </div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  KES {stats.totalValueWon.toLocaleString()}
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Across {stats.awardedCount} awarded tender{stats.awardedCount !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0f1015] p-3">
                <div className="text-[11px] text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Bid Win Rate
                </div>
                <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                  {stats.winRate}%
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {stats.awardedCount} of {decidedCount > 0 ? decidedCount : stats.totalSubmitted} evaluated bids
                </p>
              </div>
            </div>

            {/* Visual Win Rate Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-600 dark:text-zinc-300">Award Ratio ({stats.awardedCount} won / {stats.totalSubmitted} submitted)</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{stats.winRate}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(stats.winRate, 5))}%` }}
                />
              </div>
            </div>

            {/* Stage breakdown chips */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0f1015] p-2 text-center">
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1">
                  <SendHorizontal className="h-3 w-3 text-purple-500 dark:text-purple-400" /> Pursued
                </div>
                <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                  {stats.totalApplications}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0f1015] p-2 text-center">
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3 text-blue-500 dark:text-blue-400" /> Evaluating
                </div>
                <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 mt-0.5">
                  {stats.pendingDecisionCount}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0f1015] p-2 text-center">
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Won
                </div>
                <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {stats.awardedCount}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
