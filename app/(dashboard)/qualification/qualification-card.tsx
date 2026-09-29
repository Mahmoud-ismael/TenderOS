'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TenderWithQualification } from '@/lib/data/qualification';
import {
  runSingleQualificationAction,
  approveAndStartApplicationAction,
  skipTenderAction,
} from './actions';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  ExternalLink,
  Loader2,
  Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function QualificationCard({
  item,
  onUpdated,
}: {
  item: TenderWithQualification;
  onUpdated: () => void;
}) {
  const router = useRouter();
  const { tender, qualification } = item;
  const [isExpanding, setIsExpanding] = useState(false);
  const [isQualifying, setIsQualifying] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const score = qualification ? Math.round(Number(qualification.score)) : null;
  const recommendation = qualification?.recommendation;

  const handleQualify = async () => {
    setIsQualifying(true);
    try {
      const res = await runSingleQualificationAction(tender.id);
      if (res.success) {
        onUpdated();
      } else {
        alert(`Qualification error: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsQualifying(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await approveAndStartApplicationAction(tender.id);
      if (res.success) {
        onUpdated();
        router.push('/applications');
      } else {
        alert(`Approval error: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      const res = await skipTenderAction(tender.id);
      if (res.success) {
        onUpdated();
      } else {
        alert(`Skip error: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSkipping(false);
    }
  };

  const matchedServices: string[] = Array.isArray(qualification?.matched_services)
    ? (qualification?.matched_services as string[])
    : [];

  const gaps: string[] = Array.isArray(qualification?.gaps)
    ? (qualification?.gaps as string[])
    : [];

  const getScoreBadge = () => {
    if (score === null) {
      return (
        <Badge variant="outline" className="border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs">
          Not Qualified
        </Badge>
      );
    }

    if (score >= 70) {
      return (
        <div className="flex items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
            {score}
          </div>
          <div>
            <Badge variant="success" className="text-[10px] uppercase font-bold tracking-wider">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Pursue ({score}%)
            </Badge>
            <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">High Win Probability</span>
          </div>
        </div>
      );
    }

    if (score >= 45) {
      return (
        <div className="flex items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold text-sm">
            {score}
          </div>
          <div>
            <Badge variant="warning" className="text-[10px] uppercase font-bold tracking-wider">
              <AlertTriangle className="h-3 w-3 mr-1" /> Borderline ({score}%)
            </Badge>
            <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Operator Review Required</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/15 border border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-400 font-bold text-sm">
          {score}
        </div>
        <div>
          <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider">
            <XCircle className="h-3 w-3 mr-1" /> Skip ({score}%)
          </Badge>
          <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Low Technical/AGPO Match</span>
        </div>
      </div>
    );
  };

  return (
    <Card
      className={cn(
        'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14151b] shadow-sm transition-all duration-200 overflow-hidden',
        recommendation === 'pursue' && 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/20 dark:bg-[#121818]',
        recommendation === 'borderline' && 'border-amber-300 dark:border-amber-500/40 bg-amber-50/20 dark:bg-[#181612]',
        recommendation === 'skip' && 'border-zinc-200 dark:border-zinc-800/80 opacity-75'
      )}
    >
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-700 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded">
                {tender.external_reference || 'REF-PENDING'}
              </span>

              {qualification?.eligible_agpo && (
                <Badge variant="outline" className="border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 text-[10px]">
                  AGPO Youth Eligible
                </Badge>
              )}

              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {tender.category || 'ICT Procurement'}
              </span>
            </div>

            <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
              {tender.title}
            </CardTitle>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                <strong className="text-zinc-800 dark:text-zinc-300 font-medium truncate">{tender.procuring_entity}</strong>
              </span>

              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                Closing: <strong className="text-zinc-800 dark:text-zinc-300">{new Date(tender.submission_deadline).toLocaleDateString()}</strong>
              </span>

              {tender.estimated_value && (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Budget: KES {Number(tender.estimated_value).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Score & Recommendation Gauge */}
          <div className="shrink-0">{getScoreBadge()}</div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {qualification ? (
          <>
            {/* AI Reasoning Summary */}
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/70 p-3.5 border border-zinc-200 dark:border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" /> Google Vertex AI (Gemini 2.5 Flash) Assessment
                </span>
                <button
                  type="button"
                  onClick={() => setIsExpanding(!isExpanding)}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 text-[11px]"
                >
                  {isExpanding ? (
                    <>
                      Hide Details <ChevronUp className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      Expand Full Analysis <ChevronDown className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>

              <p className={cn('text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap', !isExpanding && 'line-clamp-2')}>
                {qualification.ai_reasoning}
              </p>
            </div>

            {/* Matched Services & Gaps Grid */}
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              {/* Matched Services */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <FileCheck2 className="h-3.5 w-3.5" /> Matched Capabilities:
                </span>
                {matchedServices.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {matchedServices.map((service, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 text-[10px] py-0.5"
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 italic">No direct service matches identified.</p>
                )}
              </div>

              {/* Gaps List */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Identified Gaps & Risk Notes:
                </span>
                {gaps.length > 0 ? (
                  <ul className="space-y-1 text-[11px] text-zinc-700 dark:text-zinc-300 list-disc list-inside">
                    {gaps.map((gap, i) => (
                      <li key={i} className="text-amber-800 dark:text-amber-200/90 leading-tight">
                        {gap}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400/90 italic">Zero critical compliance gaps identified.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 text-center text-xs text-zinc-500 flex items-center justify-between">
            <span>This tender is in the discovery inbox and has not yet been qualified by the model router.</span>
            <Button
              size="sm"
              onClick={handleQualify}
              disabled={isQualifying}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-8 ml-4 shrink-0 shadow-sm"
            >
              {isQualifying ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Qualifying...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1" /> Qualify Now
                </>
              )}
            </Button>
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            {tender.tender_document_url && (
              <a
                href={tender.tender_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> View Official Tender Notice
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Re-run button */}
            {qualification && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleQualify}
                disabled={isQualifying}
                className="border-zinc-200 dark:border-zinc-800 text-xs h-8 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              >
                <RefreshCw className={cn('h-3.5 w-3.5 mr-1', isQualifying && 'animate-spin')} />
                Re-run
              </Button>
            )}

            {/* Skip / Disqualify */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkip}
              disabled={isSkipping || tender.status === 'disqualified'}
              className="border-zinc-200 dark:border-zinc-800 text-xs h-8 text-zinc-700 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <Ban className="h-3.5 w-3.5 mr-1" /> Skip
            </Button>

            {/* Approve & Start Application */}
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isApproving || tender.status === 'in_progress'}
              className={cn(
                'text-xs h-8 font-medium shadow-sm',
                tender.status === 'in_progress'
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              )}
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Starting...
                </>
              ) : tender.status === 'in_progress' ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400" /> Application In Progress
                </>
              ) : (
                <>
                  Approve & Start Application <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
