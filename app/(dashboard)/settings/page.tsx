import { Settings } from 'lucide-react';
import { getSystemSettings } from '@/lib/data/notifications';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const settings = await getSystemSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <Settings className="h-6 w-6 text-zinc-400" />
          System Settings & Notification Engine
        </h1>
        <p className="text-sm text-zinc-400">
          Configure notification channels, deadline alert timing thresholds, and automatic chained discovery-to-qualification pipelines.
        </p>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
