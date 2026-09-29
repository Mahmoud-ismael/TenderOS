import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  FileCheck2,
} from 'lucide-react';
import { getApplicationById, getApplicationWinRateStats } from '@/lib/data/applications';
import { CountdownBanner } from './countdown-banner';
import { LiveChecklist } from './live-checklist';
import { AssemblyCard } from './assembly-card';
import { DeliveryGuidance } from './delivery-guidance';
import { SubmissionStatusCard } from './submission-status-card';

export default async function ApplicationDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const applicationId = params.id;

  const [appDetail, winRateStats] = await Promise.all([
    getApplicationById(applicationId),
    getApplicationWinRateStats(),
  ]);

  if (!appDetail) {
    notFound();
  }

  const { application, tender, generatedDocuments, checklist } = appDetail;

  const isChecklistReady =
    checklist.length > 0 &&
    checklist.filter((i) => i.required).every((i) => i.status === 'verified');

  const masterDoc = generatedDocuments.find(
    (d) => d.doc_type === 'other' && d.file_url
  );

  return (
    <div className="space-y-6">
      {/* Top Navigation & Application Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/applications"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="h-3 w-3" /> Applications Pipeline
            </Link>
            <span className="text-zinc-700">/</span>
            <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-[10px] font-mono">
              {tender.external_reference || 'REF-N/A'}
            </Badge>
            <Badge
              variant={
                application.status === 'awarded'
                  ? 'success'
                  : application.status === 'docs_ready'
                  ? 'success'
                  : 'outline'
              }
              className="text-[10px] uppercase font-semibold"
            >
              {application.status}
            </Badge>
            <Badge
              variant="secondary"
              className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
            >
              AGPO Youth Affirmative
            </Badge>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-zinc-100 leading-snug">
            {tender.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-zinc-500" />
              {tender.procuring_entity}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-zinc-500" />
              Submission Deadline: {new Date(tender.submission_deadline).toLocaleString()}
            </span>
            {tender.estimated_value && (
              <span className="text-zinc-300 font-medium">
                Estimated Value: KES {Number(tender.estimated_value).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Quick Link to Document Studio */}
        <div className="shrink-0 flex items-center space-x-2">
          <Link
            href={`/documents?applicationId=${application.id}`}
            className="inline-flex items-center rounded-md bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 text-xs font-medium text-white transition-colors"
          >
            <Layers className="h-3.5 w-3.5 mr-1.5" /> Open Document Drafting Studio
          </Link>
        </div>
      </div>

      {/* 1. Live Countdown Banner */}
      <CountdownBanner
        deadlineIso={tender.submission_deadline}
        submittedAtIso={application.submitted_at}
        applicationStatus={application.status}
      />

      {/* 2. Live Checklist & Readiness */}
      <LiveChecklist
        applicationId={application.id}
        checklist={checklist}
      />

      {/* 3. Master Submission Packet Assembly */}
      <AssemblyCard
        applicationId={application.id}
        generatedDocs={generatedDocuments}
        isChecklistReady={isChecklistReady}
        existingMasterUrl={masterDoc?.file_url || null}
      />

      {/* 4. Delivery & Packaging Guidance */}
      <DeliveryGuidance
        applicationId={application.id}
        tender={tender}
        initialMethod={application.submission_method}
        initialNotes={application.notes}
      />

      {/* 5. Mark as Submitted & Post-Submission Tracker */}
      <SubmissionStatusCard
        applicationId={application.id}
        initialStatus={application.status}
        submittedAt={application.submitted_at}
        winRateStats={winRateStats}
      />
    </div>
  );
}
