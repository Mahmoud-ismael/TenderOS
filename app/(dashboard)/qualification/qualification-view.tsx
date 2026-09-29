'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { TenderWithQualification, QualificationMetrics } from '@/lib/data/qualification';
import { QualificationCard } from './qualification-card';
import { BatchRunnerModal } from './batch-runner-modal';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Sparkles,
  Layers,
  Filter,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function QualificationView({
  initialItems,
  metrics,
}: {
  initialItems: TenderWithQualification[];
  metrics: QualificationMetrics;
}) {
  const router = useRouter();
  const [items, setItems] = useState<TenderWithQualification[]>(initialItems);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pursue' | 'borderline' | 'skip' | 'pending'>('all');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter(({ tender, qualification }) => {
      // Tab filter
      if (filterTab === 'pursue' && qualification?.recommendation !== 'pursue') return false;
      if (filterTab === 'borderline' && qualification?.recommendation !== 'borderline') return false;
      if (filterTab === 'skip' && qualification?.recommendation !== 'skip') return false;
      if (filterTab === 'pending' && qualification) return false;

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = tender.title.toLowerCase().includes(query);
        const matchesEntity = tender.procuring_entity.toLowerCase().includes(query);
        const matchesRef = (tender.external_reference || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesEntity && !matchesRef) return false;
      }

      return true;
    });
  }, [items, search, filterTab]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /> AI Qualification Engine
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Automated tender assessment by Google Vertex AI (Gemini 2.5 Flash) for AGPO Youth, technical services fit, and compliance hurdles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsBatchModalOpen(true)}
            className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-9 font-medium shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Qualify All New ({metrics.pendingCount})
          </Button>
        </div>
      </div>

      {/* Metric Cards Bar */}
      <div className="grid gap-3 sm:grid-cols-5">
        <Card
          onClick={() => setFilterTab('pursue')}
          className={cn(
            'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 cursor-pointer hover:border-emerald-500/50 shadow-sm transition-colors',
            filterTab === 'pursue' && 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">Pursue (Qualified)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            {metrics.qualifiedPursueCount}
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Score &ge; 70%</span>
        </Card>

        <Card
          onClick={() => setFilterTab('borderline')}
          className={cn(
            'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 cursor-pointer hover:border-amber-500/50 shadow-sm transition-colors',
            filterTab === 'borderline' && 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold">Borderline</span>
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
            {metrics.borderlineCount}
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Manual review needed</span>
        </Card>

        <Card
          onClick={() => setFilterTab('skip')}
          className={cn(
            'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-700 shadow-sm transition-colors',
            filterTab === 'skip' && 'border-zinc-400 dark:border-zinc-700 bg-zinc-100/70 dark:bg-zinc-800/40 ring-1 ring-zinc-400'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold">Skipped</span>
            <XCircle className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 mt-1">
            {metrics.disqualifiedSkipCount}
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Disqualified or non-ICT</span>
        </Card>

        <Card
          onClick={() => setFilterTab('pending')}
          className={cn(
            'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 cursor-pointer hover:border-violet-500/50 shadow-sm transition-colors',
            filterTab === 'pending' && 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 ring-1 ring-violet-500'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-violet-700 dark:text-violet-400 font-semibold">Pending Run</span>
            <Clock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-violet-700 dark:text-violet-400 mt-1">
            {metrics.pendingCount}
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">New from scrapers</span>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14151b] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600 dark:text-zinc-300 font-semibold">Average Score</span>
            <Sparkles className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
            {metrics.averageScore}%
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Across all evaluated</span>
        </Card>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14151b] p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFilterTab('all')}
            className={cn(
              'text-xs h-8 px-3 rounded-lg',
              filterTab === 'all'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            )}
          >
            All Tenders ({items.length})
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFilterTab('pursue')}
            className={cn(
              'text-xs h-8 px-3 rounded-lg',
              filterTab === 'pursue'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-300'
            )}
          >
            Pursue ({metrics.qualifiedPursueCount})
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFilterTab('borderline')}
            className={cn(
              'text-xs h-8 px-3 rounded-lg',
              filterTab === 'borderline'
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-amber-700 dark:hover:text-amber-300'
            )}
          >
            Borderline ({metrics.borderlineCount})
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFilterTab('skip')}
            className={cn(
              'text-xs h-8 px-3 rounded-lg',
              filterTab === 'skip'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-300 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-300'
            )}
          >
            Skipped ({metrics.disqualifiedSkipCount})
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFilterTab('pending')}
            className={cn(
              'text-xs h-8 px-3 rounded-lg',
              filterTab === 'pending'
                ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border border-violet-300 dark:border-violet-500/30 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-violet-700 dark:hover:text-violet-300'
            )}
          >
            Pending ({metrics.pendingCount})
          </Button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tender or procuring entity..."
            className="pl-8 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs h-8"
          />
        </div>
      </div>

      {/* Qualification Cards Stream */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-3">
              No tenders found for current filter
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
              {filterTab === 'pending'
                ? 'All discovered tenders have already been processed through the AI qualification pipeline.'
                : 'Try adjusting the search query or selecting a different tab.'}
            </p>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <QualificationCard
              key={item.tender.id}
              item={item}
              onUpdated={() => router.refresh()}
            />
          ))
        )}
      </div>

      {/* Batch Runner Modal */}
      <BatchRunnerModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onComplete={() => {
          setIsBatchModalOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
