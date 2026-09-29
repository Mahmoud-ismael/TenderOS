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
    <Card className="border-zinc-800 bg-zinc-900/40">
      <CardHeader className="pb-3 border-b border-zinc-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-400" />
                Tender Compliance & Bid Checklist
              </CardTitle>
              <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-[10px]">
                {verifiedCount} / {totalItems} Complete ({completionPercentage}%)
              </Badge>
            </div>
            <CardDescription className="text-xs text-zinc-400">
              Requirements parsed from tender specification. Click an item to open its drafting studio or packet vault.
            </CardDescription>
          </div>

          <div className="w-full sm:w-48 space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-400">
              <span>{attachedCount} in draft</span>
              <span className="text-emerald-400 font-medium">{verifiedCount} verified</span>
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
                    'group flex items-center justify-between p-2.5 rounded-lg border transition-all text-xs',
                    item.status === 'verified'
                      ? 'border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/40'
                      : item.status === 'attached'
                      ? 'border-blue-500/20 bg-blue-950/10 hover:border-blue-500/40'
                      : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                  )}
                >
                  <div className="flex items-start space-x-2.5 min-w-0 pr-2">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleToggleStatus(idx, item.status)}
                      title="Click to advance status"
                      className="mt-0.5 shrink-0 text-zinc-500 hover:text-zinc-200 transition-colors"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                      ) : item.status === 'verified' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : item.status === 'attached' ? (
                        <FileCheck className="h-4 w-4 text-blue-400" />
                      ) : (
                        <CircleDashed className="h-4 w-4 text-zinc-500 group-hover:text-zinc-400" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={cn(
                            'font-medium truncate',
                            item.status === 'verified' ? 'text-zinc-200' : 'text-zinc-300'
                          )}
                        >
                          {item.item}
                        </span>
                        {item.required && (
                          <span className="text-[10px] text-red-400 font-semibold">*req</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            item.status === 'verified'
                              ? 'success'
                              : item.status === 'attached'
                              ? 'outline'
                              : 'secondary'
                          }
                          className={cn(
                            'text-[9px] py-0 px-1.5 uppercase font-medium',
                            item.status === 'attached' && 'border-blue-500/40 text-blue-400 bg-blue-500/10'
                          )}
                        >
                          {item.status}
                        </Badge>

                        {docTarget === 'compliance' ? (
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-emerald-400" /> Mode A: Vault
                          </span>
                        ) : docTarget ? (
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-cyan-400" /> Mode B: AI
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
                        className="h-7 px-2 text-[11px] text-zinc-400 hover:text-emerald-300 hover:bg-emerald-950/30"
                      >
                        Vault <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    ) : docTarget ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSelectDocType(docTarget)}
                        className="h-7 px-2 text-[11px] text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/30"
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
