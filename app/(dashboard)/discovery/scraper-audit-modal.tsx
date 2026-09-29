'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ScrapeLogRow } from '@/lib/data/tenders';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  X,
  RefreshCw,
} from 'lucide-react';

export function ScraperAuditModal({
  isOpen,
  onClose,
  logs,
  onTriggerScrape,
  isScraping,
}: {
  isOpen: boolean;
  onClose: () => void;
  logs: ScrapeLogRow[];
  onTriggerScrape: () => void;
  isScraping: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-2xl border-zinc-700 bg-zinc-900 shadow-2xl max-h-[85vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-base font-semibold text-zinc-100">
                Scraper Health & Execution Logs
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-zinc-400 mt-0.5">
              Live status of Kenya public procurement scrapers (tenders.go.ke, agpo.go.ke).
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isScraping}
              onClick={onTriggerScrape}
              className="border-zinc-700 text-xs h-8"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isScraping ? 'animate-spin' : ''}`} />
              Run Now
            </Button>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-4 overflow-y-auto flex-1 space-y-3">
          {logs.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
              No scrape runs recorded yet. Click &quot;Run Now&quot; to test the live discovery engine.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80 rounded-lg border border-zinc-800 bg-zinc-950/60">
              {logs.map((log) => {
                const isSuccess = log.status === 'success';

                return (
                  <div key={log.id} className="p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {isSuccess ? (
                          <Badge variant="success" className="text-[10px] py-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] py-0">
                            <XCircle className="h-3 w-3 mr-1" /> Failed
                          </Badge>
                        )}
                        <span className="font-semibold text-zinc-200">{log.source}</span>
                      </div>

                      <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-zinc-400">
                      <span>Found: <strong className="text-zinc-200">{log.tenders_found}</strong></span>
                      <span>Imported: <strong className="text-emerald-400">{log.tenders_imported}</strong></span>
                    </div>

                    {log.error_message && (
                      <div className="rounded bg-red-950/30 border border-red-500/20 p-2 text-[11px] text-red-300">
                        {log.error_message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
