'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Edit3,
  Eye,
  History,
  CheckCircle2,
  Download,
  Copy,
  RotateCcw,
  Sliders,
  FileText,
  DollarSign,
  Mail,
  FileCheck2,
  ChevronDown,
  Loader2,
  Check,
  Save,
  Printer,
  Wand2,
  Lock,
} from 'lucide-react';
import type { GeneratedDocType } from '@/lib/supabase/types';
import type { GeneratedDocumentRow, DocumentTemplateRow } from '@/lib/data/documents';
import type { TenderRow } from '@/lib/data/tenders';
import {
  generateInitialDocumentAction,
  saveRevisedDraftAction,
  regenerateSectionAction,
  markDocumentFinalAction,
} from './actions';
import { cn } from '@/lib/utils';

const DOC_TYPE_TABS: Array<{
  type: GeneratedDocType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    type: 'technical_proposal',
    label: 'Technical Proposal',
    icon: FileText,
    description: 'Technical methodology, work plan, team profiles, and architecture.',
  },
  {
    type: 'financial_proposal',
    label: 'Financial Proposal',
    icon: DollarSign,
    description: 'Detailed activity schedule, milestones, price breakdown, and VAT.',
  },
  {
    type: 'cover_letter',
    label: 'Cover Letter',
    icon: Mail,
    description: 'Formal transmittal letter addressed to procuring entity accounting officer.',
  },
  {
    type: 'form_of_tender',
    label: 'Form of Tender',
    icon: FileCheck2,
    description: 'Statutory PPADA Form of Tender narrative and binding validity commitments.',
  },
];

export function GenerativeEditor({
  applicationId,
  tender,
  initialDocuments,
  templates,
  activeDocType,
  onDocTypeChange,
  onDocFinalized,
}: {
  applicationId: string;
  tender: TenderRow;
  initialDocuments: GeneratedDocumentRow[];
  templates: DocumentTemplateRow[];
  activeDocType: GeneratedDocType;
  onDocTypeChange: (type: GeneratedDocType) => void;
  onDocFinalized: () => void;
}) {
  const [documents, setDocuments] = useState<GeneratedDocumentRow[]>(initialDocuments);
  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write');

  // Tender-specific inputs
  const [showConfig, setShowConfig] = useState(false);
  const [proposedPrice, setProposedPrice] = useState<number>(tender.estimated_value || 4500000);
  const [timelineMonths, setTimelineMonths] = useState<number>(4);
  const [assignedTeam, setAssignedTeam] = useState<string>('Evans Kiprop (Lead), Grace Mwangi (Fullstack)');
  const [customStrategy, setCustomStrategy] = useState<string>('ISO-aligned cloud infrastructure with local data residency & 24/7 SLA.');

  // Current document editing state
  const docsForActiveType = useMemo(() => {
    return documents
      .filter((d) => d.doc_type === activeDocType)
      .sort((a, b) => b.version - a.version);
  }, [documents, activeDocType]);

  const [selectedVersion, setSelectedVersion] = useState<number>(1);
  const [content, setContent] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegeneratingSection, setIsRegeneratingSection] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Section rewrite modal state
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [targetSection, setTargetSection] = useState('');
  const [sectionPrompt, setSectionPrompt] = useState('');

  // Sync content whenever activeDocType or selectedVersion changes
  useEffect(() => {
    if (docsForActiveType.length > 0) {
      const match = docsForActiveType.find((d) => d.version === selectedVersion) || docsForActiveType[0];
      setSelectedVersion(match.version);
      setContent(match.content || '');
    } else {
      setSelectedVersion(1);
      setContent('');
    }
  }, [activeDocType, docsForActiveType]);

  const activeDocRecord = docsForActiveType.find((d) => d.version === selectedVersion) || docsForActiveType[0];
  const isFinal = activeDocRecord?.status === 'final';

  // Extract detected sections from content (## Headers)
  const detectedSections = useMemo(() => {
    if (!content) return [];
    const lines = content.split('\n');
    const sections: string[] = [];
    for (const line of lines) {
      if (line.startsWith('## ') || line.startsWith('# ')) {
        const title = line.replace(/^#+\s*/, '').trim();
        if (title) sections.push(title);
      }
    }
    return sections;
  }, [content]);

  // Handler: Generate Initial Draft
  const handleGenerateInitialDraft = async () => {
    setIsGenerating(true);
    setStatusMessage(null);

    const teamList = assignedTeam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await generateInitialDocumentAction({
        applicationId,
        docType: activeDocType,
        userInputs: {
          proposedPrice,
          timelineMonths,
          assignedTeam: teamList,
          customStrategy,
        },
      });

      if (res.success && res.document) {
        setDocuments((prev) => [res.document as GeneratedDocumentRow, ...prev]);
        setSelectedVersion(res.document.version);
        setContent(res.document.content || '');
        setStatusMessage({ text: `Draft synthesized successfully with Gemini 2.5 Flash (v${res.document.version})` });
      } else {
        setStatusMessage({ text: `Generation failed: ${res.error}`, error: true });
      }
    } catch (err: any) {
      setStatusMessage({ text: `Error: ${err.message}`, error: true });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Save Revised Draft (new version or update current)
  const handleSaveDraft = async (createNewVersion = false) => {
    if (!content.trim()) return;
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await saveRevisedDraftAction({
        applicationId,
        docType: activeDocType,
        content,
        createNewVersion,
      });

      if (res.success && res.document) {
        setDocuments((prev) => {
          const filtered = prev.filter((d) => d.id !== res.document!.id);
          return [res.document as GeneratedDocumentRow, ...filtered];
        });
        setSelectedVersion(res.document.version);
        setStatusMessage({ text: `Saved version v${res.document.version} successfully.` });
      } else {
        setStatusMessage({ text: `Save failed: ${res.error}`, error: true });
      }
    } catch (err: any) {
      setStatusMessage({ text: `Save error: ${err.message}`, error: true });
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Regenerate Specific Section
  const handleRegenerateSection = async () => {
    if (!targetSection || !sectionPrompt.trim()) return;
    setIsRegeneratingSection(true);
    setStatusMessage(null);

    try {
      const res = await regenerateSectionAction({
        applicationId,
        docType: activeDocType,
        currentContent: content,
        sectionTitle: targetSection,
        userInstruction: sectionPrompt,
      });

      if (res.success && res.document) {
        setDocuments((prev) => [res.document as GeneratedDocumentRow, ...prev]);
        setSelectedVersion(res.document.version);
        setContent(res.document.content || '');
        setShowSectionModal(false);
        setSectionPrompt('');
        setStatusMessage({ text: `Section "${targetSection}" rewritten by Gemini 2.5 Flash into v${res.document.version}.` });
      } else {
        setStatusMessage({ text: `Section rewrite failed: ${res.error}`, error: true });
      }
    } catch (err: any) {
      setStatusMessage({ text: `Error: ${err.message}`, error: true });
    } finally {
      setIsRegeneratingSection(false);
    }
  };

  // Handler: Mark as Final
  const handleMarkAsFinal = async () => {
    if (!activeDocRecord) return;
    setIsFinalizing(true);
    setStatusMessage(null);

    try {
      const res = await markDocumentFinalAction(activeDocRecord.id, applicationId);
      if (res.success && res.document) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === res.document!.id ? (res.document as GeneratedDocumentRow) : d))
        );
        setStatusMessage({ text: 'Document locked and marked as Final for bid submission.' });
        onDocFinalized();
      } else {
        setStatusMessage({ text: `Finalization failed: ${res.error}`, error: true });
      }
    } catch (err: any) {
      setStatusMessage({ text: `Error: ${err.message}`, error: true });
    } finally {
      setIsFinalizing(false);
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export / Download Markdown
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeDocType}_${tender.external_reference || 'tender'}_v${selectedVersion}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Word count helper
  const wordCount = useMemo(() => {
    return content.trim() ? content.trim().split(/\s+/).length : 0;
  }, [content]);

  return (
    <Card className="border-zinc-800 bg-zinc-900/40">
      {/* Document Type Tabs */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/40 px-3 pt-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {DOC_TYPE_TABS.map((tab) => {
            const Icon = tab.icon;
            const hasDraft = documents.some((d) => d.doc_type === tab.type);
            const isTabFinal = documents.some((d) => d.doc_type === tab.type && d.status === 'final');
            const isActive = activeDocType === tab.type;

            return (
              <button
                key={tab.type}
                type="button"
                onClick={() => onDocTypeChange(tab.type)}
                className={cn(
                  'flex items-center gap-2 rounded-t-lg px-3.5 py-2.5 text-xs font-medium transition-all border-b-2',
                  isActive
                    ? 'border-cyan-500 bg-zinc-900 text-zinc-100'
                    : 'border-transparent text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-300'
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-cyan-400' : 'text-zinc-500')} />
                <span>{tab.label}</span>
                {isTabFinal ? (
                  <Badge variant="success" className="text-[9px] px-1 py-0 h-4">Final</Badge>
                ) : hasDraft ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <CardHeader className="p-4 pb-3 border-b border-zinc-800/60">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-sm font-semibold text-zinc-100">
                {DOC_TYPE_TABS.find((t) => t.type === activeDocType)?.label} Studio
              </CardTitle>
              {activeDocRecord && (
                <Badge
                  variant={isFinal ? 'success' : 'outline'}
                  className="text-[10px] tracking-wider uppercase font-semibold"
                >
                  {isFinal ? 'Locked / Final' : `Draft (${activeDocRecord.status})`}
                </Badge>
              )}
              {wordCount > 0 && (
                <span className="text-[11px] text-zinc-500">
                  {wordCount.toLocaleString()} words · ~{Math.ceil(wordCount / 200)} min read
                </span>
              )}
            </div>
            <CardDescription className="text-xs text-zinc-400">
              {DOC_TYPE_TABS.find((t) => t.type === activeDocType)?.description}
            </CardDescription>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tender input parameters drawer toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfig(!showConfig)}
              className={cn(
                'h-8 text-xs border-zinc-800 text-zinc-300 hover:text-zinc-100',
                showConfig && 'bg-zinc-800 text-cyan-400 border-cyan-500/40'
              )}
            >
              <Sliders className="h-3.5 w-3.5 mr-1.5" />
              Bid Parameters
            </Button>

            {/* Version Switcher */}
            {docsForActiveType.length > 0 && (
              <div className="flex items-center space-x-1.5 bg-zinc-950/60 border border-zinc-800 rounded-lg px-2 h-8">
                <History className="h-3.5 w-3.5 text-zinc-500" />
                <select
                  value={selectedVersion}
                  onChange={(e) => {
                    const ver = Number(e.target.value);
                    setSelectedVersion(ver);
                    const doc = docsForActiveType.find((d) => d.version === ver);
                    if (doc) setContent(doc.content || '');
                  }}
                  className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer pr-1"
                >
                  {docsForActiveType.map((d) => (
                    <option key={d.id} value={d.version} className="bg-zinc-900 text-zinc-200">
                      v{d.version} {d.status === 'final' ? '(Final)' : `(${new Date(d.created_at).toLocaleDateString()})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* AI Generate Initial Draft */}
            <Button
              size="sm"
              onClick={handleGenerateInitialDraft}
              disabled={isGenerating || isFinal}
              className="h-8 text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Drafting with Gemini...
                </>
              ) : docsForActiveType.length === 0 ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Draft with Gemini
                </>
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Redraft with Gemini
                </>
              )}
            </Button>

            {/* Mark as Final */}
            {activeDocRecord && !isFinal && (
              <Button
                size="sm"
                onClick={handleMarkAsFinal}
                disabled={isFinalizing}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {isFinalizing ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                )}
                Mark as Final
              </Button>
            )}

            {isFinal && (
              <Badge variant="success" className="h-8 px-2.5 gap-1.5 text-xs">
                <Lock className="h-3 w-3" /> Locked for Bid
              </Badge>
            )}
          </div>
        </div>

        {/* Collapsible Tender Parameters Bar */}
        {showConfig && (
          <div className="mt-3 pt-3 border-t border-zinc-800/80 bg-zinc-950/40 -mx-4 -mb-3 p-4 rounded-b-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                Tender-Specific Parameters (Injected into Gemini Prompt & Financial Formulas)
              </span>
              <span className="text-[11px] text-zinc-500">Ref: {tender.external_reference || 'N/A'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Proposed Price (KES)
                </label>
                <Input
                  type="number"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(Number(e.target.value))}
                  placeholder="e.g. 4500000"
                  className="h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Estimated Timeline (Months)
                </label>
                <Input
                  type="number"
                  value={timelineMonths}
                  onChange={(e) => setTimelineMonths(Number(e.target.value))}
                  placeholder="e.g. 4"
                  className="h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-200"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Assigned Key Personnel
                </label>
                <Input
                  value={assignedTeam}
                  onChange={(e) => setAssignedTeam(e.target.value)}
                  placeholder="e.g. Evans Kiprop (Lead), Grace Mwangi (Fullstack)"
                  className="h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-200"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                Custom Strategic Focus / Differentiating Angle
              </label>
              <Input
                value={customStrategy}
                onChange={(e) => setCustomStrategy(e.target.value)}
                placeholder="e.g. Highlight ISO 27001 compliance, Kenya Data Protection Act 2019, 99.9% SLA"
                className="h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-200"
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Status Notification */}
        {statusMessage && (
          <div
            className={cn(
              'rounded-lg border p-2.5 text-xs flex items-center justify-between',
              statusMessage.error
                ? 'border-red-500/30 bg-red-950/20 text-red-300'
                : 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300'
            )}
          >
            <span>{statusMessage.text}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-zinc-500 hover:text-zinc-300 ml-2 text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Editor Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
          {/* Write / Preview Tab */}
          <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => setEditorMode('write')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors',
                editorMode === 'write'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <Edit3 className="h-3 w-3" />
              <span>Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('preview')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors',
                editorMode === 'preview'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <Eye className="h-3 w-3" />
              <span>Preview</span>
            </button>
          </div>

          {/* Regeneration & Export Tools */}
          <div className="flex items-center space-x-2">
            {/* Regenerate Section Action */}
            {content && !isFinal && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (detectedSections.length > 0 && !targetSection) {
                    setTargetSection(detectedSections[0]);
                  }
                  setShowSectionModal(true);
                }}
                className="h-7 text-xs border-zinc-800 text-cyan-400 hover:bg-cyan-950/30 hover:border-cyan-500/40"
              >
                <Wand2 className="h-3 w-3 mr-1" />
                Regenerate Section
              </Button>
            )}

            {/* Save Version */}
            {content && !isFinal && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSaveDraft(true)}
                disabled={isSaving}
                className="h-7 text-xs border-zinc-800 text-zinc-300 hover:text-zinc-100"
              >
                {isSaving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                Save as v{selectedVersion + 1}
              </Button>
            )}

            {/* Copy */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-200"
              title="Copy Markdown"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>

            {/* Download */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownload}
              className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-200"
              title="Download Markdown"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Editor Body */}
        {content ? (
          editorMode === 'write' ? (
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isFinal}
                placeholder="Markdown proposal content..."
                rows={22}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-y"
              />
              {isFinal && (
                <div className="absolute top-3 right-3 bg-zinc-900/90 border border-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                  <Lock className="h-3 w-3 text-emerald-400" /> Finalized (Locked)
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-[400px] max-h-[600px] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-6 text-zinc-300">
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-100 prose-headings:font-bold prose-h1:text-xl prose-h2:text-base prose-h2:border-b prose-h2:border-zinc-800 prose-h2:pb-1 prose-h3:text-sm prose-p:text-xs prose-p:leading-relaxed prose-li:text-xs prose-table:text-xs prose-th:bg-zinc-900 prose-th:p-2 prose-td:p-2 prose-td:border-zinc-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 py-16 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-950/40 border border-cyan-800/40 text-cyan-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="max-w-md space-y-1">
              <h4 className="text-sm font-medium text-zinc-200">
                No draft generated for {DOC_TYPE_TABS.find((t) => t.type === activeDocType)?.label}
              </h4>
              <p className="text-xs text-zinc-500">
                Click &quot;Draft with Gemini&quot; to synthesize an authoritative first draft incorporating your company profile and tender requirements.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleGenerateInitialDraft}
              disabled={isGenerating}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs h-9"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Synthesizing with Gemini...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate First Draft
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>

      {/* "Regenerate Section" Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <Wand2 className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Regenerate Document Section
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSectionModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Instruct Gemini to rewrite a specific section while keeping the surrounding document intact.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">
                  Target Section to Revise
                </label>
                {detectedSections.length > 0 ? (
                  <select
                    value={targetSection}
                    onChange={(e) => setTargetSection(e.target.value)}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-200 focus:border-cyan-500 focus:outline-none"
                  >
                    {detectedSections.map((sec, idx) => (
                      <option key={idx} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={targetSection}
                    onChange={(e) => setTargetSection(e.target.value)}
                    placeholder="e.g. 2. Technical Methodology"
                    className="h-8 text-xs bg-zinc-950 border-zinc-800 text-zinc-200"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">
                  Operator Instruction / Prompt
                </label>
                <textarea
                  rows={4}
                  value={sectionPrompt}
                  onChange={(e) => setSectionPrompt(e.target.value)}
                  placeholder="e.g. Expand on the cloud security architecture, mentioning local data residency under the Kenya Data Protection Act 2019 and dual-datacenter failover SLA."
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSectionModal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRegenerateSection}
                disabled={isRegeneratingSection || !sectionPrompt.trim() || !targetSection}
                className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                {isRegeneratingSection ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Rewriting Section...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3.5 w-3.5 mr-1.5" /> AI Rewrite Section
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
