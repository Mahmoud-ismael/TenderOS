'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addManualTenderAction } from './actions';
import { PlusCircle, Loader2, Link2, Check, X } from 'lucide-react';

export function ManualAddModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    procuring_entity: '',
    external_reference: '',
    category: 'ICT Services & Software Engineering',
    submission_deadline: '',
    publish_date: new Date().toISOString().split('T')[0],
    tender_document_url: '',
    estimated_value: '',
    description: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.procuring_entity || !formData.submission_deadline) {
      setErrorMsg('Title, Procuring Entity, and Submission Deadline are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await addManualTenderAction({
        title: formData.title,
        procuring_entity: formData.procuring_entity,
        external_reference: formData.external_reference || `MAN-${Date.now()}`,
        category: formData.category,
        submission_deadline: new Date(formData.submission_deadline).toISOString(),
        publish_date: formData.publish_date ? new Date(formData.publish_date).toISOString() : new Date().toISOString(),
        tender_document_url: formData.tender_document_url || null,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
        description: formData.description || null,
        source: 'manual',
        status: 'discovered',
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to save tender');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-xl border-zinc-700 bg-zinc-900 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <CardTitle className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-zinc-300" /> Manually Add Tender
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 mt-0.5">
              Enter tender particulars or paste official government notice details.
            </CardDescription>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Tender Title *</label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Supply and Implementation of Enterprise ERP & Portal System"
                className="border-zinc-800 bg-zinc-950 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Procuring Entity / Buyer *</label>
                <Input
                  required
                  value={formData.procuring_entity}
                  onChange={(e) => setFormData({ ...formData, procuring_entity: e.target.value })}
                  placeholder="e.g. Kenya Revenue Authority (KRA)"
                  className="border-zinc-800 bg-zinc-950 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Tender / Ref Number</label>
                <Input
                  value={formData.external_reference}
                  onChange={(e) => setFormData({ ...formData, external_reference: e.target.value })}
                  placeholder="e.g. KRA/HQS/NCB-042/2026"
                  className="border-zinc-800 bg-zinc-950 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Procurement Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700"
                >
                  <option value="ICT Services & Software Engineering">ICT Services & Software Engineering</option>
                  <option value="Web & Mobile App Development">Web & Mobile App Development</option>
                  <option value="AGPO Youth Reserved - ICT">AGPO Youth Reserved - ICT</option>
                  <option value="IT Consultancy & Advisory">IT Consultancy & Advisory</option>
                  <option value="Hardware & Networking">Hardware & Networking</option>
                  <option value="General Procurement">General Procurement</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Submission Deadline *</label>
                <Input
                  type="datetime-local"
                  required
                  value={formData.submission_deadline}
                  onChange={(e) => setFormData({ ...formData, submission_deadline: e.target.value })}
                  className="border-zinc-800 bg-zinc-950 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Estimated Budget (KES)</label>
                <Input
                  type="number"
                  value={formData.estimated_value}
                  onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                  placeholder="e.g. 5000000"
                  className="border-zinc-800 bg-zinc-950 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                  <Link2 className="h-3.5 w-3.5 text-zinc-400" /> Tender Document / Notice URL
                </label>
                <Input
                  type="url"
                  value={formData.tender_document_url}
                  onChange={(e) => setFormData({ ...formData, tender_document_url: e.target.value })}
                  placeholder="https://tenders.go.ke/..."
                  className="border-zinc-800 bg-zinc-950 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Description / Scope Summary</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary of requirements, eligibility notes, or site visit particulars..."
                className="flex w-full rounded-md border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="border-zinc-800 text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5" /> Save to Discovery Inbox
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
