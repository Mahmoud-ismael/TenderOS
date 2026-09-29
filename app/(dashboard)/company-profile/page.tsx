import React from 'react';
import {
  getCompanyProfile,
  getComplianceDocuments,
  calculateComplianceHealth,
} from '@/lib/data/company-profile';
import { ComplianceHealthCard } from './health-card';
import { DocumentsVault } from './documents-vault';
import { CompanyProfileForm } from './profile-form';

export const dynamic = 'force-dynamic';

export default async function CompanyProfilePage() {
  const profile = await getCompanyProfile();
  const documents = await getComplianceDocuments();
  const healthReport = calculateComplianceHealth(documents, profile);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Company Profile & Compliance
        </h1>
        <p className="text-sm text-zinc-400">
          Central authority for corporate credentials, statutory certificates, AGPO verification, and technical capacity.
        </p>
      </div>

      {/* Compliance Health Summary Card */}
      <ComplianceHealthCard report={healthReport} />

      {/* Compliance Documents Section with Drag-and-Drop & AI extraction */}
      <DocumentsVault initialDocuments={documents} />

      {/* Company Profile Form (react-hook-form + zod) */}
      <CompanyProfileForm initialProfile={profile} />
    </div>
  );
}
