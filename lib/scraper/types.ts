export interface ScrapedPrice {
  price: number | null;
  originalPrice: number | null;
  discountPct: number | null;
  currency: string;
  inStock: boolean;
  productName: string;
  scrapedAt: string;
  competitorUrl: string;
  htmlSnippet?: string;
  confidence: number; // 0-1
}

export interface ScrapeJobData {
  /** @deprecated jobType is not used */
  jobType?: 'scrape';
  url: string;
  competitorId: string;
  productId: string;
  organizationId: string;
  retryCount: number;
}

export interface ScrapeResult {
  success: boolean;
  data?: ScrapedPrice;
  error?: string;
  strategy: string;
  duration: number;
  productId: string;
  competitorId: string;
  competitorUrl: string;
}

export enum ScrapeStrategy {
  PUPPETEER = 'puppeteer',
  PLAYWRIGHT = 'playwright',
  FIRECRAWL = 'firecrawl',
  STATIC = 'static',
}

export interface ScraperConfig {
  maxRetries: number;
  timeout: number;
  strategyOrder: ScrapeStrategy[];
  proxyUrl?: string;
  firecrawlApiKey?: string;
}
