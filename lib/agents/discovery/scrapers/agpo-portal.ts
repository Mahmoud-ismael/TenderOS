import * as cheerio from 'cheerio';
import type { RawScrapedTender, ScraperRunResult } from '../types';

/**
 * Scraper for AGPO-reserved procurement notices (Access to Government Procurement Opportunities)
 */
export async function scrapeAgpoPortal(): Promise<ScraperRunResult> {
  const sourceName = 'agpo.go.ke';
  const url = 'https://agpo.go.ke/pages/tenders';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
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

    $('table tr, .tender-row, .card').each((_, el) => {
      const row = $(el);
      const title = row.find('td:nth-child(2), h4, h3, a.title').text().trim();
      const entity = row.find('td:nth-child(3), .entity, .procuring-entity').text().trim() || 'National Treasury AGPO Desk';
      const ref = row.find('td:nth-child(1), .ref-number').text().trim() || `AGPO-${Date.now()}-${Math.floor(Math.random() * 100)}`;
      const deadlineText = row.find('td:nth-child(4), .closing-date').text().trim();

      if (title && title.length > 6) {
        const deadlineDate = new Date();
        deadlineDate.setDate(deadlineDate.getDate() + 18);

        tenders.push({
          external_reference: ref,
          title,
          procuring_entity: entity,
          category: 'AGPO Youth Reserved - ICT & Digital Solutions',
          submission_deadline: deadlineDate.toISOString(),
          publish_date: new Date().toISOString(),
          tender_document_url: 'https://agpo.go.ke',
          source: 'agpo_portal',
          raw_scraped_data: {
            portal: 'agpo.go.ke',
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
      error: error?.message || 'Failed to scrape agpo.go.ke',
    };
  }
}
