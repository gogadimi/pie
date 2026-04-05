import puppeteer from 'puppeteer';
import { ScrapedPrice, ScrapeResult } from './types';
import { extractPriceWithAI, extractPriceWithRegex } from './extract';
import { getRandomUserAgent, getRandomViewport, getRandomDelay, delay as sleep, STEALTH_CONFIG } from './stealth';

export async function scrapeWithPuppeteer(url: string, productId: string, competitorId: string, organizationId: string): Promise<ScrapeResult> {
  const startTime = Date.now();
  let browser: any = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    });

    const page = await browser.newPage();
    const ua = getRandomUserAgent();
    const viewport = getRandomViewport();

    // Stealth setup
    await page.setUserAgent(ua);
    await page.setViewport(viewport);
    await page.setExtraHTTPHeaders(STEALTH_CONFIG.extraHeaders);

    // Anti-WebDriver flag
    await page.evaluateOnNewDocument(() => {
      // @ts-ignore
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      // @ts-ignore
      window.chrome = { runtime: {} };
      // @ts-ignore
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      // @ts-ignore
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en', 'mk'] });
    });

    // Random delay before navigation
    await sleep(getRandomDelay(STEALTH_CONFIG.delays.afterNavigation[0], STEALTH_CONFIG.delays.afterNavigation[1]));

    // Navigate with timeout
    const response = await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    }).catch((err: Error) => {
      console.error(`[Puppeteer] Navigation timeout for ${url}:`, err.message);
      return null;
    });

    if (!response || !response.ok()) {
      return {
        success: false,
        error: `HTTP ${response?.status() || 'unknown'}`,
        strategy: 'puppeteer',
        duration: Date.now() - startTime,
        productId,
        competitorId,
        competitorUrl: url,
      };
    }

    // Get content
    const html = await page.content();
    const title = await page.title();
    
    console.log(`[Puppeteer] Scraped: ${title} from ${url}`);
    
    // Try AI extraction first
    let scrapedData: ScrapedPrice;
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'placeholder') {
      scrapedData = await extractPriceWithAI(html, url);
    } else {
      scrapedData = extractPriceWithRegex(html, url);
    }

    await browser.close();

    return {
      success: scrapedData.confidence > 0,
      data: scrapedData,
      strategy: 'puppeteer',
      duration: Date.now() - startTime,
      productId,
      competitorId,
      competitorUrl: url,
    };
  } catch (error: any) {
    console.error('[Puppeteer Error]', error?.message || error);
    if (browser) {
      try { await browser.close(); } catch {}
    }
    return {
      success: false,
      error: error?.message || 'Unknown error',
      strategy: 'puppeteer',
      duration: Date.now() - startTime,
      productId,
      competitorId,
      competitorUrl: url,
    };
  }
}
