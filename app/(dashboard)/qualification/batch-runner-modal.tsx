'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getPendingTenderIdsAction,
  runSingleQualificationAction,
} from './actions';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  X,
  Play,
} from 'lucide-react';

export function BatchRunnerModal({
  isOpen,
  onClose,
  onComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTitle, setCurrentTitle] = useState('');
  const [logs, setLogs] = useState<Array<{ id: string; title: string; score: number; rec: string }>>([]);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state
      setIsRunning(false);
      setIsFinished(false);
      setLogs([]);
      setCurrentIndex(0);
      setTotalCount(0);
      setCurrentTitle('');

      // Fetch pending count
      getPendingTenderIdsAction().then((res) => {
        if (res.success) {
          setTotalCount(res.ids.length);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startBatchRun = async () => {
    setIsRunning(true);
    setIsFinished(false);
    setLogs([]);

    const res = await getPendingTenderIdsAction();
    const ids = res.ids || [];
    setTotalCount(ids.length);

    if (ids.length === 0) {
      setIsRunning(false);
      setIsFinished(true);
      return;
    }

    const completedLogs: Array<{ id: string; title: string; score: number; rec: string }> = [];

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      setCurrentIndex(i + 1);
      setCurrentTitle(`Tender ${id.slice(0, 8)}...`);

      try {
        const result: any = await runSingleQualificationAction(id);
        if (result.success && result.qualification) {
          const q = result.qualification;
          completedLogs.unshift({
            id,
            title: `Tender ${id.slice(0, 8)}`,
            score: q.score,
            rec: q.recommendation,
          });
          setLogs([...completedLogs]);
        }
      } catch (err) {
        console.error(`Error qualifying tender ${id}:`, err);
      }
    }

    setIsRunning(false);
    setIsFinished(true);
    onComplete();
  };

  const progressPct = totalCount > 0 ? Math.round((currentIndex / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl max-h-[85vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div>
            <div className="flex items-center space-x-2 text-violet-600 dark:text-violet-400">
              <Sparkles className="h-5 w-5" />
              <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                AI Batch Qualification Runner
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              Evaluates all new discovered tenders sequentially via Google Vertex AI (Gemini 2.5 Flash).
            </CardDescription>
          </div>
          {!isRunning && (
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300">
              <X className="h-5 w-5" />
            </button>
          )}
        </CardHeader>

        <CardContent className="p-5 overflow-y-auto flex-1 space-y-4">
          {!isRunning && !isFinished ? (
            <div className="text-center py-6 space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                  {totalCount} Pending Tenders Ready for Qualification
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto mt-1">
                  Gemini on Vertex AI will review AGPO eligibility, evaluate service compatibility against Hisako&apos;s capabilities, and compute 0–100 win scores.
                </p>
              </div>
              <Button
                onClick={startBatchRun}
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs mt-2 shadow-sm"
              >
                <Play className="h-3.5 w-3.5 mr-1.5" /> Start Batch Qualification ({totalCount})
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-800 dark:text-zinc-300 font-medium flex items-center gap-1.5">
                    {isRunning && <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-600 dark:text-violet-400" />}
                    {isRunning ? `Qualifying ${currentIndex} of ${totalCount}...` : 'Batch Qualification Complete!'}
                  </span>
                  <span className="font-semibold text-violet-600 dark:text-violet-400">{progressPct}%</span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-emerald-500 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Live Run Activity Log */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Activity Feed ({logs.length} evaluated)
                </span>
                <div className="max-h-52 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 divide-y divide-zinc-200 dark:divide-zinc-800/80">
                  {logs.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500">
                      Starting model execution...
                    </div>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 text-xs">
                        <span className="text-zinc-800 dark:text-zinc-300 font-mono">{log.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-700 dark:text-zinc-400 font-semibold">{log.score}%</span>
                          {log.rec === 'pursue' ? (
                            <Badge variant="success" className="text-[10px] py-0">
                              Pursue
                            </Badge>
                          ) : log.rec === 'borderline' ? (
                            <Badge variant="warning" className="text-[10px] py-0">
                              Borderline
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px] py-0">
                              Skip
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex justify-end shrink-0">
          <Button
            size="sm"
            onClick={onClose}
            disabled={isRunning}
            className="bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs shadow-sm"
          >
            {isFinished ? 'View Results' : 'Close'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
