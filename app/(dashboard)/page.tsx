import React from 'react';
import { getExecutiveDashboardData } from '@/lib/data/dashboard';
import { AskAgentBox } from './components/ask-agent-box';
import { PipelineFunnel } from './components/pipeline-funnel';
import { UpcomingDeadlinesCard } from './components/upcoming-deadlines-card';
import { ComplianceHealthCard } from './components/compliance-health-card';
import { WinRateStatsCard } from './components/win-rate-stats-card';
import { RecentActivityCard } from './components/recent-activity-card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Radio } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const data = await getExecutiveDashboardData();

  const formattedDate = new Intl.DateTimeFormat('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6 pb-8">
      {/* Header with date, system status and prompt */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Executive Dashboard
            </h1>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] flex items-center gap-1 py-0.5"
            >
              <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-600 dark:text-emerald-400" />
              <span>Pipeline Live</span>
            </Badge>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            {formattedDate} · Daily Kenyan public procurement readiness &amp; submission priorities
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300 text-xs px-2.5 py-1"
          >
            <Sparkles className="h-3 w-3 mr-1.5 text-violet-600 dark:text-violet-400" />
            Vertex AI (Gemini 2.5 Flash)
          </Badge>
        </div>
      </div>

      {/* Quick-Access Ask the Agent Prompt Box */}
      <AskAgentBox />

      {/* Pipeline Funnel: Discovered → Qualifying → Qualified → In Progress → Submitted → Won */}
      <PipelineFunnel
        counts={data.pipelineCounts}
        totalPipelineValue={data.totalPipelineValue}
      />

      {/* Multi-column Core Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Deadlines & Agent Activity Feed (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          <UpcomingDeadlinesCard items={data.upcomingDeadlines} />
          <RecentActivityCard activities={data.recentActivity} />
        </div>

        {/* Right Column: Statutory Compliance Health & Win-Rate Stats (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          <ComplianceHealthCard report={data.complianceHealth} />
          <WinRateStatsCard stats={data.winRateStats} />
        </div>
      </div>
    </div>
  );
}
