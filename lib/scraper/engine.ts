import { ScrapeResult, ScrapeStrategy } from './types';
import { scrapeWithPuppeteer } from './puppeteer';

/**
 * Main Scraping Engine Orchestrator
 * Tries strategies in order until one succeeds
 */
export class ScrapingEngine {
  private strategyOrder: ScrapeStrategy[];

  constructor(config?: { strategyOrder?: ScrapeStrategy[] }) {
    this.strategyOrder = config?.strategyOrder || [
      ScrapeStrategy.PUPPETEER,
      ScrapeStrategy.STATIC,
    ];
  }

  async scrape(url: string, productId: string, competitorId: string, organizationId: string): Promise<ScrapeResult> {
    console.log(`[Engine] Starting scrape: ${url}`);
    
    for (const strategy of this.strategyOrder) {
      console.log(`[Engine] Trying strategy: ${strategy}`);
      
      let result: ScrapeResult;
      
      try {
        switch (strategy) {
          case ScrapeStrategy.PUPPETEER:
            result = await scrapeWithPuppeteer(url, productId, competitorId, organizationId);
            break;
          
          case ScrapeStrategy.FIRECRAWL:
            result = await this.scrapeWithFirecrawl(url, productId, competitorId, organizationId);
            break;
          
          case ScrapeStrategy.STATIC:
            result = await this.scrapeWithStatic(url, productId, competitorId, organizationId);
            break;
          
          default:
            result = {
              success: false,
              error: `Unknown strategy: ${strategy}`,
              strategy,
              duration: 0,
              productId,
              competitorId,
              competitorUrl: url,
            };
        }

        if (result.success) {
          console.log(`[Engine] ✅ Success with ${strategy} (${result.duration}ms)`);
          return result;
        }

        console.log(`[Engine] ❌ ${strategy} failed: ${result.error}`);
        
      } catch (err: any) {
        console.error(`[Engine] ${strategy} threw error:`, err?.message);
        result = {
          success: false,
          error: err?.message || 'Unknown error',
          strategy,
          duration: 0,
          productId,
          competitorId,
          competitorUrl: url,
        };
      }
    }

    return {
      success: false,
      error: 'All scraping strategies failed',
      strategy: 'all',
      duration: 0,
      productId,
      competitorId,
      competitorUrl: url,
    };
  }

  private async scrapeWithFirecrawl(url: string, productId: string, competitorId: string, organizationId: string): Promise<ScrapeResult> {
    const startTime = Date.now();
    
    if (!process.env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY === 'placeholder') {
      return {
        success: false,
        error: 'Firecrawl API key not configured',
        strategy: 'firecrawl',
        duration: Date.now() - startTime,
        productId,
        competitorId,
        competitorUrl: url,
      };
    }

    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'html'],
          onlyMainContent: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data?.data?.markdown || data?.data?.html || '';

      // Import here to avoid circular deps
      const { extractPriceWithRegex } = await import('./extract');
      const priceData = extractPriceWithRegex(content, url);

      return {
        success: priceData.confidence > 0,
        data: priceData,
        strategy: 'firecrawl',
        duration: Date.now() - startTime,
        productId,
        competitorId,
        competitorUrl: url,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Firecrawl failed',
        strategy: 'firecrawl',
        duration: Date.now() - startTime,
        productId,
        competitorId,
        competitorUrl: url,
      };
    }
  }

  private async scrapeWithStatic(url: string, productId: string, competitorId: string, organizationId: string): Promise<ScrapeResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const { extractPriceWithRegex } = await import('./extract');
      const priceData = extractPriceWithRegex(html, url);

      return {
        success: priceData.confidence > 0.3,
        data: priceData,
        strategy: 'static',
        duration: Date.now() - startTime,
        productId,
        competitorId,
        competitorUrl: url,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Static fetch failed',
        strategy: 'static',
        duration: Date.now() - startTime,
        productId,
        competitorId,
        competitorUrl: url,
      };
    }
  }
}

// Singleton instance
export const scrapingEngine = new ScrapingEngine();
