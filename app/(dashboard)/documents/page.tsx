import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Files } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Compliance & Generated Documents
        </h1>
        <p className="text-sm text-zinc-400">
          Repository of statutory compliance certificates, templates, and synthesized tender bundles.
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Files className="h-5 w-5 text-zinc-400" />
            <CardTitle className="text-base text-zinc-200">Document Vault</CardTitle>
          </div>
          <CardDescription className="text-zinc-500">
            Tax compliance, AGPO certificate, CR12, permits, and proposal documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-zinc-800 text-xs text-zinc-500">
            Uploaded compliance documents and generated files will appear here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
