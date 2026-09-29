import React from 'react';
import {
  getDiscoveredTenders,
  getDiscoveryMetrics,
  getScrapeLogs,
} from '@/lib/data/tenders';
import { DiscoveryInbox } from './discovery-inbox';

export const dynamic = 'force-dynamic';

export default async function DiscoveryPage() {
  const tenders = await getDiscoveredTenders();
  const metrics = await getDiscoveryMetrics();
  const logs = await getScrapeLogs();

  return (
    <div className="max-w-7xl mx-auto pb-16">
      <DiscoveryInbox
        initialTenders={JSON.parse(JSON.stringify(tenders || []))}
        metrics={JSON.parse(JSON.stringify(metrics || {}))}
        logs={JSON.parse(JSON.stringify(logs || []))}
      />
    </div>
  );
}
