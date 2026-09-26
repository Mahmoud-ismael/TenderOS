import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          System Settings
        </h1>
        <p className="text-sm text-zinc-400">
          Supabase connections, Google Cloud Vertex AI configuration, and scraper scheduling.
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-zinc-400" />
            <CardTitle className="text-base text-zinc-200">Integration Configuration</CardTitle>
          </div>
          <CardDescription className="text-zinc-500">
            Manage environment variables and API credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-zinc-800 text-xs text-zinc-500">
            System settings, model parameters, and database sync status options.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
