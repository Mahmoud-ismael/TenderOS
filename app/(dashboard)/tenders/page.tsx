import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Compass } from 'lucide-react';

export default function TendersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Tender Discovery
        </h1>
        <p className="text-sm text-zinc-400">
          Aggregated tenders from MyGov, IFMIS, AGPO Portal, and manual entries.
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Compass className="h-5 w-5 text-zinc-400" />
            <CardTitle className="text-base text-zinc-200">Tenders Feed</CardTitle>
          </div>
          <CardDescription className="text-zinc-500">
            No tenders loaded yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-zinc-800 text-xs text-zinc-500">
            Discovered tenders will appear here once scrapers or manual entries are added.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
