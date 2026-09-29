import React from 'react';
import {
  getTendersWithQualifications,
  getQualificationMetrics,
} from '@/lib/data/qualification';
import { QualificationView } from './qualification-view';

export const dynamic = 'force-dynamic';

export default async function QualificationPage() {
  const [items, metrics] = await Promise.all([
    getTendersWithQualifications('all'),
    getQualificationMetrics(),
  ]);

  return (
    <div className="max-w-7xl mx-auto pb-16">
      <QualificationView initialItems={items} metrics={metrics} />
    </div>
  );
}
