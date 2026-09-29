import { createClient } from '@/lib/supabase/server';
import { getSystemSettings, createNotification } from '@/lib/data/notifications';
import { sendEmailNotification } from './email-dispatcher';
import { getComplianceDocuments } from '@/lib/data/company-profile';

export interface DeadlineCheckSummary {
  applicationsScanned: number;
  deadlinesTriggered: number;
  complianceScanned: number;
  complianceTriggered: number;
  checklistWarningsTriggered: number;
  notificationsCreated: number;
}

/**
 * Scans tender deadlines, applications, and compliance documents against configurable thresholds.
 * Runs on cron or manual trigger from Settings.
 */
export async function runDeadlineAndComplianceScan(): Promise<DeadlineCheckSummary> {
  const supabase = await createClient();
  const settings = await getSystemSettings();

  const deadlineThresholds: number[] = Array.isArray(settings.deadline_thresholds_days)
    ? (settings.deadline_thresholds_days as number[])
    : [7, 3, 1];

  const complianceThresholds: number[] = Array.isArray(settings.compliance_thresholds_days)
    ? (settings.compliance_thresholds_days as number[])
    : [60, 30, 14, 7];

  const now = new Date();
  let deadlinesTriggered = 0;
  let checklistWarningsTriggered = 0;
  let complianceTriggered = 0;
  let notificationsCreated = 0;

  // ----------------------------------------------------------------------------
  // 1. Scan Active Applications for Approaching Submission Deadlines
  // ----------------------------------------------------------------------------
  const { data: activeApps, error: appErr } = await supabase
    .from('applications')
    .select('*, tenders(*)')
    .in('status', ['drafting', 'docs_ready']);

  const apps = activeApps || [];

  for (const app of apps) {
    const tender = app.tenders as any;
    if (!tender?.submission_deadline) continue;

    const deadline = new Date(tender.submission_deadline);
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) continue; // Past deadline

    // Check if diffDays matches any threshold (e.g. <= 7, <= 3, <= 1)
    const matchedThreshold = deadlineThresholds
      .sort((a, b) => a - b)
      .find((t) => diffDays <= t);

    if (matchedThreshold !== undefined) {
      deadlinesTriggered++;
      const isUrgent = diffDays <= 1;
      const isWarning = diffDays <= 3;
      const severity = isUrgent ? 'critical' : isWarning ? 'warning' : 'info';

      // 1A. Check if checklist is incomplete near deadline
      const checklist = Array.isArray(app.checklist) ? (app.checklist as any[]) : [];
      const pendingItems = checklist.filter((i) => i.status !== 'verified');

      if (pendingItems.length > 0 && diffDays <= 3) {
        checklistWarningsTriggered++;
        const res = await createNotification({
          type: 'checklist_incomplete',
          title: `Checklist Incomplete (${diffDays}d left): ${tender.title.substring(0, 40)}...`,
          message: `${pendingItems.length} required bid item(s) are still pending finalization with only ${diffDays} day(s) until the strict cutoff.`,
          severity: 'critical',
          entityType: 'application',
          entityId: app.id,
          link: `/applications/${app.id}`,
        });

        if (res.notification) {
          notificationsCreated++;
          await sendEmailNotification({
            subject: `[CRITICAL URGENCY] Bid Checklist Incomplete: ${tender.external_reference || 'Tender'} (${diffDays} Days Left)`,
            headline: `Action Required: Incomplete Bid Dossier for ${tender.procuring_entity}`,
            body: `Tender "${tender.title}" has ${diffDays} day(s) remaining before the submission deadline (${deadline.toLocaleString()}). ${pendingItems.length} item(s) are unverified. Late submissions are strictly disqualified under PPADA 2015 § 77(1).`,
            actionText: 'Complete Application Dossier',
            actionUrl: `/applications/${app.id}`,
            severity: 'critical',
          });
        }
      } else {
        // Standard approaching deadline notification
        const res = await createNotification({
          type: 'deadline_approaching',
          title: `Submission Due in ${diffDays}d: ${tender.title.substring(0, 40)}...`,
          message: `Submission deadline for ${tender.procuring_entity} closes on ${deadline.toLocaleDateString()}. Ensure your master packet is assembled.`,
          severity,
          entityType: 'application',
          entityId: app.id,
          link: `/applications/${app.id}`,
        });

        if (res.notification) {
          notificationsCreated++;
          await sendEmailNotification({
            subject: `[Tender Deadline] ${diffDays} Day(s) Remaining: ${tender.external_reference || 'Tender'}`,
            headline: `Submission Window Closing: ${tender.title}`,
            body: `The deadline for ${tender.procuring_entity} is approaching on ${deadline.toLocaleString()}. Verify all compliance documents and assemble your bid packet.`,
            actionText: 'Review Application',
            actionUrl: `/applications/${app.id}`,
            severity,
          });
        }
      }
    }
  }

  // ----------------------------------------------------------------------------
  // 2. Scan Compliance Documents for Expiry
  // ----------------------------------------------------------------------------
  const complianceDocs = await getComplianceDocuments();

  for (const doc of complianceDocs) {
    if (!doc.expiry_date) continue;

    const expiry = new Date(doc.expiry_date);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      // Expired
      const res = await createNotification({
        type: 'compliance_expiring',
        title: `EXPIRED: ${doc.doc_type.replace('_', ' ').toUpperCase()}`,
        message: `Your statutory ${doc.doc_type.replace('_', ' ')} certificate expired on ${doc.expiry_date}. Bidding is currently blocked.`,
        severity: 'critical',
        entityType: 'compliance_doc',
        entityId: doc.id,
        link: '/company-profile',
      });
      if (res.notification) notificationsCreated++;
      continue;
    }

    const matchedCompThreshold = complianceThresholds
      .sort((a, b) => a - b)
      .find((t) => diffDays <= t);

    if (matchedCompThreshold !== undefined) {
      complianceTriggered++;
      const isUrgent = diffDays <= 14;
      const severity = isUrgent ? 'critical' : 'warning';

      const res = await createNotification({
        type: 'compliance_expiring',
        title: `Renew Soon (${diffDays}d left): ${doc.doc_type.replace('_', ' ').toUpperCase()}`,
        message: `Your ${doc.doc_type.replace('_', ' ')} certificate expires in ${diffDays} day(s) on ${doc.expiry_date}. Renew with the issuing authority to avoid tender disqualification.`,
        severity,
        entityType: 'compliance_doc',
        entityId: doc.id,
        link: '/company-profile',
      });

      if (res.notification) {
        notificationsCreated++;
        await sendEmailNotification({
          subject: `[Compliance Alert] ${doc.doc_type.replace('_', ' ').toUpperCase()} Expiring in ${diffDays} Days`,
          headline: `Statutory Certificate Renewal Required: ${doc.doc_type.replace('_', ' ').toUpperCase()}`,
          body: `Your company's ${doc.doc_type.replace('_', ' ')} certificate expires on ${doc.expiry_date} (${diffDays} days remaining). Upload renewed certificates in Company Profile to maintain active bid eligibility.`,
          actionText: 'Renew in Vault',
          actionUrl: '/company-profile',
          severity,
        });
      }
    }
  }

  // ----------------------------------------------------------------------------
  // 3. Scan Tender Specific Deadlines (Site Visit / Clarification)
  // ----------------------------------------------------------------------------
  const { data: specificDeadlines } = await supabase
    .from('tender_deadlines')
    .select('*, tenders(title, external_reference)')
    .eq('reminder_sent', false)
    .gt('deadline_at', now.toISOString());

  if (specificDeadlines) {
    for (const dl of specificDeadlines as any[]) {
      const deadlineAt = new Date(dl.deadline_at);
      const diffDays = Math.ceil((deadlineAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 3) {
        await createNotification({
          type: 'deadline_approaching',
          title: `Tender ${dl.deadline_type.toUpperCase()} in ${diffDays}d`,
          message: `Mandatory ${dl.deadline_type} for "${dl.tenders?.title}" is scheduled for ${deadlineAt.toLocaleDateString()}.`,
          severity: 'warning',
          entityType: 'tender',
          entityId: dl.tender_id,
          link: '/qualification',
        });

        await supabase
          .from('tender_deadlines')
          .update({ reminder_sent: true })
          .eq('id', dl.id);

        notificationsCreated++;
      }
    }
  }

  return {
    applicationsScanned: apps.length,
    deadlinesTriggered,
    complianceScanned: complianceDocs.length,
    complianceTriggered,
    checklistWarningsTriggered,
    notificationsCreated,
  };
}
