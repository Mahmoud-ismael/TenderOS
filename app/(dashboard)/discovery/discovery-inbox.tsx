'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { TenderRow, DiscoveryMetrics, ScrapeLogRow } from '@/lib/data/tenders';
import {
  triggerManualScraperAction,
  deleteTenderAction,
} from './actions';
import { ManualAddModal } from './manual-add-modal';
import { ExcelImportModal } from './excel-import-modal';
import { ScraperAuditModal } from './scraper-audit-modal';
import {
  Compass,
  FileSpreadsheet,
  PlusCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
  Building,
  CheckCircle2,
  Trash2,
  Activity,
  Layers,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function DiscoveryInbox({
  initialTenders,
  metrics,
  logs,
}: {
  initialTenders: TenderRow[];
  metrics: DiscoveryMetrics;
  logs: ScrapeLogRow[];
}) {
  const router = useRouter();
  const [tenders, setTenders] = useState<TenderRow[]>(initialTenders);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deadlineFilter, setDeadlineFilter] = useState<string>('all');

  const [isScraping, setIsScraping] = useState(false);
  const [scrapeFeedback, setScrapeFeedback] = useState<string | null>(null);

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedRawTender, setSelectedRawTender] = useState<TenderRow | null>(null);

  const handleRunScraper = async () => {
    setIsScraping(true);
    setScrapeFeedback(null);
    try {
      const res = await triggerManualScraperAction();
      if (res.success && res.summary) {
        setScrapeFeedback(
          `Scraped ${res.summary.sourcesScraped} sources: ${res.summary.totalInserted} new tenders discovered, ${res.summary.totalSkippedDuplicates} duplicates skipped.`
        );
        router.refresh();
      } else {
        setScrapeFeedback(`Scraper issue: ${res.error}`);
      }
    } catch (err: any) {
      setScrapeFeedback(`Error: ${err.message}`);
    } finally {
      setIsScraping(false);
      setTimeout(() => setScrapeFeedback(null), 6000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this tender from the discovery inbox?')) return;
    const res = await deleteTenderAction(id);
    if (res.success) {
      setTenders((prev) => prev.filter((t) => t.id !== id));
      router.refresh();
    }
  };

  const handleQualifyAll = () => {
    if (filteredTenders.length === 0) return;
    alert(`Enqueuing ${filteredTenders.length} discovered tenders for AI qualification.`);
    router.push('/qualification');
  };

  // Filtered tender list
  const filteredTenders = useMemo(() => {
    return tenders.filter((t) => {
      // Source filter
      if (sourceFilter !== 'all' && t.source !== sourceFilter) return false;

      // Category filter
      if (categoryFilter !== 'all') {
        const cat = (t.category || '').toLowerCase();
        if (!cat.includes(categoryFilter.toLowerCase())) return false;
      }

      // Deadline filter
      const now = new Date();
      const deadline = new Date(t.submission_deadline);
      if (deadlineFilter === 'urgent_7d') {
        const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (deadline < now || deadline > sevenDays) return false;
      } else if (deadlineFilter === 'urgent_14d') {
        const fourteenDays = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        if (deadline < now || deadline > fourteenDays) return false;
      } else if (deadlineFilter === 'active') {
        if (deadline < now) return false;
      }

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesEntity = t.procuring_entity.toLowerCase().includes(query);
        const matchesRef = (t.external_reference || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesEntity && !matchesRef) return false;
      }

      return true;
    });
  }, [tenders, search, sourceFilter, categoryFilter, deadlineFilter]);

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'ifmis':
        return (
          <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 text-[10px]">
            PPIP / IFMIS
          </Badge>
        );
      case 'agpo_portal':
        return (
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px]">
            AGPO Portal
          </Badge>
        );
      case 'mygov':
        return (
          <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10 text-[10px]">
            MyGov
          </Badge>
        );
      case 'manual':
      default:
        return (
          <Badge variant="outline" className="border-zinc-300 text-zinc-700 bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:bg-zinc-800 text-[10px]">
            Manual / Import
          </Badge>
        );
    }
  };

  const getDeadlineBadge = (deadlineStr: string) => {
    const today = new Date();
    const deadline = new Date(deadlineStr);
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="text-[11px] text-zinc-500 line-through">
          Expired ({deadline.toLocaleDateString()})
        </span>
      );
    }
    if (diffDays <= 3) {
      return (
        <span className="flex items-center gap-1 font-semibold text-red-600 dark:text-red-400 text-xs">
          <Clock className="h-3.5 w-3.5" /> Closes in {diffDays}d ({deadline.toLocaleDateString()})
        </span>
      );
    }
    if (diffDays <= 7) {
      return (
        <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 text-xs">
          <Clock className="h-3.5 w-3.5" /> Closes in {diffDays}d ({deadline.toLocaleDateString()})
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-zinc-700 dark:text-zinc-400 text-xs font-medium">
        <Calendar className="h-3.5 w-3.5 text-zinc-500" /> {deadline.toLocaleDateString()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Compass className="h-6 w-6 text-zinc-900 dark:text-zinc-100" /> Tender Discovery Inbox
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Automated scraper feeds from tenders.go.ke and AGPO portal, with Excel bulk import and manual capture.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAuditModalOpen(true)}
            className="border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 text-xs h-9 shadow-sm"
          >
            <Activity className="h-3.5 w-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" /> Scraper Status
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 hover:border-violet-500/50 text-xs h-9 shadow-sm"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-violet-600 dark:text-violet-400" /> Import Excel / CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsManualModalOpen(true)}
            className="border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 text-xs h-9 shadow-sm"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1.5 text-zinc-500 dark:text-zinc-400" /> Manual Add
          </Button>

          <Button
            size="sm"
            onClick={handleRunScraper}
            disabled={isScraping}
            className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 text-xs h-9 shadow-sm"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isScraping && 'animate-spin')} />
            {isScraping ? 'Scraping Portals...' : 'Run Scraper Now'}
          </Button>
        </div>
      </div>

      {scrapeFeedback && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in">
          {scrapeFeedback}
        </div>
      )}

      {/* Metrics Header Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#14151b] p-4">
          <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">Discovered Tenders</span>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{metrics.totalDiscovered}</div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Awaiting qualification review</span>
        </Card>

        <Card className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#14151b] p-4">
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Closing in &lt; 7 Days</span>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">{metrics.closingSoonCount}</div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">High-priority deadlines</span>
        </Card>

        <Card className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#14151b] p-4">
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">AGPO Reserved</span>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{metrics.agpoCount}</div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Youth affirmative opportunities</span>
        </Card>

        <Card className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#14151b] p-4">
          <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">Automated Pipeline</span>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">Daily 06:00</div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Cron `/api/cron/discover-tenders`</span>
        </Card>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#14151b] p-3">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, procuring entity, or reference..."
              className="pl-8 border-zinc-300 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 text-xs h-9"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-9 rounded-md border border-zinc-300 bg-zinc-50 px-2.5 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 focus-visible:outline-none"
          >
            <option value="all">All Sources ({tenders.length})</option>
            <option value="ifmis">IFMIS / PPIP ({metrics.sourcesCount.ifmis})</option>
            <option value="agpo_portal">AGPO Portal ({metrics.sourcesCount.agpo_portal})</option>
            <option value="mygov">MyGov ({metrics.sourcesCount.mygov})</option>
            <option value="manual">Manual & Imports ({metrics.sourcesCount.manual})</option>
          </select>

          <select
            value={deadlineFilter}
            onChange={(e) => setDeadlineFilter(e.target.value)}
            className="h-9 rounded-md border border-zinc-300 bg-zinc-50 px-2.5 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 focus-visible:outline-none"
          >
            <option value="all">All Deadlines</option>
            <option value="urgent_7d">Closing &lt; 7 Days</option>
            <option value="urgent_14d">Closing &lt; 14 Days</option>
            <option value="active">Active Only</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            Showing <strong className="text-zinc-900 dark:text-zinc-200">{filteredTenders.length}</strong> tenders
          </span>

          <Button
            size="sm"
            onClick={handleQualifyAll}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Qualify All New
          </Button>
        </div>
      </div>

      {/* Discovered Tenders Table */}
      <Card className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/30 overflow-hidden">
        {filteredTenders.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-300">No discovered tenders match the selected filters</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                Try broadening your filter criteria, run the scraper, or import a spreadsheet of notices.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={handleRunScraper} className="text-xs border-zinc-300 dark:border-zinc-800">
                Run Scraper
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsImportModalOpen(true)} className="text-xs border-zinc-300 dark:border-zinc-800">
                Import Spreadsheet
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-800 dark:text-zinc-300">
              <thead className="bg-zinc-100/80 text-[11px] uppercase tracking-wider text-zinc-600 dark:bg-zinc-950/80 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Tender & Procuring Entity</th>
                  <th className="py-3 px-4">Category / Ref</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Submission Deadline</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                {filteredTenders.map((tender) => (
                  <tr key={tender.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="space-y-1">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs leading-relaxed line-clamp-2">
                          {tender.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                          <Building className="h-3 w-3 text-zinc-400 dark:text-zinc-500 shrink-0" />
                          <span className="truncate">{tender.procuring_entity}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className="text-xs text-zinc-800 dark:text-zinc-300 block font-mono font-medium">
                          {tender.external_reference || 'N/A'}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block truncate max-w-xs">
                          {tender.category || 'General ICT'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">{getSourceBadge(tender.source)}</td>

                    <td className="py-3.5 px-4">{getDeadlineBadge(tender.submission_deadline)}</td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {tender.tender_document_url && (
                          <a
                            href={tender.tender_document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                            title="Tender Document URL"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => setSelectedRawTender(tender)}
                          className="rounded p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                          title="View Scraped Details"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>

                        <Link
                          href={`/qualification?tenderId=${tender.id}`}
                          className="inline-flex items-center rounded-md bg-emerald-600/90 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-medium text-white transition-colors shadow-sm"
                        >
                          <Sparkles className="h-3 w-3 mr-1" /> Qualify
                        </Link>

                        <button
                          onClick={() => handleDelete(tender.id)}
                          className="rounded p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:text-zinc-500 dark:hover:text-red-400 dark:hover:bg-zinc-800 transition-colors"
                          title="Delete Tender"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Raw Data Preview Modal */}
      {selectedRawTender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-xl border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 shadow-2xl max-h-[80vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <div>
                <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Scraped Tender Particulars
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedRawTender.external_reference}
                </CardDescription>
              </div>
              <button
                onClick={() => setSelectedRawTender(null)}
                className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                ×
              </button>
            </CardHeader>
            <CardContent className="p-4 overflow-y-auto flex-1 space-y-3 text-xs">
              <div>
                <span className="font-semibold text-zinc-700 dark:text-zinc-400">Full Title:</span>
                <p className="text-zinc-900 dark:text-zinc-200 mt-0.5">{selectedRawTender.title}</p>
              </div>

              {selectedRawTender.description && (
                <div>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-400">Description:</span>
                  <p className="text-zinc-800 dark:text-zinc-300 mt-0.5 whitespace-pre-wrap">{selectedRawTender.description}</p>
                </div>
              )}

              <div>
                <span className="font-semibold text-zinc-700 dark:text-zinc-400">Raw Scraped Payload:</span>
                <pre className="mt-1 rounded bg-zinc-100 text-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 p-2 text-[10px] overflow-x-auto border border-zinc-200 dark:border-zinc-800">
                  {JSON.stringify(selectedRawTender.raw_scraped_data, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      <ManualAddModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />

      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />

      <ScraperAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        logs={logs}
        onTriggerScrape={handleRunScraper}
        isScraping={isScraping}
      />
    </div>
  );
}
