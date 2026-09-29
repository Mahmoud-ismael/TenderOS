import {
  getActiveApplications,
  getApplicationDetail,
  getDocumentTemplates,
  verifyComplianceBundleReadiness,
} from '@/lib/data/documents';
import { DocumentWorkspace } from './document-workspace';

export default async function DocumentsPage(props: {
  searchParams: Promise<{ applicationId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const applicationId = searchParams.applicationId;

  const [activeApplications, templates, complianceReadiness] = await Promise.all([
    getActiveApplications(),
    getDocumentTemplates(),
    verifyComplianceBundleReadiness(),
  ]);

  let currentApplication = null;
  if (applicationId) {
    currentApplication = await getApplicationDetail(applicationId);
  } else if (activeApplications.length === 1) {
    // If only one application exists, auto-select it for convenience
    currentApplication = await getApplicationDetail(activeApplications[0].application.id);
  }

  return (
    <DocumentWorkspace
      activeApplications={activeApplications}
      currentApplication={currentApplication}
      templates={templates}
      complianceReadiness={complianceReadiness}
    />
  );
}
