import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export default function CompanyProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Company Profile
        </h1>
        <p className="text-sm text-zinc-400">
          Core enterprise details, AGPO credentials, KRA PIN, past project portfolio, and key personnel.
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-zinc-400" />
            <CardTitle className="text-base text-zinc-200">Organization Information</CardTitle>
          </div>
          <CardDescription className="text-zinc-500">
            Single-row configuration powering AI qualification matching and proposal generation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-zinc-800 text-xs text-zinc-500">
            Company profile data will sync with the single-row database table.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
