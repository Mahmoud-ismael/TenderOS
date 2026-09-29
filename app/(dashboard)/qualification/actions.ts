'use server';

import { revalidatePath } from 'next/cache';
import { qualifySingleTender } from '@/lib/agents/qualification/pipeline';
import {
  approveAndCreateApplication,
  skipTender,
  getPendingTenderIdsForBatch,
} from '@/lib/data/qualification';

export async function runSingleQualificationAction(tenderId: string) {
  try {
    const result = await qualifySingleTender(tenderId);
    revalidatePath('/qualification');
    revalidatePath('/discovery');
    revalidatePath('/applications');
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || 'Qualification run failed' };
  }
}

export async function getPendingTenderIdsAction() {
  try {
    const ids = await getPendingTenderIdsForBatch();
    return { success: true, ids };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch pending tenders', ids: [] };
  }
}

export async function approveAndStartApplicationAction(tenderId: string) {
  try {
    const app = await approveAndCreateApplication(tenderId);
    revalidatePath('/qualification');
    revalidatePath('/applications');
    revalidatePath('/discovery');
    return { success: true, application: app };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to approve application' };
  }
}

export async function skipTenderAction(tenderId: string) {
  try {
    await skipTender(tenderId);
    revalidatePath('/qualification');
    revalidatePath('/discovery');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to skip tender' };
  }
}
