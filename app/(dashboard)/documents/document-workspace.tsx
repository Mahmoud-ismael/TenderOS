'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  FileCheck2,
  Calendar,
  Building2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  FolderArchive,
  Layers,
} from 'lucide-react';
import type {
  ApplicationDetail,
  GeneratedDocumentRow,
  DocumentTemplateRow,
  ApplicationRow,
} from '@/lib/data/documents';
import type { TenderRow } from '@/lib/data/tenders';
import type { GeneratedDocType } from '@/lib/supabase/types';
import { ComplianceBundleStep } from './compliance-bundle-step';
import { ApplicationChecklistCard } from './application-checklist-card';
import { GenerativeEditor } from './generative-editor';
import { cn } from '@/lib/utils';

export function DocumentWorkspace({
  activeApplications,
  currentApplication,
  templates,
  complianceReadiness,
}: {
  activeApplications: Array<{
    application: ApplicationRow;
    tender: TenderRow;
  }>;
  currentApplication: ApplicationDetail | null;
  templates: DocumentTemplateRow[];
  complianceReadiness: {
    canBundle: boolean;
    validDocs: any[];
    missingDocs: string[];
    expiredDocs: string[];
  };
}) {
  const router = useRouter();
  const complianceRef = useRef<HTMLDivElement>(null);

  // Active generative tab
  const [activeDocType, setActiveDocType] = useState<GeneratedDocType>('technical_proposal');

  // Check if compliance bundle document already exists
  const hasComplianceBundle = currentApplication?.generatedDocuments.some(
    (d) => d.doc_type === 'compliance_bundle'
  ) || false;

  const scrollToCompliance = () => {
    complianceRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // If no application is selected, render the Active Applications Selector Grid
  if (!currentApplication) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
            Document Generation & Compliance Studio
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Select an approved tender application to manage compliance bundles (Mode A) and draft technical & financial proposals with Google Vertex AI (Mode B).
          </p>
        </div>

        {activeApplications.length === 0 ? (
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14151b] shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/40 text-cyan-600 dark:text-cyan-400">
                <FileCheck2 className="h-7 w-7" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  No Active Tender Applications
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Applications are created when a tender is approved from the Qualification module. Approve a qualified tender to initiate bid documentation.
                </p>
              </div>
              <Link
                href="/qualification"
                className="inline-flex items-center rounded-md bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-medium text-white transition-colors shadow-sm"
              >
                Go to Qualification Pipeline <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeApplications.map(({ application, tender }) => {
              const rawChecklist = Array.isArray(application.checklist)
                ? (application.checklist as any[])
                : [];
              const verified = rawChecklist.filter((i) => i.status === 'verified').length;
              const total = rawChecklist.length;
              const pct = total > 0 ? Math.round((verified / total) * 100) : 0;

              return (
                <Card
                  key={application.id}
                  className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14151b] hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all flex flex-col justify-between"
                >
                  <CardHeader className="p-4 pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge
                        variant={application.status === 'docs_ready' ? 'success' : 'outline'}
                        className="text-[10px] uppercase font-semibold"
                      >
                        {application.status}
                      </Badge>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {tender?.external_reference || 'REF-N/A'}
                      </span>
                    </div>

                    <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                      {tender?.title || 'Untitled Tender'}
                    </CardTitle>

                    <CardDescription className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 pt-1">
                      <Building2 className="h-3 w-3 shrink-0 text-zinc-400 dark:text-zinc-500" />
                      <span className="truncate">{tender?.procuring_entity || 'Public Entity'}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 p-2.5 space-y-1.5">
                      <div className="flex justify-between text-[11px] text-zinc-600 dark:text-zinc-400">
                        <span>Checklist Readiness</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {verified}/{total} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-zinc-400" />
                        {tender?.submission_deadline
                          ? new Date(tender.submission_deadline).toLocaleDateString()
                          : 'No deadline'}
                      </span>

                      <Button
                        size="sm"
                        onClick={() => router.push(`/documents?applicationId=${application.id}`)}
                        className="h-7 text-xs bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm"
                      >
                        Open Studio <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Active Application Document Studio View
  const { application, tender, generatedDocuments, checklist } = currentApplication;

  return (
    <div className="space-y-6">
      {/* Top Application Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/documents"
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
            >
              ← All Applications
            </Link>
            <span className="text-zinc-400 dark:text-zinc-700">/</span>
            <Badge variant="outline" className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono">
              {tender.external_reference || 'REF-N/A'}
            </Badge>
            <Badge
              variant={application.status === 'docs_ready' ? 'success' : 'outline'}
              className="text-[10px] uppercase font-semibold"
            >
              {application.status}
            </Badge>
            <Badge variant="secondary" className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              AGPO Youth Reserved
            </Badge>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-snug">
            {tender.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              {tender.procuring_entity}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              Deadline: {new Date(tender.submission_deadline).toLocaleDateString()}
            </span>
            {tender.estimated_value && (
              <span className="text-zinc-600 dark:text-zinc-400">
                Budget: KES {Number(tender.estimated_value).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Application Switcher Dropdown */}
        <div className="shrink-0 flex items-center gap-2">
          {activeApplications.length > 1 && (
            <select
              value={application.id}
              onChange={(e) => router.push(`/documents?applicationId=${e.target.value}`)}
              className="h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-800 dark:text-zinc-200 focus:border-cyan-500 focus:outline-none shadow-sm"
            >
              {activeApplications.map((a) => (
                <option key={a.application.id} value={a.application.id}>
                  {a.tender.title.substring(0, 35)}...
                </option>
              ))}
            </select>
          )}

          <Link
            href={`/applications/${application.id}`}
            className="inline-flex items-center rounded-md bg-cyan-600 hover:bg-cyan-500 px-3 py-2 text-xs font-medium text-white transition-colors shadow-sm"
          >
            Assemble Packet <ArrowRight className="h-3 w-3 ml-1.5" />
          </Link>
          <Link
            href="/applications"
            className="inline-flex items-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors shadow-sm"
          >
            Pipeline <ExternalLink className="h-3 w-3 ml-1.5" />
          </Link>
        </div>
      </div>

      {/* Checklist Card */}
      <ApplicationChecklistCard
        applicationId={application.id}
        checklist={checklist}
        onSelectDocType={(type) => setActiveDocType(type)}
        onScrollToCompliance={scrollToCompliance}
      />

      {/* Mode A: Fixed-Format Statutory Compliance Bundle */}
      <div ref={complianceRef}>
        <ComplianceBundleStep
          applicationId={application.id}
          readiness={complianceReadiness}
          isBundled={hasComplianceBundle}
          onBundled={() => router.refresh()}
        />
      </div>

      {/* Mode B: Generative Proposal Drafting Studio */}
      <GenerativeEditor
        applicationId={application.id}
        tender={tender}
        initialDocuments={generatedDocuments}
        templates={templates}
        activeDocType={activeDocType}
        onDocTypeChange={(type) => setActiveDocType(type)}
        onDocFinalized={() => router.refresh()}
      />
    </div>
  );
}
