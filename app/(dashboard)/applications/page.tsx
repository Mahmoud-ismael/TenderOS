import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  SendHorizontal,
  Building2,
  Calendar,
  FileCheck2,
  ArrowRight,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { getActiveApplications } from '@/lib/data/documents';

export default async function ApplicationsPage() {
  const applications = await getActiveApplications();

  const totalApplications = applications.length;
  const draftingCount = applications.filter((a) => a.application.status === 'drafting').length;
  const readyCount = applications.filter((a) => a.application.status === 'docs_ready').length;
  const submittedCount = applications.filter((a) => a.application.status === 'submitted').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <SendHorizontal className="h-6 w-6 text-cyan-400" />
            Tender Applications Pipeline
          </h1>
          <p className="text-sm text-zinc-400">
            Track in-progress bid preparation, document bundle checklists, and submission states.
          </p>
        </div>

        <Link
          href="/qualification"
          className="inline-flex items-center rounded-md bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 text-xs font-medium text-white transition-colors self-start sm:self-auto"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Qualify New Tenders
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-zinc-800 bg-zinc-900/40 p-4 space-y-1">
          <p className="text-xs text-zinc-500">Total Active Applications</p>
          <p className="text-2xl font-bold text-zinc-100">{totalApplications}</p>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/40 p-4 space-y-1">
          <p className="text-xs text-zinc-500">Drafting / Compiling</p>
          <p className="text-2xl font-bold text-cyan-400">{draftingCount}</p>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/40 p-4 space-y-1">
          <p className="text-xs text-zinc-500">Packet Ready for Submission</p>
          <p className="text-2xl font-bold text-emerald-400">{readyCount}</p>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/40 p-4 space-y-1">
          <p className="text-xs text-zinc-500">Submitted & Pending Decision</p>
          <p className="text-2xl font-bold text-purple-400">{submittedCount}</p>
        </Card>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
              <SendHorizontal className="h-6 w-6" />
            </div>
            <div className="max-w-sm space-y-1">
              <h3 className="text-sm font-semibold text-zinc-200">No active applications in pipeline</h3>
              <p className="text-xs text-zinc-500">
                To start an application, qualify a tender and click &quot;Approve &amp; Start Application&quot;.
              </p>
            </div>
            <Link
              href="/qualification"
              className="inline-flex items-center rounded-md bg-cyan-600 hover:bg-cyan-500 px-3.5 py-1.5 text-xs font-medium text-white transition-colors"
            >
              Browse Qualified Tenders <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {applications.map(({ application, tender }) => {
            const checklist = Array.isArray(application.checklist)
              ? (application.checklist as any[])
              : [];
            const verified = checklist.filter((i) => i.status === 'verified').length;
            const total = checklist.length;
            const pct = total > 0 ? Math.round((verified / total) * 100) : 0;

            return (
              <Card
                key={application.id}
                className="border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <Badge
                      variant={application.status === 'docs_ready' ? 'success' : 'outline'}
                      className="text-[10px] uppercase font-semibold"
                    >
                      {application.status}
                    </Badge>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {tender.external_reference || 'REF-N/A'}
                    </span>
                  </div>

                  <CardTitle className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug">
                    {tender.title}
                  </CardTitle>

                  <CardDescription className="text-xs text-zinc-400 flex items-center gap-1.5 pt-1">
                    <Building2 className="h-3 w-3 shrink-0 text-zinc-500" />
                    <span className="truncate">{tender.procuring_entity}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="rounded-lg bg-zinc-950/60 border border-zinc-800/80 p-2.5 space-y-1.5">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Checklist Completion</span>
                      <span className="text-emerald-400 font-medium">
                        {verified} / {total} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Deadline: {new Date(tender.submission_deadline).toLocaleDateString()}
                    </span>

                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/documents?applicationId=${application.id}`}
                        className="inline-flex items-center rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors"
                      >
                        <Layers className="h-3 w-3 mr-1" /> Studio
                      </Link>
                      <Link
                        href={`/applications/${application.id}`}
                        className="inline-flex items-center rounded-md bg-cyan-600 hover:bg-cyan-500 px-2.5 py-1.5 text-xs font-medium text-white transition-colors"
                      >
                        <FileCheck2 className="h-3 w-3 mr-1" /> Assemble & Submit
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
