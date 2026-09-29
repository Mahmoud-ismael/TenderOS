'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  parseAndMapSpreadsheetAction,
  evaluateAndImportSpreadsheetAction,
  overrideAndImportSingleTenderAction,
} from './actions';
import type {
  ColumnMappingProposal,
  RelevanceEvaluationItem,
  RawScrapedTender,
} from '@/lib/agents/discovery/types';
import {
  FileSpreadsheet,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  X,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ExcelImportModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'summary'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Uploaded spreadsheet data
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [allRows, setAllRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<ColumnMappingProposal>({});

  // Summary results after import
  const [summaryData, setSummaryData] = useState<{
    totalProcessed: number;
    importedCount: number;
    skippedCount: number;
    skippedItems: RelevanceEvaluationItem[];
  } | null>(null);

  const [overriddenIndices, setOverriddenIndices] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage('');
    setFileName(file.name);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const res = await parseAndMapSpreadsheetAction({
        base64Data,
        fileName: file.name,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to parse file');
        setIsProcessing(false);
        return;
      }

      setHeaders(res.headers || []);
      setAllRows(res.allRows || []);
      setMapping(res.proposedMapping || {});
      setStep('mapping');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunAiEvaluationAndImport = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const cleanRows = JSON.parse(JSON.stringify(allRows));
      const res = await evaluateAndImportSpreadsheetAction({
        rows: cleanRows,
        mapping,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to process rows');
        setIsProcessing(false);
        return;
      }

      setSummaryData({
        totalProcessed: res.totalProcessed || 0,
        importedCount: res.importedCount || 0,
        skippedCount: res.skippedCount || 0,
        skippedItems: res.skippedItems || [],
      });

      setStep('summary');
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error during relevance evaluation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOverrideImport = async (item: RelevanceEvaluationItem) => {
    const res = await overrideAndImportSingleTenderAction(item.tender);
    if (res.success) {
      setOverriddenIndices((prev) => new Set(prev).add(item.rowIndex));
      onSuccess();
    } else {
      alert(`Override failed: ${res.error}`);
    }
  };

  const schemaFieldList: Array<{
    key: keyof ColumnMappingProposal;
    label: string;
    required: boolean;
    description: string;
  }> = [
    { key: 'title', label: 'Tender Title / Name', required: true, description: 'Main tender description or subject' },
    { key: 'procuring_entity', label: 'Procuring Entity', required: true, description: 'Government Ministry, County, or Parastatal' },
    { key: 'submission_deadline', label: 'Submission Deadline', required: true, description: 'Closing date and time' },
    { key: 'external_reference', label: 'Tender / Reference Number', required: false, description: 'Official notice number' },
    { key: 'category', label: 'Category / Sector', required: false, description: 'Procurement domain' },
    { key: 'publish_date', label: 'Publish Date', required: false, description: 'Date tender was advertised' },
    { key: 'estimated_value', label: 'Budget / Estimated Value', required: false, description: 'Estimated contract amount' },
    { key: 'tender_document_url', label: 'Document Link', required: false, description: 'Download or portal URL' },
    { key: 'description', label: 'Scope Description', required: false, description: 'Detailed specs or terms' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-3xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div>
            <div className="flex items-center space-x-2 text-violet-600 dark:text-violet-400">
              <Sparkles className="h-5 w-5" />
              <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Bulk Tender Import & AI Relevance Filter
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              Import arbitrary Excel/CSV tender lists with Vertex AI Gemini dynamic column mapping and ICT relevance filtering.
            </CardDescription>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        {/* Content body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMessage && (
            <div className="rounded-lg border border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              {errorMessage}
            </div>
          )}

          {/* STEP 1: File Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <label
                htmlFor="spreadsheet-file-input"
                className={cn(
                  'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 p-8 text-center cursor-pointer transition-colors hover:border-violet-500/50 hover:bg-violet-50/50 dark:hover:bg-violet-950/10',
                  isProcessing && 'pointer-events-none opacity-60'
                )}
              >
                <input
                  id="spreadsheet-file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20">
                  {isProcessing ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {isProcessing ? 'Analyzing Headers with Gemini on Vertex AI...' : 'Drop or Choose Spreadsheet (.xlsx, .xls, .csv)'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Accepts aggregator exports, IFMIS dumps, and newsletter tables with arbitrary column layouts.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* STEP 2: Confirm/Correct Column Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-950/80 p-3 border border-zinc-200 dark:border-zinc-800 text-xs">
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                  File: <strong className="text-violet-600 dark:text-violet-400">{fileName}</strong> ({allRows.length} rows detected)
                </span>
                <Badge variant="outline" className="border-violet-300 dark:border-violet-500/30 text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 text-[10px]">
                  Gemini Auto-Mapped
                </Badge>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Verify or adjust the detected column mappings for TenderOS schema fields:
                </p>

                <div className="grid gap-3 md:grid-cols-2">
                  {schemaFieldList.map((field) => (
                    <div
                      key={field.key}
                      className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-200">
                          {field.label} {field.required && <span className="text-red-400">*</span>}
                        </label>
                        <span className="text-[10px] text-zinc-500">Target Schema</span>
                      </div>
                      <select
                        value={mapping[field.key] || ''}
                        onChange={(e) =>
                          setMapping({ ...mapping, [field.key]: e.target.value || undefined })
                        }
                        className="flex h-8 w-full rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700"
                      >
                        <option value="">-- Not in file / Leave blank --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            Column: {h}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-zinc-500 truncate">{field.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Summary & Relevance Review */}
          {step === 'summary' && summaryData && (
            <div className="space-y-5">
              {/* Stat Cards */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
                  <span className="text-xs text-zinc-400">Total Scanned</span>
                  <div className="text-2xl font-bold text-zinc-100 mt-1">
                    {summaryData.totalProcessed}
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/10 p-3">
                  <span className="text-xs text-emerald-400">Imported as Relevant</span>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">
                    {summaryData.importedCount}
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
                  <span className="text-xs text-zinc-400">Skipped (Non-ICT)</span>
                  <div className="text-2xl font-bold text-zinc-400 mt-1">
                    {summaryData.skippedCount}
                  </div>
                </div>
              </div>

              {/* Skipped Items Table with Overrides */}
              {summaryData.skippedItems.length > 0 && (
                <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                        Skipped Tenders (AI Relevance Filter)
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Gemini flagged these as non-ICT or unrelated to Hisako&apos;s capabilities. You may override and import any tender below.
                      </p>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800/80">
                    {summaryData.skippedItems.map((item) => {
                      const isOverridden = overriddenIndices.has(item.rowIndex);

                      return (
                        <div
                          key={item.rowIndex}
                          className="flex items-start justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-950/50 text-xs"
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <p className="font-medium text-zinc-900 dark:text-zinc-200 truncate">{item.tender.title}</p>
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                              {item.tender.procuring_entity} • {item.tender.category || 'General'}
                            </p>
                            <p className="text-[11px] text-amber-700 dark:text-amber-400/90 italic">
                              Reason: {item.reason}
                            </p>
                          </div>

                          <div className="shrink-0 pt-1">
                            {isOverridden ? (
                              <Badge variant="outline" className="border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 text-[10px]">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Imported
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOverrideImport(item)}
                                className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] h-7 px-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              >
                                Override & Import
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 shrink-0">
          {step === 'mapping' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('upload')}
                disabled={isProcessing}
                className="border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300"
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleRunAiEvaluationAndImport}
                disabled={isProcessing || !mapping.title || !mapping.procuring_entity}
                className="bg-violet-600 text-white hover:bg-violet-500 text-xs shadow-sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Evaluating Relevance with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Run AI Relevance & Import
                  </>
                )}
              </Button>
            </>
          ) : step === 'summary' ? (
            <div className="ml-auto">
              <Button
                size="sm"
                onClick={onClose}
                className="bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs shadow-sm"
              >
                Done
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="ml-auto border-zinc-800 text-xs"
            >
              Cancel
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
