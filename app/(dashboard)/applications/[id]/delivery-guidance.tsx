'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Truck,
  Globe,
  Mail,
  Copy,
  Check,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  ShieldAlert,
  Loader2,
  Save,
  CheckCircle2,
} from 'lucide-react';
import type { SubmissionMethod } from '@/lib/supabase/types';
import type { TenderRow } from '@/lib/data/tenders';
import { updateSubmissionMethodAction } from './actions';
import { cn } from '@/lib/utils';

export function DeliveryGuidance({
  applicationId,
  tender,
  initialMethod,
  initialNotes,
}: {
  applicationId: string;
  tender: TenderRow;
  initialMethod: SubmissionMethod;
  initialNotes: string | null;
}) {
  const [method, setMethod] = useState<SubmissionMethod>(initialMethod || 'physical');
  const [notes, setNotes] = useState<string>(initialNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const res = await updateSubmissionMethodAction(applicationId, method, notes);
      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const envelopeLabelText = `CONFIDENTIAL TENDER SUBMISSION
TO: THE ACCOUNTING OFFICER
PROCURING ENTITY: ${tender.procuring_entity.toUpperCase()}
TENDER REF: ${tender.external_reference || 'N/A'}
TENDER TITLE: ${tender.title}
SUBMISSION DEADLINE: ${new Date(tender.submission_deadline).toLocaleString()}
DO NOT OPEN BEFORE: ${new Date(tender.submission_deadline).toLocaleString()}
SUBMITTED BY: HISAKO TECH SOLUTIONS LTD (AGPO YOUTH BIDDER)`;

  const handleCopyLabel = () => {
    navigator.clipboard.writeText(envelopeLabelText);
    setCopiedLabel(true);
    setTimeout(() => setCopiedLabel(false), 2000);
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/40">
      <CardHeader className="p-4 pb-3 border-b border-zinc-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold text-zinc-100">
                  Submission & Delivery Protocol
                </CardTitle>
                <Badge variant="outline" className="text-[10px] tracking-wider uppercase">
                  {method.replace('_', ' ')}
                </Badge>
              </div>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                Government-standard filing protocols, packaging specifications, and strict statutory deadline rules.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : savedSuccess ? (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              {savedSuccess ? 'Saved' : 'Save Protocol'}
            </Button>
          </div>
        </div>

        {/* Method Switcher Tabs */}
        <div className="flex items-center gap-1.5 pt-3">
          <button
            type="button"
            onClick={() => setMethod('physical')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
              method === 'physical'
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Physical Tender Box</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('online_portal')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
              method === 'online_portal'
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>IFMIS / e-GP Online Portal</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('email')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
              method === 'email'
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Email Submission</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Method Guidance Card */}
        {method === 'physical' && (
          <div className="space-y-3">
            <div className="rounded-lg border border-purple-500/20 bg-purple-950/10 p-3 space-y-2 text-xs">
              <p className="font-semibold text-purple-300 flex items-center gap-1.5">
                <Truck className="h-4 w-4" /> Physical Filing Protocol (Standard Kenyan Practice):
              </p>
              <ul className="list-disc list-inside space-y-1 text-zinc-300">
                <li>
                  <strong className="text-zinc-100">Number of Copies:</strong> Submit one (1) marked{' '}
                  <span className="text-purple-300 font-bold">&quot;ORIGINAL&quot;</span> and two (2) marked{' '}
                  <span className="text-purple-300 font-bold">&quot;COPY&quot;</span>.
                </li>
                <li>
                  <strong className="text-zinc-100">Binding:</strong> Must be securely tape-bound or spiral-bound with sequential page numbering. Loose pages will be rejected.
                </li>
                <li>
                  <strong className="text-zinc-100">Sealing:</strong> Enclose all copies inside a single outer opaque envelope. Wax seal or stamp the envelope flap.
                </li>
                <li>
                  <strong className="text-zinc-100">Tender Box Destination:</strong> Drop directly into the designated Tender Box at{' '}
                  <span className="text-zinc-100 font-semibold">{tender.procuring_entity}</span> before the exact cutoff time.
                </li>
              </ul>
            </div>

            {/* Envelope Labeling Helper */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">
                  Outer Envelope Mandatory Markings (Print & Paste):
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyLabel}
                  className="h-7 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  {copiedLabel ? (
                    <>
                      <Check className="h-3 w-3 mr-1 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" /> Copy Label
                    </>
                  )}
                </Button>
              </div>

              <pre className="font-mono text-[11px] leading-relaxed text-zinc-400 whitespace-pre-wrap bg-zinc-900/60 p-2.5 rounded border border-zinc-800/80">
                {envelopeLabelText}
              </pre>
            </div>
          </div>
        )}

        {method === 'online_portal' && (
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-3 space-y-2 text-xs">
            <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Globe className="h-4 w-4" /> Kenya IFMIS / e-GP Portal Navigation Protocol:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-zinc-300">
              <li>
                <strong className="text-zinc-100">Portal Login:</strong> Access the national portal (supplier.treasury.go.ke or tenders.go.ke) using your verified KRA PIN credentials.
              </li>
              <li>
                <strong className="text-zinc-100">Locate Negotiation:</strong> Search by Negotiation / Tender Reference:{' '}
                <span className="text-cyan-300 font-mono font-semibold">{tender.external_reference || 'Check tender dossier'}</span>.
              </li>
              <li>
                <strong className="text-zinc-100">Clock Synchronization:</strong> Government portal server clocks often differ from local devices. Upload at least 4 hours before the official cutoff.
              </li>
              <li>
                <strong className="text-zinc-100">Attach Master Packet:</strong> Upload the compiled single PDF packet under technical & financial response attachments.
              </li>
              <li>
                <strong className="text-zinc-100">Confirmation Receipt:</strong> Click &quot;Submit Response&quot; and immediately download the system-generated Submission Slip with timestamp.
              </li>
            </ol>
          </div>
        )}

        {method === 'email' && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-3 space-y-2 text-xs">
            <p className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Mail className="h-4 w-4" /> Electronic Email Filing Protocol:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300">
              <li>
                <strong className="text-zinc-100">Official Recipient:</strong> Verify the exact procurement email stated in the tender documents. Do not send to general inquiry inboxes.
              </li>
              <li>
                <strong className="text-zinc-100">Subject Line Format:</strong>{' '}
                <span className="font-mono text-zinc-100 bg-zinc-900 px-1 py-0.5 rounded">
                  [{tender.external_reference || 'REF'}] - BID SUBMISSION - HISAKO TECH SOLUTIONS LTD
                </span>
              </li>
              <li>
                <strong className="text-zinc-100">Single PDF:</strong> Ensure attachment size is under 25MB and password protection is disabled.
              </li>
              <li>
                <strong className="text-zinc-100">Delivery Receipt:</strong> Request both Delivery Status Notification (DSN) and Read Receipt.
              </li>
            </ul>
          </div>
        )}

        {/* Statutory Disqualification Warning Callout */}
        <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3 flex items-start space-x-2.5 text-xs text-red-200">
          <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-red-300">Statutory Non-Negotiable Deadline Rule:</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Under Section 77(1) of the Public Procurement and Asset Disposal Act (PPADA, 2015), any tender received after the deadline is{' '}
              <strong className="text-red-300">strictly disqualified and returned unopened</strong>. Procurement evaluation committees have zero legal discretion to accept late bids regardless of excuse.
            </p>
          </div>
        </div>

        {/* Custom Delivery Notes Input */}
        <div>
          <label className="text-xs font-medium text-zinc-300 block mb-1">
            Custom Delivery Notes (Tender Box Floor, Room Number, Courier Tracking)
          </label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Tender Box situated on Ground Floor, Procurement Registry Room 12. Courier dispatch assigned to Evans."
            className="h-8 text-xs bg-zinc-950 border-zinc-800 text-zinc-200"
          />
        </div>
      </CardContent>
    </Card>
  );
}
