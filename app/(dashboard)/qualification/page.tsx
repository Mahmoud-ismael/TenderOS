import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function QualificationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Qualification & Scoring
        </h1>
        <p className="text-sm text-zinc-400">
          AI-driven eligibility analysis (AGPO, services matching, gaps, and recommendations).
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base text-zinc-200">Qualification Results</CardTitle>
          </div>
          <CardDescription className="text-zinc-500">
            Tenders evaluated by Claude Sonnet judgment pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-zinc-800 text-xs text-zinc-500">
            Select or upload a tender to perform qualification analysis against your company profile.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
