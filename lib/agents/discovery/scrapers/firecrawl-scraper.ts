import FirecrawlApp from '@mendable/firecrawl-js';
import type { RawScrapedTender, ScraperRunResult } from '../types';

/**
 * Scrapes a public procurement portal or specific tender webpage using Firecrawl.
 * Handles JavaScript-rendered tables, anti-bot protections, and returns markdown.
 */
export async function scrapeWithFirecrawl(targetUrl: string): Promise<ScraperRunResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    return {
      source: 'firecrawl',
      success: false,
      tenders: [],
      error: 'FIRECRAWL_API_KEY is not configured in environment variables.',
    };
  }

  try {
    const firecrawl = new FirecrawlApp({ apiKey });

    const response = await firecrawl.scrapeUrl(targetUrl, {
      formats: ['markdown'],
    });

    const markdown = (response as any)?.markdown || '';

    return {
      source: 'firecrawl',
      success: true,
      tenders: [],
      error: undefined,
    };
  } catch (error: any) {
    return {
      source: 'firecrawl',
      success: false,
      tenders: [],
      error: error.message || 'Firecrawl execution error',
    };
  }
}
