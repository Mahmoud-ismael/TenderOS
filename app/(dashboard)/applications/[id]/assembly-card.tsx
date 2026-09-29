'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileCheck2,
  FolderArchive,
  Download,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Layers,
} from 'lucide-react';
import type { GeneratedDocumentRow } from '@/lib/data/documents';
import { assembleFinalPacketAction } from './actions';
import { cn } from '@/lib/utils';

export function AssemblyCard({
  applicationId,
  generatedDocs,
  isChecklistReady,
  existingMasterUrl,
}: {
  applicationId: string;
  generatedDocs: GeneratedDocumentRow[];
  isChecklistReady: boolean;
  existingMasterUrl: string | null;
}) {
  const [isAssembling, setIsAssembling] = useState(false);
  const [assembledPacket, setAssembledPacket] = useState<{
    fileUrl: string;
    filename: string;
    dataUri: string;
    fileSizeKb: number;
    pendingCount: number;
  } | null>(
    existingMasterUrl
      ? {
          fileUrl: existingMasterUrl,
          filename: 'master_submission_packet.pdf',
          dataUri: existingMasterUrl,
          fileSizeKb: 145,
          pendingCount: 0,
        }
      : null
  );
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  const sectionsSchedule = [
    { num: 1, title: 'Transmittal Cover Letter', type: 'cover_letter' },
    { num: 2, title: 'PPADA Form of Tender Narrative', type: 'form_of_tender' },
    { num: 3, title: 'Technical Proposal & Methodology', type: 'technical_proposal' },
    { num: 4, title: 'Financial Proposal & Price Schedule', type: 'financial_proposal' },
    { num: 5, title: 'Compliance Bundle (Tax/AGPO/CR12/PIN)', type: 'compliance_bundle' },
    { num: 6, title: 'Key Personnel CVs & Reference Annex', type: 'annex' },
  ];

  const handleAssemble = async () => {
    setIsAssembling(true);
    setFeedback(null);

    try {
      const res = await assembleFinalPacketAction(applicationId);
      if (res.success && res.fileUrl) {
        setAssembledPacket({
          fileUrl: res.fileUrl,
          filename: res.filename || 'master_submission_packet.pdf',
          dataUri: res.dataUri || res.fileUrl,
          fileSizeKb: res.fileSizeKb || 0,
          pendingCount: res.pendingCount || 0,
        });

        if (res.hasPendingWarnings) {
          setFeedback({
            text: `Master packet compiled (${res.fileSizeKb} KB). Note: ${res.pendingCount} checklist requirement(s) are still pending.`,
          });
        } else {
          setFeedback({
            text: `Master submission PDF assembled successfully (${res.fileSizeKb} KB). Ready for official filing.`,
          });
        }
      } else {
        setFeedback({ text: `Assembly failed: ${res.error}`, error: true });
      }
    } catch (err: any) {
      setFeedback({ text: `Error: ${err.message}`, error: true });
    } finally {
      setIsAssembling(false);
    }
  };

  const handleDownload = () => {
    if (!assembledPacket) return;
    const link = document.createElement('a');
    link.href = assembledPacket.dataUri;
    link.download = assembledPacket.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/40">
      <CardHeader className="p-4 pb-3 border-b border-zinc-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <FolderArchive className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold text-zinc-100">
                  Master Submission Packet Assembly
                </CardTitle>
                <Badge
                  variant={assembledPacket ? 'success' : isChecklistReady ? 'outline' : 'warning'}
                  className="text-[10px] tracking-wider uppercase font-semibold"
                >
                  {assembledPacket ? 'Packet Assembled' : isChecklistReady ? 'Ready to Compile' : 'Drafting In Progress'}
                </Badge>
              </div>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                Merges all finalized proposals, statutory certificates, and personnel annexes into a single government-standard PDF.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={handleAssemble}
              disabled={isAssembling}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs h-9 shadow-sm"
            >
              {isAssembling ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Compiling Master PDF...
                </>
              ) : assembledPacket ? (
                <>
                  <FolderArchive className="h-3.5 w-3.5 mr-1.5" /> Re-Assemble Packet
                </>
              ) : (
                <>
                  <Layers className="h-3.5 w-3.5 mr-1.5" /> Assemble Final Packet
                </>
              )}
            </Button>

            {assembledPacket && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="border-emerald-500/40 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-900/40 text-xs h-9"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download PDF ({assembledPacket.fileSizeKb} KB)
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {feedback && (
          <div
            className={cn(
              'rounded-lg border p-2.5 text-xs',
              feedback.error
                ? 'border-red-500/30 bg-red-950/20 text-red-300'
                : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
            )}
          >
            {feedback.text}
          </div>
        )}

        {/* Ordered Government Packet Schedule */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-300">
            Government Standard Ordering (PPADA Submission Structure):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {sectionsSchedule.map((sec) => {
              const doc = generatedDocs.find((d) => d.doc_type === sec.type);
              const isReady = sec.type === 'annex' || (doc && doc.status === 'final');
              const isDraft = doc && doc.status !== 'final';

              return (
                <div
                  key={sec.num}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/40 text-xs"
                >
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-zinc-400">
                      {sec.num}
                    </span>
                    <span className="font-medium text-zinc-200 truncate">{sec.title}</span>
                  </div>

                  <Badge
                    variant={isReady ? 'success' : isDraft ? 'outline' : 'secondary'}
                    className="text-[9px] uppercase px-1.5 py-0 shrink-0"
                  >
                    {isReady ? 'Ready' : isDraft ? 'Draft' : 'Pending'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assembled Master File Badge */}
        {assembledPacket && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/10 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-300">
                  Master Submission File Generated
                </p>
                <p className="text-[11px] text-zinc-400">
                  Single consolidated document formatted for evaluation committee review.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleDownload}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" /> Download Master PDF
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
