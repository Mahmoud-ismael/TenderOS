'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Mail,
  ShieldAlert,
  Clock,
  Sparkles,
  Save,
  CheckCircle2,
  Loader2,
  Play,
  RotateCcw,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { SystemSettingsRow } from '@/lib/data/notifications';
import { saveSettingsAction, triggerManualDeadlineScanAction } from '@/app/actions/notifications';
import { cn } from '@/lib/utils';

export function SettingsForm({
  initialSettings,
}: {
  initialSettings: SystemSettingsRow;
}) {
  const [inAppEnabled, setInAppEnabled] = useState(initialSettings.in_app_notifications_enabled);
  const [emailEnabled, setEmailEnabled] = useState(initialSettings.email_notifications_enabled);
  const [notificationEmail, setNotificationEmail] = useState(
    initialSettings.notification_email || 'tenders@hisako.co.ke'
  );
  const [resendApiKey, setResendApiKey] = useState(initialSettings.resend_api_key || '');

  // Thresholds
  const [deadlineDays, setDeadlineDays] = useState<number[]>(
    Array.isArray(initialSettings.deadline_thresholds_days)
      ? (initialSettings.deadline_thresholds_days as number[])
      : [7, 3, 1]
  );
  const [complianceDays, setComplianceDays] = useState<number[]>(
    Array.isArray(initialSettings.compliance_thresholds_days)
      ? (initialSettings.compliance_thresholds_days as number[])
      : [60, 30, 14, 7]
  );

  // Auto-qualification
  const [autoQualify, setAutoQualify] = useState(initialSettings.auto_qualify_discovered);
  const [minScore, setMinScore] = useState(initialSettings.min_score_to_notify || 50);

  // Status & loading states
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const [isRunningScan, setIsRunningScan] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const [isRunningDiscovery, setIsRunningDiscovery] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<string | null>(null);

  const toggleDeadlineDay = (day: number) => {
    if (deadlineDays.includes(day)) {
      setDeadlineDays(deadlineDays.filter((d) => d !== day));
    } else {
      setDeadlineDays([...deadlineDays, day].sort((a, b) => b - a));
    }
  };

  const toggleComplianceDay = (day: number) => {
    if (complianceDays.includes(day)) {
      setComplianceDays(complianceDays.filter((d) => d !== day));
    } else {
      setComplianceDays([...complianceDays, day].sort((a, b) => b - a));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveFeedback(null);

    try {
      const res = await saveSettingsAction({
        in_app_notifications_enabled: inAppEnabled,
        email_notifications_enabled: emailEnabled,
        notification_email: notificationEmail,
        resend_api_key: resendApiKey.trim() ? resendApiKey.trim() : null,
        deadline_thresholds_days: deadlineDays,
        compliance_thresholds_days: complianceDays,
        auto_qualify_discovered: autoQualify,
        min_score_to_notify: Number(minScore),
      });

      if (res.success) {
        setSaveFeedback('System settings and notification thresholds updated successfully.');
        setTimeout(() => setSaveFeedback(null), 4000);
      } else {
        setSaveFeedback(`Error saving settings: ${res.error}`);
      }
    } catch (err: any) {
      setSaveFeedback(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunDeadlineScan = async () => {
    setIsRunningScan(true);
    setScanResult(null);

    try {
      const res = await triggerManualDeadlineScanAction();
      if (res.success && res.summary) {
        setScanResult(
          `Scan completed: Checked ${res.summary.applicationsScanned} active application(s), ${res.summary.complianceScanned} compliance cert(s). Generated ${res.summary.notificationsCreated} notification alert(s).`
        );
      } else {
        setScanResult(`Scan error: ${res.error}`);
      }
    } catch (err: any) {
      setScanResult(`Error: ${err.message}`);
    } finally {
      setIsRunningScan(false);
    }
  };

  const handleRunDiscoveryCron = async () => {
    setIsRunningDiscovery(true);
    setDiscoveryResult(null);

    try {
      const res = await fetch('/api/cron/discover-tenders', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const auto = data.autoQualification;
        setDiscoveryResult(
          `Scraped portals successfully: ${data.scrapeSummary?.imported || 0} new tender(s) saved. Auto-qualification evaluated ${auto?.tendersEvaluated || 0} tender(s) with ${auto?.alertsDispatched || 0} alert(s) dispatched.`
        );
      } else {
        setDiscoveryResult(`Discovery error: ${data.error}`);
      }
    } catch (err: any) {
      setDiscoveryResult(`Error: ${err.message}`);
    } finally {
      setIsRunningDiscovery(false);
    }
  };

  return (
    <div className="space-y-6">
      {saveFeedback && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/40 p-3 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between shadow-xs">
          <span className="font-medium">{saveFeedback}</span>
          <button
            type="button"
            onClick={() => setSaveFeedback(null)}
            className="text-purple-700 hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-100 text-xs ml-2 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Notification Channels */}
      <Card className="border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader className="p-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Notification Channels & Routing
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Choose where urgent tender deadlines and statutory certificate alerts get delivered.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* In-App Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> In-App Notification Center
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Bell icon badge counter and floating notification drawer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInAppEnabled(!inAppEnabled)}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                  inAppEnabled ? 'bg-purple-600' : 'bg-zinc-300 dark:bg-zinc-700'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                    inAppEnabled ? 'translate-x-4' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {/* Email Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> Email Notifications
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Send HTML digests for approaching deadlines and expired certs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEmailEnabled(!emailEnabled)}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                  emailEnabled ? 'bg-purple-600' : 'bg-zinc-300 dark:bg-zinc-700'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                    emailEnabled ? 'translate-x-4' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block mb-1">
                Operator Notification Email
              </label>
              <Input
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="e.g. tenders@hisako.co.ke"
                className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus-visible:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block mb-1">
                Resend API Key (Optional for production email dispatch)
              </label>
              <Input
                type="password"
                value={resendApiKey}
                onChange={(e) => setResendApiKey(e.target.value)}
                placeholder="re_xxxxxxxxxxxx"
                className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus-visible:ring-purple-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Notification Thresholds */}
      <Card className="border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader className="p-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Alert Timing & Cutoff Thresholds
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Trigger alerts when deadlines or certificate expiries enter critical notice windows.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
              Tender Submission Deadline Alerts (Days Before Closing):
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[14, 7, 5, 3, 2, 1].map((day) => {
                const isSelected = deadlineDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDeadlineDay(day)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200'
                    )}
                  >
                    {day} Day{day > 1 ? 's' : ''} Prior
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
              Statutory Compliance Cert Expiry Alerts (Days Before Expiry):
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[90, 60, 30, 14, 7].map((day) => {
                const isSelected = complianceDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleComplianceDay(day)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200'
                    )}
                  >
                    {day} Day{day > 1 ? 's' : ''} Prior
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Automated Discovery & Qualification Pipeline */}
      <Card className="border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader className="p-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Automated Discovery & Qualification Pipeline
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Chains national tender portal scraping directly into Vertex AI (Gemini 2.5 Flash) qualification so you only review high-value bids.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-purple-200 bg-purple-50/50 dark:border-purple-800/40 dark:bg-purple-950/20">
            <div className="space-y-0.5 max-w-lg">
              <span className="text-xs font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> Auto-Qualify Discovered Tenders
              </span>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                When enabled, the daily discovery cron immediately runs Vertex AI Gemini qualification on all newly discovered tenders. Tenders scoring below your threshold or marked &quot;Skip&quot; are automatically archived, leaving only actionable &quot;Pursue&quot; opportunities for your approval.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAutoQualify(!autoQualify)}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                autoQualify ? 'bg-purple-600' : 'bg-zinc-300 dark:bg-zinc-700'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                  autoQualify ? 'translate-x-4' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          <div className="max-w-xs">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block mb-1">
              Minimum AI Score to Trigger Notification (0–100)
            </label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 w-24 focus-visible:ring-purple-500"
              />
              <span className="text-xs text-zinc-500">
                (Tenders scoring ≥ {minScore} generate high-priority review notifications)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs h-9 px-4 shadow-xs"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving Configuration...
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save Configuration & Thresholds
            </>
          )}
        </Button>
      </div>

      {/* 4. Manual Diagnostics & Cron Test Runner */}
      <Card className="border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader className="p-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Manual Diagnostics & Cron Trigger
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Execute background scan engines on-demand to test notification routing or verify cron endpoints.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRunDeadlineScan}
              disabled={isRunningScan}
              className="h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium"
            >
              {isRunningScan ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Scanning...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 mr-1.5 text-purple-600 dark:text-purple-400" /> Run Deadline & Compliance Check Now
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleRunDiscoveryCron}
              disabled={isRunningDiscovery}
              className="h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium"
            >
              {isRunningDiscovery ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Scraping & Auto-Qualifying...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 mr-1.5 text-purple-600 dark:text-purple-400" /> Run Chained Discovery & Qualification Now
                </>
              )}
            </Button>
          </div>

          {scanResult && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/40 p-2.5 text-xs text-purple-900 dark:text-purple-200">
              {scanResult}
            </div>
          )}

          {discoveryResult && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/40 p-2.5 text-xs text-purple-900 dark:text-purple-200">
              {discoveryResult}
            </div>
          )}

          {/* Vercel Cron Reference Box */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 p-3 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold text-zinc-900 dark:text-zinc-200">Vercel Cron Setup Reference (vercel.json):</span>
            <pre className="font-mono text-[11px] leading-relaxed text-zinc-800 dark:text-zinc-300 bg-white dark:bg-zinc-900 p-2.5 rounded border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
{`{
  "crons": [
    {
      "path": "/api/cron/discover-tenders",
      "schedule": "0 5 * * *"
    },
    {
      "path": "/api/cron/deadline-check",
      "schedule": "0 6,12,18 * * *"
    }
  ]
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
