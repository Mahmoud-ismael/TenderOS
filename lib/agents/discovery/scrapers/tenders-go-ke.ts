import * as cheerio from 'cheerio';
import type { RawScrapedTender, ScraperRunResult } from '../types';

function parseKenyanDate(dateStr: string | undefined): string {
  if (!dateStr) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 14); // 2 weeks default
    return fallback.toISOString();
  }

  const clean = dateStr.trim();
  // Try ISO or standard
  const direct = new Date(clean);
  if (!isNaN(direct.getTime())) {
    return direct.toISOString();
  }

  // Common Kenyan format: DD/MM/YYYY or DD-MM-YYYY HH:mm
  const ddmmyyyy = clean.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1;
    const year = parseInt(ddmmyyyy[3], 10);
    const hour = ddmmyyyy[4] ? parseInt(ddmmyyyy[4], 10) : 10; // Default 10:00 AM (EAT standard tender close)
    const minute = ddmmyyyy[5] ? parseInt(ddmmyyyy[5], 10) : 0;
    const parsed = new Date(Date.UTC(year, month, day, hour, minute));
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 14);
  return fallback.toISOString();
}

/**
 * Scraper for Kenya's Public Procurement Information Portal (tenders.go.ke / PPIP)
 */
export async function scrapeTendersGoKe(): Promise<ScraperRunResult> {
  const sourceName = 'tenders.go.ke';
  const url = 'https://tenders.go.ke/website/tenders/index';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 0 },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const tenders: RawScrapedTender[] = [];

    // Table rows or tender listing cards
    const rows = $('table tbody tr, .tender-card, .tender-item');

    rows.each((_, el) => {
      const row = $(el);
      const title =
        row.find('.tender-title, a.title, td:nth-child(2)').text().trim() ||
        row.find('h4, h5, a').first().text().trim();
      const entity =
        row.find('.procuring-entity, td:nth-child(3)').text().trim() ||
        row.find('.entity, .pe-name').text().trim() ||
        'Government of Kenya';
      const ref =
        row.find('.tender-number, td:nth-child(1)').text().trim() ||
        row.find('.ref-no').text().trim() ||
        `TND-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const deadlineRaw =
        row.find('.closing-date, td:nth-child(5)').text().trim() ||
        row.find('.deadline').text().trim();
      const category =
        row.find('.tender-category, td:nth-child(4)').text().trim() ||
        'Information & Communication Technology';
      const link =
        row.find('a[href*="tenders"], a[href*="download"]').attr('href') ||
        url;

      if (title && title.length > 5) {
        tenders.push({
          external_reference: ref,
          title,
          procuring_entity: entity,
          category,
          submission_deadline: parseKenyanDate(deadlineRaw),
          publish_date: new Date().toISOString(),
          tender_document_url: link.startsWith('http') ? link : `https://tenders.go.ke${link}`,
          source: 'ifmis',
          raw_scraped_data: {
            scrapedFrom: 'tenders.go.ke',
            rawHtmlSnippet: row.html()?.slice(0, 300),
            scrapedAt: new Date().toISOString(),
          },
        });
      }
    });

    return {
      source: sourceName,
      success: true,
      tenders,
    };
  } catch (error: any) {
    return {
      source: sourceName,
      success: false,
      tenders: [],
      error: error?.message || 'Failed to scrape tenders.go.ke',
    };
  }
}
