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
        'border-zinc-800 bg-zinc-900/40 transition-all',
        !readiness.canBundle && 'border-red-500/30 bg-red-950/10'
      )}
    >
      <CardHeader className="pb-3 border-b border-zinc-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl border',
                readiness.canBundle
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-red-500/30 bg-red-500/10 text-red-400'
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
                <CardTitle className="text-sm font-semibold text-zinc-100">
                  Fixed-Format Compliance Packet (Mode A)
                </CardTitle>
                <Badge
                  variant={readiness.canBundle ? (isBundled ? 'success' : 'outline') : 'destructive'}
                  className="text-[10px] tracking-wider uppercase"
                >
                  {isBundled
                    ? 'Bundle Assembled & Verified'
                    : readiness.canBundle
                    ? 'Ready to Assemble'
                    : 'Action Required'}
                </Badge>
              </div>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
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
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9"
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
                className="inline-flex items-center rounded-md bg-red-600/90 hover:bg-red-500 px-3 py-2 text-xs font-medium text-white transition-colors"
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Renew / Upload Missing Docs
              </Link>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {feedback && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5 text-xs text-emerald-300">
            {feedback}
          </div>
        )}

        {!readiness.canBundle ? (
          <div className="rounded-lg border border-red-500/20 bg-red-950/30 p-3 space-y-2">
            <p className="text-xs font-semibold text-red-300 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" /> Compliance Packet Blocked:
            </p>
            <p className="text-[11px] text-zinc-400">
              The application packet cannot be bundled because the following required Kenyan statutory documents are missing or expired:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-red-200">
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
                className="text-xs font-medium text-red-400 hover:text-red-300 underline inline-flex items-center gap-1"
              >
                Go to Company Profile Vault <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-zinc-400">Verified Attachments Ready:</span>
            {readiness.validDocs.map((doc) => (
              <Badge
                key={doc.id}
                variant="outline"
                className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] py-0.5 gap-1"
              >
                <FileCheck2 className="h-3 w-3" /> {doc.doc_type.replace('_', ' ').toUpperCase()}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
