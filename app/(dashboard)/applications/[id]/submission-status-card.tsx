'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  SendHorizontal,
  Trophy,
  XCircle,
  Clock,
  TrendingUp,
  CheckCircle2,
  Loader2,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import type { ApplicationStatus } from '@/lib/supabase/types';
import type { ApplicationWinRateStats } from '@/lib/data/applications';
import { markAsSubmittedAction, updateOutcomeStatusAction } from './actions';
import { cn } from '@/lib/utils';

export function SubmissionStatusCard({
  applicationId,
  initialStatus,
  submittedAt,
  winRateStats,
}: {
  applicationId: string;
  initialStatus: ApplicationStatus;
  submittedAt: string | null;
  winRateStats: ApplicationWinRateStats;
}) {
  const [status, setStatus] = useState<ApplicationStatus>(initialStatus);
  const [submittedTimestamp, setSubmittedTimestamp] = useState<string | null>(submittedAt);
  const [outcomeNotes, setOutcomeNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingOutcome, setIsUpdatingOutcome] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isSubmitted = status === 'submitted' || status === 'awarded' || status === 'rejected';

  const handleMarkSubmitted = async () => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await markAsSubmittedAction(applicationId);
      if (res.success) {
        setStatus('submitted');
        setSubmittedTimestamp(res.submittedAt || new Date().toISOString());
        setFeedback('Tender marked as officially submitted! Deadline reminders have been ceased.');
      } else {
        setFeedback(`Error: ${res.error}`);
      }
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateOutcome = async (newStatus: 'awarded' | 'rejected') => {
    setIsUpdatingOutcome(true);
    setFeedback(null);

    try {
      const res = await updateOutcomeStatusAction(applicationId, newStatus, outcomeNotes);
      if (res.success) {
        setStatus(newStatus);
        setFeedback(
          newStatus === 'awarded'
            ? 'Congratulations! Tender marked as Awarded (Won). Win-rate statistics updated.'
            : 'Tender marked as Not Awarded (Rejected). Post-mortem notes recorded.'
        );
      } else {
        setFeedback(`Error: ${res.error}`);
      }
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setIsUpdatingOutcome(false);
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/40">
      <CardHeader className="p-4 pb-3 border-b border-zinc-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl border',
                status === 'awarded'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : status === 'rejected'
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : isSubmitted
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              )}
            >
              {status === 'awarded' ? (
                <Trophy className="h-5 w-5" />
              ) : status === 'rejected' ? (
                <XCircle className="h-5 w-5" />
              ) : (
                <SendHorizontal className="h-5 w-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold text-zinc-100">
                  Submission & Outcome Tracking
                </CardTitle>
                <Badge
                  variant={
                    status === 'awarded'
                      ? 'success'
                      : status === 'rejected'
                      ? 'destructive'
                      : isSubmitted
                      ? 'outline'
                      : 'secondary'
                  }
                  className="text-[10px] tracking-wider uppercase font-semibold"
                >
                  {status === 'awarded'
                    ? 'Contract Won / Awarded'
                    : status === 'rejected'
                    ? 'Not Awarded'
                    : status}
                </Badge>
              </div>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                Timestamp final submission and track procurement evaluation outcomes.
              </CardDescription>
            </div>
          </div>

          {/* Running Win-Rate Pill */}
          <div className="flex items-center space-x-3 bg-zinc-950/80 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs self-start sm:self-auto">
            <div className="flex items-center space-x-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-zinc-400">Hisako Win Rate:</span>
              <span className="font-bold text-emerald-400">{winRateStats.winRate}%</span>
            </div>
            <span className="text-zinc-700">|</span>
            <span className="text-[11px] text-zinc-400">
              {winRateStats.awardedCount} won of {winRateStats.totalSubmitted} submitted
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {feedback && (
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-2.5 text-xs text-cyan-300">
            {feedback}
          </div>
        )}

        {/* Step 1: Mark As Submitted */}
        {!isSubmitted ? (
          <div className="rounded-lg border border-purple-500/20 bg-purple-950/10 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                <SendHorizontal className="h-4 w-4" /> Ready to finalize delivery?
              </p>
              <p className="text-[11px] text-zinc-400">
                Clicking &quot;Mark as Submitted&quot; timestamps the filing date and ceases active deadline countdown alerts.
              </p>
            </div>

            <Button
              size="sm"
              onClick={handleMarkSubmitted}
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs h-8 shrink-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Recording Submission...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Mark as Submitted
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-zinc-300">
                  Submitted On:{' '}
                  <strong className="text-zinc-100 font-mono">
                    {submittedTimestamp ? new Date(submittedTimestamp).toLocaleString() : 'Timestamped'}
                  </strong>
                </span>
              </div>
              <span className="text-[11px] text-zinc-500">
                Evaluation results typically posted 30–60 days from bid opening.
              </span>
            </div>

            {/* Step 2: Post-Submission Outcome Tracking */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  Record Tender Evaluation Outcome:
                </span>
                <span className="text-[11px] text-zinc-500">
                  Updates running win-rate metrics
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleUpdateOutcome('awarded')}
                  disabled={isUpdatingOutcome || status === 'awarded'}
                  className={cn(
                    'h-8 text-xs',
                    status === 'awarded'
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-300'
                  )}
                >
                  <Trophy className="h-3.5 w-3.5 mr-1.5 text-amber-300" />
                  Mark as Won / Awarded
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleUpdateOutcome('rejected')}
                  disabled={isUpdatingOutcome || status === 'rejected'}
                  className={cn(
                    'h-8 text-xs',
                    status === 'rejected'
                      ? 'bg-red-600 text-white cursor-default'
                      : 'bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-300'
                  )}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5 text-red-400" />
                  Mark as Lost / Rejected
                </Button>
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Evaluation Feedback / Debrief Notes
                </label>
                <Input
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="e.g. Awarded contract at KES 4.2M. Notice of intention to award issued. Signed contract pending."
                  className="h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-200"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
