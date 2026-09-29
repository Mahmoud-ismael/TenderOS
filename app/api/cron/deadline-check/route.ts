import { NextResponse, type NextRequest } from 'next/server';
import { runDeadlineAndComplianceScan } from '@/lib/services/notifications/deadline-scanner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleDeadlineCheck(request);
}

export async function POST(request: NextRequest) {
  return handleDeadlineCheck(request);
}

async function handleDeadlineCheck(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const cronSecretHeader = request.headers.get('x-cron-secret');

  // Verify secret header if configured in production
  if (cronSecret) {
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (cronSecretHeader !== cronSecret && bearerToken !== cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid cron secret header' },
        { status: 401 }
      );
    }
  }

  try {
    const summary = await runDeadlineAndComplianceScan();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
    });
  } catch (error: any) {
    console.error('Error executing deadline & compliance check cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Deadline check failed',
      },
      { status: 500 }
    );
  }
}
