import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { SendHorizontal } from 'lucide-react';

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Tender Applications
        </h1>
        <p className="text-sm text-zinc-400">
          Track in-progress bid preparation, document checklists, and submission states.
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <SendHorizontal className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-base text-zinc-200">Bid Pipeline</CardTitle>
          </div>
          <CardDescription className="text-zinc-500">
            Active applications across drafting, ready, submitted, and awarded states.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-zinc-800 text-xs text-zinc-500">
            No active tender applications. Select a qualified tender to begin a submission checklist.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
