'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  CircleDashed,
  FileCheck,
  FileText,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Loader2,
} from 'lucide-react';
import type { ChecklistItem, GeneratedDocType } from '@/lib/supabase/types';
import { toggleChecklistItemAction } from './actions';
import { cn } from '@/lib/utils';

export function ApplicationChecklistCard({
  applicationId,
  checklist,
  onSelectDocType,
  onScrollToCompliance,
}: {
  applicationId: string;
  checklist: ChecklistItem[];
  onSelectDocType: (type: GeneratedDocType) => void;
  onScrollToCompliance: () => void;
}) {
  const [updatingIdx, setUpdatingIdx] = useState<number | null>(null);

  const totalItems = checklist.length;
  const verifiedCount = checklist.filter((item) => item.status === 'verified').length;
  const attachedCount = checklist.filter((item) => item.status === 'attached').length;
  const completionPercentage = totalItems > 0 ? Math.round((verifiedCount / totalItems) * 100) : 0;

  const handleToggleStatus = async (idx: number, currentStatus: string) => {
    setUpdatingIdx(idx);
    const nextStatus =
      currentStatus === 'pending'
        ? 'attached'
        : currentStatus === 'attached'
        ? 'verified'
        : 'pending';

    try {
      await toggleChecklistItemAction(applicationId, idx, nextStatus as any);
    } catch (err) {
      console.error('Failed to toggle checklist item', err);
    } finally {
      setUpdatingIdx(null);
    }
  };

  const getDocTypeForChecklist = (title: string): GeneratedDocType | 'compliance' | null => {
    const lower = title.toLowerCase();
    if (lower.includes('technical') || lower.includes('methodology') || lower.includes('proposal')) {
      return 'technical_proposal';
    }
    if (lower.includes('financial') || lower.includes('price') || lower.includes('bill of quantities') || lower.includes('boq')) {
      return 'financial_proposal';
    }
    if (lower.includes('cover') || lower.includes('transmittal') || lower.includes('letter')) {
      return 'cover_letter';
    }
    if (lower.includes('form of tender') || lower.includes('tender form')) {
      return 'form_of_tender';
    }
    if (
      lower.includes('tax') ||
      lower.includes('agpo') ||
      lower.includes('cr12') ||
      lower.includes('permit') ||
      lower.includes('pin') ||
      lower.includes('statutory') ||
      lower.includes('compliance')
    ) {
      return 'compliance';
    }
    return null;
  };

  return (
    <Card className="border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <CardHeader className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Tender Compliance & Bid Checklist
              </CardTitle>
              <Badge variant="outline" className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] bg-zinc-50 dark:bg-zinc-800">
                {verifiedCount} / {totalItems} Complete ({completionPercentage}%)
              </Badge>
            </div>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Requirements parsed from tender specification. Click an item to open its drafting studio or packet vault.
            </CardDescription>
          </div>

          <div className="w-full sm:w-48 space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <div
                className="h-full bg-purple-600 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
              <span>{attachedCount} in draft</span>
              <span className="text-purple-600 dark:text-purple-400 font-medium">{verifiedCount} verified</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {checklist.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No specific checklist items defined for this application yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {checklist.map((item, idx) => {
              const docTarget = getDocTypeForChecklist(item.item);
              const isUpdating = updatingIdx === idx;

              return (
                <div
                  key={idx}
                  className={cn(
                    'group flex items-center justify-between p-3 rounded-lg border transition-all text-xs',
                    item.status === 'verified'
                      ? 'border-emerald-200 bg-emerald-50 text-zinc-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-zinc-100'
                      : item.status === 'attached'
                      ? 'border-purple-200 bg-purple-50 text-zinc-900 dark:border-purple-800 dark:bg-purple-950/30 dark:text-zinc-100'
                      : 'border-zinc-200 bg-zinc-50/80 text-zinc-900 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100'
                  )}
                >
                  <div className="flex items-start space-x-2.5 min-w-0 pr-2">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleToggleStatus(idx, item.status)}
                      title="Click to advance status"
                      className="mt-0.5 shrink-0 text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                      ) : item.status === 'verified' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : item.status === 'attached' ? (
                        <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <CircleDashed className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={cn(
                            'font-semibold truncate text-zinc-900 dark:text-zinc-100'
                          )}
                        >
                          {item.item}
                        </span>
                        {item.required && (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">*req</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            item.status === 'verified'
                              ? 'success'
                              : 'outline'
                          }
                          className={cn(
                            'text-[9px] py-0 px-1.5 uppercase font-semibold',
                            item.status === 'attached' && 'border-purple-300 text-purple-700 bg-purple-100 dark:border-purple-800 dark:text-purple-300 dark:bg-purple-950/50',
                            item.status === 'pending' && 'border-zinc-300 text-zinc-600 bg-white dark:border-zinc-700 dark:text-zinc-300 dark:bg-zinc-800'
                          )}
                        >
                          {item.status}
                        </Badge>

                        {docTarget === 'compliance' ? (
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-medium">
                            <ShieldCheck className="h-3 w-3 text-purple-600 dark:text-purple-400" /> Mode A: Vault
                          </span>
                        ) : docTarget ? (
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-medium">
                            <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400" /> Mode B: AI
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {docTarget === 'compliance' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={onScrollToCompliance}
                        className="h-7 px-2.5 text-[11px] font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-950/50"
                      >
                        Vault <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    ) : docTarget ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSelectDocType(docTarget)}
                        className="h-7 px-2.5 text-[11px] font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-950/50"
                      >
                        Draft <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
