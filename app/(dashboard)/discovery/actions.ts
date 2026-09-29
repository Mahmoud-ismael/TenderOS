'use server';

import { revalidatePath } from 'next/cache';
import { runTenderScrapers } from '@/lib/agents/discovery/scraper-orchestrator';
import {
  parseSpreadsheetData,
  proposeColumnMappingWithClaude,
  filterTenderRelevanceWithClaude,
} from '@/lib/agents/discovery/import-mapper';
import {
  createManualTender,
  bulkInsertTenders,
  deleteTender,
  type TenderRow,
} from '@/lib/data/tenders';
import type {
  RawScrapedTender,
  ColumnMappingProposal,
  RelevanceEvaluationItem,
} from '@/lib/agents/discovery/types';

export async function triggerManualScraperAction() {
  try {
    const summary = await runTenderScrapers();
    revalidatePath('/discovery');
    revalidatePath('/tenders');
    return { success: true, summary };
  } catch (error: any) {
    return { success: false, error: error.message || 'Scraper run failed' };
  }
}

export async function addManualTenderAction(tender: Partial<TenderRow>) {
  try {
    const created = await createManualTender(tender);
    revalidatePath('/discovery');
    revalidatePath('/tenders');
    return { success: true, data: created };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to add tender' };
  }
}

export async function parseAndMapSpreadsheetAction(params: {
  base64Data: string;
  fileName: string;
}) {
  try {
    const buffer = Buffer.from(params.base64Data, 'base64');
    const { headers, rows } = parseSpreadsheetData(buffer);

    if (rows.length === 0) {
      return { success: false, error: 'The uploaded spreadsheet contains no data rows.' };
    }

    // Call Claude on Vertex AI to dynamically map headers
    const proposedMapping = await proposeColumnMappingWithClaude(headers, rows);

    return JSON.parse(JSON.stringify({
      success: true,
      headers,
      sampleRows: rows.slice(0, 5),
      totalRows: rows.length,
      allRows: rows,
      proposedMapping,
    }));
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to parse spreadsheet' };
  }
}

export async function evaluateAndImportSpreadsheetAction(params: {
  rows: Record<string, any>[];
  mapping: ColumnMappingProposal;
}) {
  try {
    const rawRows = JSON.parse(JSON.stringify(params.rows || []));
    const { mapping } = params;

    // 1. Transform rows into RawScrapedTender using mapping
    const candidateTenders: RawScrapedTender[] = [];

    for (const row of rawRows) {
      const title = mapping.title ? String(row[mapping.title] || '').trim() : '';
      const entity = mapping.procuring_entity ? String(row[mapping.procuring_entity] || '').trim() : '';
      if (!title || !entity) continue;

      const ref = mapping.external_reference ? String(row[mapping.external_reference] || '').trim() : undefined;
      const deadlineStr = mapping.submission_deadline ? String(row[mapping.submission_deadline] || '').trim() : undefined;
      const publishStr = mapping.publish_date ? String(row[mapping.publish_date] || '').trim() : undefined;
      const category = mapping.category ? String(row[mapping.category] || '').trim() : 'General Procurement';
      const link = mapping.tender_document_url ? String(row[mapping.tender_document_url] || '').trim() : undefined;
      const description = mapping.description ? String(row[mapping.description] || '').trim() : undefined;
      const valStr = mapping.estimated_value ? String(row[mapping.estimated_value] || '').replace(/[^0-9.]/g, '') : '';

      // Date parsing
      let deadlineDate = new Date();
      if (deadlineStr) {
        const parsed = new Date(deadlineStr);
        if (!isNaN(parsed.getTime())) {
          deadlineDate = parsed;
        } else {
          deadlineDate.setDate(deadlineDate.getDate() + 14);
        }
      } else {
        deadlineDate.setDate(deadlineDate.getDate() + 14);
      }

      candidateTenders.push({
        external_reference: ref || `IMP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        title,
        procuring_entity: entity,
        category,
        description,
        publish_date: publishStr && !isNaN(new Date(publishStr).getTime()) ? new Date(publishStr).toISOString() : new Date().toISOString(),
        submission_deadline: deadlineDate.toISOString(),
        estimated_value: valStr ? parseFloat(valStr) : undefined,
        tender_document_url: link,
        source: 'manual',
        raw_scraped_data: { importedFromSpreadsheet: true, originalRow: row },
      });
    }

    if (candidateTenders.length === 0) {
      return { success: false, error: 'Could not extract valid tenders with the provided column mapping.' };
    }

    // 2. Run through AI relevance filter (Google Cloud Vertex AI Gemini)
    const evaluatedItems = await filterTenderRelevanceWithClaude(candidateTenders);

    const relevantTenders = evaluatedItems
      .filter((item) => item.isRelevant)
      .map((item) => item.tender);

    const skippedItems = evaluatedItems.filter((item) => !item.isRelevant);

    // 3. Bulk insert relevant tenders
    const { insertedCount } = await bulkInsertTenders(relevantTenders);

    revalidatePath('/discovery');
    revalidatePath('/tenders');

    return JSON.parse(JSON.stringify({
      success: true,
      totalProcessed: candidateTenders.length,
      importedCount: insertedCount,
      skippedCount: skippedItems.length,
      skippedItems,
    }));
  } catch (error: any) {
    return { success: false, error: error.message || 'Import processing failed' };
  }
}

export async function overrideAndImportSingleTenderAction(tender: RawScrapedTender) {
  try {
    const { insertedCount } = await bulkInsertTenders([tender]);
    revalidatePath('/discovery');
    revalidatePath('/tenders');
    return { success: true, inserted: insertedCount > 0 };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to override tender' };
  }
}

export async function deleteTenderAction(id: string) {
  try {
    await deleteTender(id);
    revalidatePath('/discovery');
    revalidatePath('/tenders');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete tender' };
  }
}
