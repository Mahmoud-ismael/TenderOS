'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CountdownBanner({
  deadlineIso,
  submittedAtIso,
  applicationStatus,
}: {
  deadlineIso: string;
  submittedAtIso: string | null;
  applicationStatus: string;
}) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  const isSubmitted = Boolean(submittedAtIso) || applicationStatus === 'submitted' || applicationStatus === 'awarded' || applicationStatus === 'rejected';

  useEffect(() => {
    if (isSubmitted) return;

    const calculateTime = () => {
      const target = new Date(deadlineIso).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [deadlineIso, isSubmitted]);

  if (isSubmitted) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-950/20 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-emerald-300">
                  Bid Successfully Submitted
                </span>
                <Badge variant="success" className="text-[10px] tracking-wider uppercase">
                  Deadline Satisfied
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Submitted on {submittedAtIso ? new Date(submittedAtIso).toLocaleString() : 'Record Timestamped'}. Active submission clock stopped.
              </p>
            </div>
          </div>
          <div className="text-xs text-emerald-400 font-mono bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-500/20 self-start sm:self-auto">
            Status: {applicationStatus.toUpperCase()}
          </div>
        </div>
      </Card>
    );
  }

  const isUrgent = !timeLeft.isPast && timeLeft.days < 2;
  const isWarning = !timeLeft.isPast && timeLeft.days >= 2 && timeLeft.days < 5;

  return (
    <Card
      className={cn(
        'p-4 transition-all border',
        timeLeft.isPast
          ? 'border-red-500/40 bg-red-950/30 text-red-200'
          : isUrgent
          ? 'border-amber-500/40 bg-amber-950/20'
          : 'border-zinc-800 bg-zinc-900/40'
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl border',
              timeLeft.isPast
                ? 'border-red-500/40 bg-red-500/10 text-red-400'
                : isUrgent
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 animate-pulse'
                : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
            )}
          >
            {timeLeft.isPast ? (
              <ShieldAlert className="h-5 w-5" />
            ) : isUrgent ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Clock className="h-5 w-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-100">
                Official Submission Deadline Countdown
              </span>
              <Badge
                variant={timeLeft.isPast ? 'destructive' : isUrgent ? 'warning' : 'outline'}
                className="text-[10px] tracking-wider uppercase"
              >
                {timeLeft.isPast
                  ? 'Expired / Disqualifying'
                  : isUrgent
                  ? 'Critical Window (<48h)'
                  : 'Active Window'}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Deadline: {new Date(deadlineIso).toLocaleString()} · Late submission results in automatic rejection under PPADA § 77(1).
            </p>
          </div>
        </div>

        {/* Live Countdown Digits */}
        {!timeLeft.isPast ? (
          <div className="flex items-center space-x-2 font-mono">
            <div className="flex flex-col items-center bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1 min-w-[50px]">
              <span className="text-base font-bold text-zinc-100">{timeLeft.days}</span>
              <span className="text-[9px] text-zinc-500 uppercase">Days</span>
            </div>
            <span className="text-zinc-500 font-bold">:</span>
            <div className="flex flex-col items-center bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1 min-w-[50px]">
              <span className="text-base font-bold text-zinc-100">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[9px] text-zinc-500 uppercase">Hours</span>
            </div>
            <span className="text-zinc-500 font-bold">:</span>
            <div className="flex flex-col items-center bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1 min-w-[50px]">
              <span className="text-base font-bold text-zinc-100">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[9px] text-zinc-500 uppercase">Mins</span>
            </div>
            <span className="text-zinc-500 font-bold">:</span>
            <div className="flex flex-col items-center bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1 min-w-[50px]">
              <span className="text-base font-bold text-cyan-400">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[9px] text-zinc-500 uppercase">Secs</span>
            </div>
          </div>
        ) : (
          <div className="text-xs font-semibold text-red-400 bg-red-950/80 border border-red-500/30 px-3 py-1.5 rounded-lg">
            Deadline Passed
          </div>
        )}
      </div>
    </Card>
  );
}
