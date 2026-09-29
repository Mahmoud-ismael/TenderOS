'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { CompanyProfileData } from '@/lib/data/company-profile-types';
import { saveCompanyProfileAction } from './actions';
import {
  Building2,
  FileBadge,
  CreditCard,
  Briefcase,
  Users,
  History,
  MapPin,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const companyProfileSchema = z.object({
  legal_name: z.string().min(2, 'Legal company name is required'),
  registration_number: z.string(),
  agpo_category: z.string(),
  agpo_cert_number: z.string(),
  agpo_cert_expiry: z.string(),
  kra_pin: z.string(),
  tax_compliance_cert_number: z.string(),
  tax_compliance_cert_expiry: z.string(),
  physical_address: z.string(),
  postal_address: z.string(),
  contact_email: z.string(),
  contact_phone: z.string(),
  bank_details: z.object({
    bank_name: z.string(),
    branch: z.string(),
    account_name: z.string(),
    account_number: z.string(),
    swift_code: z.string(),
  }),
  core_services: z.array(z.string()),
  past_projects: z.array(
    z.object({
      client: z.string().min(1, 'Client name is required'),
      value: z.union([z.string(), z.number()]),
      year: z.union([z.string(), z.number()]),
      description: z.string(),
    })
  ),
  key_personnel: z.array(
    z.object({
      name: z.string().min(1, 'Name is required'),
      role: z.string().min(1, 'Role is required'),
      bio: z.string(),
      cv_url: z.string().optional(),
    })
  ),
});

export type FormValues = z.infer<typeof companyProfileSchema>;

export function CompanyProfileForm({
  initialProfile,
}: {
  initialProfile: CompanyProfileData;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [newServiceInput, setNewServiceInput] = useState('');

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      legal_name: initialProfile.legal_name,
      registration_number: initialProfile.registration_number,
      agpo_category: initialProfile.agpo_category,
      agpo_cert_number: initialProfile.agpo_cert_number,
      agpo_cert_expiry: initialProfile.agpo_cert_expiry,
      kra_pin: initialProfile.kra_pin,
      tax_compliance_cert_number: initialProfile.tax_compliance_cert_number,
      tax_compliance_cert_expiry: initialProfile.tax_compliance_cert_expiry,
      physical_address: initialProfile.physical_address,
      postal_address: initialProfile.postal_address,
      contact_email: initialProfile.contact_email,
      contact_phone: initialProfile.contact_phone,
      bank_details: {
        bank_name: initialProfile.bank_details?.bank_name || '',
        branch: initialProfile.bank_details?.branch || '',
        account_name: initialProfile.bank_details?.account_name || '',
        account_number: initialProfile.bank_details?.account_number || '',
        swift_code: initialProfile.bank_details?.swift_code || '',
      },
      core_services: initialProfile.core_services || [],
      past_projects: initialProfile.past_projects || [],
      key_personnel: initialProfile.key_personnel || [],
    },
  });

  const coreServices = watch('core_services') || [];

  const {
    fields: projectFields,
    append: appendProject,
    remove: removeProject,
  } = useFieldArray({
    control,
    name: 'past_projects',
  });

  const {
    fields: personnelFields,
    append: appendPersonnel,
    remove: removePersonnel,
  } = useFieldArray({
    control,
    name: 'key_personnel',
  });

  const handleAddService = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return;
    e.preventDefault();
    const trimmed = newServiceInput.trim();
    if (trimmed && !coreServices.includes(trimmed)) {
      setValue('core_services', [...coreServices, trimmed], { shouldDirty: true });
      setNewServiceInput('');
    }
  };

  const handleRemoveService = (serviceToRemove: string) => {
    setValue(
      'core_services',
      coreServices.filter((s) => s !== serviceToRemove),
      { shouldDirty: true }
    );
  };

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const res = await saveCompanyProfileAction({
        ...values,
        id: 1,
      });

      if (res.success) {
        setSaveStatus('success');
        setStatusMessage('Company Profile successfully synced to database.');
      } else {
        setSaveStatus('error');
        setStatusMessage(res.error || 'Failed to save changes.');
      }
    } catch (err: any) {
      setSaveStatus('error');
      setStatusMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header with save button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-16 z-10 bg-zinc-950/80 backdrop-blur py-2 border-b border-zinc-800/80">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Enterprise Profile Details</h2>
          <p className="text-xs text-zinc-400">
            Official company profile referenced across AI qualification & proposal drafting.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {saveStatus === 'success' && (
            <span className="flex items-center text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="h-4 w-4 mr-1" /> {statusMessage}
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center text-xs text-red-400 font-medium">
              <AlertCircle className="h-4 w-4 mr-1" /> {statusMessage}
            </span>
          )}
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs px-4"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving...
              </>
            ) : (
              'Save Company Profile'
            )}
          </Button>
        </div>
      </div>

      {/* 1. Legal & Identity Information */}
      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-zinc-400" />
            <CardTitle className="text-sm font-semibold text-zinc-200">
              Legal Identity & Registration
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-zinc-500">
            Registered corporate name and legal credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Legal Company Name *</label>
            <Input
              {...register('legal_name')}
              placeholder="e.g. Hisako Tech Solutions Ltd"
              className="border-zinc-800 bg-zinc-950 text-xs"
            />
            {errors.legal_name && (
              <p className="text-[11px] text-red-400">{errors.legal_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Registration / Incorporation Number</label>
            <Input
              {...register('registration_number')}
              placeholder="e.g. CPR/2021/12345"
              className="border-zinc-800 bg-zinc-950 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. AGPO & Statutory Compliance */}
      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <FileBadge className="h-4 w-4 text-emerald-400" />
            <CardTitle className="text-sm font-semibold text-zinc-200">
              AGPO & Kenya Revenue Authority Credentials
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-zinc-500">
            Affirmative Action procurement status and KRA tax standing.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">AGPO Category</label>
            <select
              {...register('agpo_category')}
              className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700"
            >
              <option value="Youth">Youth (30% Reservation)</option>
              <option value="Women">Women</option>
              <option value="PWD">Persons with Disabilities (PWD)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">AGPO Certificate Number</label>
            <Input
              {...register('agpo_cert_number')}
              placeholder="e.g. AGPO/Y/2024/09876"
              className="border-zinc-800 bg-zinc-950 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">AGPO Expiry Date</label>
            <Input
              type="date"
              {...register('agpo_cert_expiry')}
              className="border-zinc-800 bg-zinc-950 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">KRA PIN</label>
            <Input
              {...register('kra_pin')}
              placeholder="e.g. P051234567Z"
              className="border-zinc-800 bg-zinc-950 text-xs uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Tax Compliance Certificate (TCC) #</label>
            <Input
              {...register('tax_compliance_cert_number')}
              placeholder="e.g. KRA/TCC/2026/0129"
              className="border-zinc-800 bg-zinc-950 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">TCC Expiry Date</label>
            <Input
              type="date"
              {...register('tax_compliance_cert_expiry')}
              className="border-zinc-800 bg-zinc-950 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Core Services Tags */}
      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-4 w-4 text-violet-400" />
            <CardTitle className="text-sm font-semibold text-zinc-200">
              Core Capabilities & Services
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-zinc-500">
            Primary service domains used by the AI model router to match tender requirements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {coreServices.map((service) => (
              <Badge
                key={service}
                variant="secondary"
                className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700/80 px-2.5 py-1 text-xs gap-1.5"
              >
                <span>{service}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveService(service)}
                  className="text-zinc-400 hover:text-zinc-100"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2 max-w-md">
            <Input
              value={newServiceInput}
              onChange={(e) => setNewServiceInput(e.target.value)}
              onKeyDown={handleAddService}
              placeholder="Add service (e.g. Cloud Architecture, Cybersecurity)"
              className="border-zinc-800 bg-zinc-950 text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddService}
              className="border-zinc-800 text-xs"
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Bank Details for Bid Bonds */}
      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4 text-blue-400" />
            <CardTitle className="text-sm font-semibold text-zinc-200">
              Bank Details & Bid Bond Information
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-zinc-500">
            Account data used to prepare bank guarantee requests and formal tender documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Bank Name</label>
            <Input
              {...register('bank_details.bank_name')}
              placeholder="e.g. KCB Bank Kenya"
              className="border-zinc-800 bg-zinc-950 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Branch</label>
            <Input
              {...register('bank_details.branch')}
              placeholder="e.g. Kilimani Branch"
              className="border-zinc-800 bg-zinc-950 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Account Name</label>
            <Input
              {...register('bank_details.account_name')}
              placeholder="e.g. Hisako Tech Solutions Ltd"
              className="border-zinc-800 bg-zinc-950 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Account Number</label>
            <Input
              {...register('bank_details.account_number')}
              placeholder="e.g. 1234567890"
              className="border-zinc-800 bg-zinc-950 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">SWIFT / BIC Code</label>
            <Input
              {...register('bank_details.swift_code')}
              placeholder="e.g. KCBLKENX"
              className="border-zinc-800 bg-zinc-950 text-xs uppercase"
            />
          </div>
        </CardContent>
      </Card>

      {/* 5. Physical & Contact Details */}
      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-zinc-400" />
            <CardTitle className="text-sm font-semibold text-zinc-200">
              Address & Contact Details
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Physical Address</label>
            <Input
              {...register('physical_address')}
              placeholder="e.g. 4th Floor, Plaza 2000, Mombasa Road, Nairobi"
              className="border-zinc-800 bg-zinc-950 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Postal Address</label>
            <Input
              {...register('postal_address')}
              placeholder="e.g. P.O. Box 10293 - 00100, Nairobi"
              className="border-zinc-800 bg-zinc-950 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Official Tender Email</label>
            <Input
              type="email"
              {...register('contact_email')}
              placeholder="e.g. tenders@hisako.co.ke"
              className="border-zinc-800 bg-zinc-950 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Contact Telephone</label>
            <Input
              {...register('contact_phone')}
              placeholder="e.g. +254 712 345678"
              className="border-zinc-800 bg-zinc-950 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* 6. Past Projects History */}
      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <History className="h-4 w-4 text-zinc-400" />
              <CardTitle className="text-sm font-semibold text-zinc-200">
                Past Project History & References
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-zinc-500 mt-0.5">
              Similar assignments cited to satisfy technical qualification criteria.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendProject({
                client: '',
                value: '',
                year: new Date().getFullYear().toString(),
                description: '',
              })
            }
            className="border-zinc-800 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Project
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {projectFields.length === 0 ? (
            <p className="text-xs text-zinc-500 py-3 text-center border border-dashed border-zinc-800/80 rounded-lg">
              No past projects added yet. Click &quot;Add Project&quot; to build your portfolio.
            </p>
          ) : (
            projectFields.map((field, idx) => (
              <div
                key={field.id}
                className="grid gap-3 p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 md:grid-cols-4 items-start"
              >
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">Client / Organization</label>
                  <Input
                    {...register(`past_projects.${idx}.client` as const)}
                    placeholder="e.g. Ministry of ICT"
                    className="border-zinc-800 bg-zinc-950 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">Contract Value (KES)</label>
                  <Input
                    {...register(`past_projects.${idx}.value` as const)}
                    placeholder="e.g. 4,500,000"
                    className="border-zinc-800 bg-zinc-950 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">Year</label>
                  <Input
                    {...register(`past_projects.${idx}.year` as const)}
                    placeholder="2025"
                    className="border-zinc-800 bg-zinc-950 text-xs"
                  />
                </div>

                <div className="space-y-1 flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] text-zinc-400">Scope / Brief Description</label>
                    <Input
                      {...register(`past_projects.${idx}.description` as const)}
                      placeholder="e.g. Web portal and ERP integration"
                      className="border-zinc-800 bg-zinc-950 text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProject(idx)}
                    className="text-zinc-500 hover:text-red-400 p-2 h-9"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 7. Key Personnel */}
      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-zinc-400" />
              <CardTitle className="text-sm font-semibold text-zinc-200">
                Key Technical Personnel
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-zinc-500 mt-0.5">
              Staff profiles matching technical proposal staffing requirements.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendPersonnel({
                name: '',
                role: '',
                bio: '',
                cv_url: '',
              })
            }
            className="border-zinc-800 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Personnel
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {personnelFields.length === 0 ? (
            <p className="text-xs text-zinc-500 py-3 text-center border border-dashed border-zinc-800/80 rounded-lg">
              No technical personnel added yet. Click &quot;Add Personnel&quot; to list team leads and developers.
            </p>
          ) : (
            personnelFields.map((field, idx) => (
              <div
                key={field.id}
                className="grid gap-3 p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 md:grid-cols-4 items-start"
              >
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">Full Name</label>
                  <Input
                    {...register(`key_personnel.${idx}.name` as const)}
                    placeholder="e.g. Jane Doe"
                    className="border-zinc-800 bg-zinc-950 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">Role / Designation</label>
                  <Input
                    {...register(`key_personnel.${idx}.role` as const)}
                    placeholder="e.g. Lead Solutions Architect"
                    className="border-zinc-800 bg-zinc-950 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">Experience / Bio</label>
                  <Input
                    {...register(`key_personnel.${idx}.bio` as const)}
                    placeholder="e.g. 7+ yrs in React, PostgreSQL, Cloud"
                    className="border-zinc-800 bg-zinc-950 text-xs"
                  />
                </div>

                <div className="space-y-1 flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] text-zinc-400">CV URL / Attachment Link</label>
                    <Input
                      {...register(`key_personnel.${idx}.cv_url` as const)}
                      placeholder="https://..."
                      className="border-zinc-800 bg-zinc-950 text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePersonnel(idx)}
                    className="text-zinc-500 hover:text-red-400 p-2 h-9"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </form>
  );
}
