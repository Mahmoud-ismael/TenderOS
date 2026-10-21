'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  CheckCircle2,
  Files,
  SendHorizontal,
  ArrowRight,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HowItWorksModal } from '@/components/guide/how-it-works-modal';

export function WorkflowStepper() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const workflowSteps = [
    {
      step: '01',
      title: 'Tender Discovery',
      desc: 'Portals automatically scraped & notices imported',
      action: 'Browse Notices',
      href: '/discovery',
      icon: Compass,
    },
    {
      step: '02',
      title: 'AI Qualification',
      desc: 'Vertex AI evaluates match & checks criteria',
      action: 'Qualify Tenders',
      href: '/qualification',
      icon: CheckCircle2,
    },
    {
      step: '03',
      title: 'Document Studio',
      desc: 'AI drafts proposals & attaches Vault certificates',
      action: 'Draft Proposals',
      href: '/documents',
      icon: Files,
    },
    {
      step: '04',
      title: 'Submission & Tracking',
      desc: 'Assemble PDF packet & track strict statutory deadlines',
      action: 'Track Dossiers',
      href: '/applications',
      icon: SendHorizontal,
    },
  ];

  return (
    <>
      <Card className="border-purple-200 dark:border-purple-900/50 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-purple-50/40 dark:bg-purple-950/20">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                TenderOS Bidding Lifecycle
                <span className="rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-1.5 py-0.2 text-[9px] font-semibold border border-purple-200 dark:border-purple-800">
                  4-Step Workflow
                </span>
              </h3>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Follow this sequential pipeline to discover, qualify, draft, and file compliant Kenyan public bids.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsGuideOpen(true)}
              className="h-7 text-xs border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-medium shadow-2xs"
            >
              <HelpCircle className="h-3.5 w-3.5 mr-1" />
              How TenderOS Works
            </Button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md transition-colors"
              title={isCollapsed ? 'Expand workflow' : 'Collapse workflow'}
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Steps Grid */}
        {!isCollapsed && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-zinc-800 p-2">
            {workflowSteps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="p-3.5 flex flex-col justify-between space-y-3 group">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400">
                        STEP {s.step}
                      </span>
                      <Icon className="h-4 w-4 text-zinc-400 group-hover:text-purple-600 dark:text-zinc-500 dark:group-hover:text-purple-400 transition-colors" />
                    </div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {s.title}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>

                  <Link
                    href={s.href}
                    className="inline-flex items-center text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors pt-1"
                  >
                    <span>{s.action}</span>
                    <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Guide Modal */}
      <HowItWorksModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </>
  );
}
