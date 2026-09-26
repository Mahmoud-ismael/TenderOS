import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Compass, CheckCircle2, SendHorizontal } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Executive Dashboard
        </h1>
        <p className="text-sm text-zinc-400">
          Tender discovery, AI qualification pipeline, and bid tracking overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">
              Active Tenders
            </CardTitle>
            <Compass className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">0</div>
            <p className="text-xs text-zinc-500 mt-1">Discovered across portals</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">
              Qualified (AGPO)
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">0</div>
            <p className="text-xs text-zinc-500 mt-1">Youth category matched</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">
              Applications
            </CardTitle>
            <SendHorizontal className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">0</div>
            <p className="text-xs text-zinc-500 mt-1">In drafting or submission</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">
              Model Router
            </CardTitle>
            <Badge variant="outline" className="border-violet-500/30 text-violet-400 bg-violet-500/10 text-[10px]">
              Ready
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-medium text-zinc-300">Claude + Gemini</div>
            <p className="text-xs text-zinc-500 mt-1">GCP Vertex AI Gateway</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">System Ready</CardTitle>
          <CardDescription className="text-zinc-500">
            Next.js 15 scaffold, Supabase SSR client, Vertex AI router, and database schema configured.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Ready to seed your single-operator account in Supabase and run the schema migration found in{' '}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">
              supabase/migrations/20260925_init_tenderos_schema.sql
            </code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
