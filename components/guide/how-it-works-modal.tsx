'use client';

import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  Files,
  SendHorizontal,
  Sparkles,
  ShieldCheck,
  X,
  ArrowRight,
  ArrowLeft,
  Building2,
  FileCheck2,
  Truck,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: 'Tender Discovery',
      badge: 'Step 1: Capture',
      icon: Compass,
      route: '/discovery',
      routeLabel: 'Open Discovery Inbox',
      summary: 'Find and capture opportunities across Kenyan government portals automatically.',
      details: [
        'Automated daily scraping monitors tenders.go.ke (PPIP), supplier.treasury.go.ke (IFMIS), AGPO portal, and MyGov notices at 06:00 EAT.',
        'Bulk import Excel spreadsheets or CSV notices downloaded from any state corporation or county government website.',
        'Quickly filter notices by closing urgency (<7 days), youth affirmative AGPO reservations, or procuring entity.',
        'Click "Qualify" on any tender notice to send it straight to Gemini AI for eligibility evaluation.',
      ],
      tip: 'Tip: Look for tenders marked "AGPO Reserved" where competition is legally restricted to youth, women, and PWD-owned enterprises.',
    },
    {
      step: 2,
      title: 'AI Qualification',
      badge: 'Step 2: Evaluate',
      icon: CheckCircle2,
      route: '/qualification',
      routeLabel: 'Go to Qualification',
      summary: 'Never waste time on unviable bids. Vertex AI scores your eligibility in seconds.',
      details: [
        'Gemini 2.5 Flash extracts tender requirements and cross-references your Company Profile, past contract experience, and turnover.',
        'Outputs a quantitative Match Score (0–100%) and a definitive recommendation: GO, CAUTION, or NO-GO.',
        'Identifies mandatory disqualifiers immediately (e.g. required KRA Tax Compliance, NCA registration, or specific bid bonds).',
        'Approving a qualified tender instantly creates a dedicated application workspace with a customized bid checklist.',
      ],
      tip: 'Tip: Ensure your Company Profile has all past completed projects listed so the AI can compute high technical match scores.',
    },
    {
      step: 3,
      title: 'Document Studio & Vault',
      badge: 'Step 3: Draft & Attach',
      icon: Files,
      route: '/documents',
      routeLabel: 'Open Document Studio',
      summary: 'Generate tailored technical proposals and attach verified statutory certificates from your Vault.',
      details: [
        'Document Vault: Upload your Tax Compliance Certificate, AGPO Certificate, CR12, and PIN once; TenderOS keeps expiration dates synced.',
        'AI Proposal Drafter: Gemini writes complete Technical Methodology, Implementation Workplans, and Executive Summaries tailored to the tender terms.',
        'Interactive Editor: Refine, edit, and adjust proposal sections with full markdown support and version control.',
        'Auto-Checklist: Tracks every mandatory document required by the tender instructions so no attachment is forgotten.',
      ],
      tip: 'Tip: Statutory compliance accounts for 100% of preliminary evaluation stage. Missing one certificate causes instant disqualification.',
    },
    {
      step: 4,
      title: 'Applications & Submission',
      badge: 'Step 4: Assemble & File',
      icon: SendHorizontal,
      route: '/applications',
      routeLabel: 'View Applications',
      summary: 'Assemble verified single PDF packets and file strictly before statutory deadlines.',
      details: [
        'One-Click Packet Assembly: Automatically merges your technical proposal, financial schedule, and statutory certificates into a single compiled PDF.',
        'Delivery Protocol Guidance: Step-by-step statutory instructions for physical Tender Box drops, e-GP / IFMIS uploads, or email filing.',
        'Outer Envelope Marking: Copy-paste standard outer envelope markings (tender reference, "DO NOT OPEN BEFORE" warnings, and bidder details).',
        'Statutory Countdown Timer: Live countdown to the exact submission deadline. Late bids are legally rejected under PPADA Section 77(1).',
      ],
      tip: 'Tip: For physical tender box drops, Kenya procurement law requires 1 "ORIGINAL" and 2 "COPY" sets sequentially paginated.',
    },
  ];

  const current = steps[activeStep - 1];
  const CurrentIcon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 p-5 bg-zinc-50 dark:bg-zinc-950/60">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/40">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  How TenderOS Works
                </h3>
                <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:bg-purple-950/40 text-[10px]">
                  Bidding Workflow Guide
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                The complete 4-step journey from government notice discovery to awarded contract.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Nav Strip */}
        <div className="grid grid-cols-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          {steps.map((st) => {
            const Icon = st.icon;
            const isCurrent = activeStep === st.step;
            return (
              <button
                key={st.step}
                type="button"
                onClick={() => setActiveStep(st.step)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 p-3 text-xs font-medium transition-colors border-b-2 ${
                  isCurrent
                    ? 'border-purple-600 text-purple-700 dark:text-purple-400 bg-purple-50/40 dark:bg-purple-950/20 font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isCurrent
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {st.step}
                </div>
                <span className="truncate hidden sm:inline">{st.title}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
                <CurrentIcon className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  {current.badge}
                </span>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {current.title}
                </h4>
              </div>
            </div>

            <Link
              href={current.route}
              onClick={onClose}
              className="hidden sm:inline-flex items-center rounded-lg bg-purple-600 hover:bg-purple-700 px-3.5 py-1.5 text-xs font-medium text-white transition-colors shadow-xs"
            >
              <span>{current.routeLabel}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </div>

          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
            {current.summary}
          </p>

          <div className="space-y-2.5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Key Features &amp; Actions:
            </h5>
            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              {current.details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-600 shrink-0 mt-1.5" />
                  <span className="leading-relaxed">{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 p-3 text-xs text-purple-900 dark:text-purple-300">
            <strong>Procurement Practice Note:</strong> {current.tip}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-950/60">
          <Button
            size="sm"
            variant="outline"
            disabled={activeStep === 1}
            onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
            className="text-xs border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Previous
          </Button>

          <span className="text-xs text-zinc-500 font-medium">
            Step {activeStep} of {steps.length}
          </span>

          {activeStep < steps.length ? (
            <Button
              size="sm"
              onClick={() => setActiveStep((prev) => Math.min(steps.length, prev + 1))}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-xs"
            >
              Next Step <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onClose}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-xs"
            >
              Got It, Let&apos;s Bid!
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
