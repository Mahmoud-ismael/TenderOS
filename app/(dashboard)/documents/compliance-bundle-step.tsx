'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { assembleComplianceBundleAction } from './actions';
import {
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Loader2,
  CheckCircle2,
  FolderArchive,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ComplianceBundleStep({
  applicationId,
  readiness,
  isBundled,
  onBundled,
}: {
  applicationId: string;
  readiness: {
    canBundle: boolean;
    validDocs: any[];
    missingDocs: string[];
    expiredDocs: string[];
  };
  isBundled: boolean;
  onBundled: () => void;
}) {
  const [isAssembling, setIsAssembling] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAssemble = async () => {
    setIsAssembling(true);
    setFeedback(null);

    try {
      const res = await assembleComplianceBundleAction(applicationId);
      if (res.success) {
        setFeedback(`Compliance packet assembled successfully (${res.count} verified documents attached).`);
        onBundled();
      } else {
        setFeedback(`Error: ${res.error}`);
      }
    } catch (err: any) {
      setFeedback(`Assembly failed: ${err.message}`);
    } finally {
      setIsAssembling(false);
    }
  };

  return (
    <Card
      className={cn(
        'border-zinc-200 bg-white shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-900',
        !readiness.canBundle && 'border-rose-200 bg-rose-50/30 dark:border-rose-900/40 dark:bg-rose-950/20'
      )}
    >
      <CardHeader className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl border',
                readiness.canBundle
                  ? 'border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300'
                  : 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-400'
              )}
            >
              {readiness.canBundle ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Fixed-Format Compliance Packet (Mode A)
                </CardTitle>
                <Badge
                  variant={readiness.canBundle ? (isBundled ? 'success' : 'outline') : 'destructive'}
                  className={cn(
                    'text-[10px] tracking-wider uppercase font-semibold',
                    isBundled && 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
                    readiness.canBundle && !isBundled && 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
                  )}
                >
                  {isBundled
                    ? 'Bundle Assembled & Verified'
                    : readiness.canBundle
                    ? 'Ready to Assemble'
                    : 'Action Required'}
                </Badge>
              </div>
              <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Pulls verified statutory certificates (KRA TCC, AGPO Youth, CR12, Business Permit, PIN) from the document vault.
              </CardDescription>
            </div>
          </div>

          <div className="shrink-0">
            {readiness.canBundle ? (
              <Button
                size="sm"
                onClick={handleAssemble}
                disabled={isAssembling}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-9 font-medium shadow-xs"
              >
                {isAssembling ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Verifying & Bundling...
                  </>
                ) : isBundled ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Re-Assemble Packet
                  </>
                ) : (
                  <>
                    <FolderArchive className="h-3.5 w-3.5 mr-1.5" /> Assemble Compliance Packet
                  </>
                )}
              </Button>
            ) : (
              <Link
                href="/company-profile"
                className="inline-flex items-center rounded-md bg-rose-600 hover:bg-rose-500 px-3 py-2 text-xs font-medium text-white transition-colors"
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Renew / Upload Missing Docs
              </Link>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {feedback && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-2.5 text-xs text-purple-900 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-200">
            {feedback}
          </div>
        )}

        {!readiness.canBundle ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3 space-y-2 dark:border-rose-900/40 dark:bg-rose-950/30">
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" /> Compliance Packet Blocked:
            </p>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              The application packet cannot be bundled because the following required Kenyan statutory documents are missing or expired:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-rose-700 dark:text-rose-300">
              {readiness.missingDocs.map((doc, idx) => (
                <li key={idx}>Missing: {doc}</li>
              ))}
              {readiness.expiredDocs.map((doc, idx) => (
                <li key={idx}>{doc}</li>
              ))}
            </ul>
            <div className="pt-1">
              <Link
                href="/company-profile"
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 underline inline-flex items-center gap-1"
              >
                Go to Company Profile Vault <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Verified Attachments Ready:</span>
            {readiness.validDocs.map((doc) => (
              <Badge
                key={doc.id}
                variant="outline"
                className="border-zinc-200 text-zinc-700 bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:bg-zinc-800 text-[10px] py-0.5 gap-1 font-medium"
              >
                <FileCheck2 className="h-3 w-3 text-purple-600 dark:text-purple-400" /> {doc.doc_type.replace('_', ' ').toUpperCase()}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
