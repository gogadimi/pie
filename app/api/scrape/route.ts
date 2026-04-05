/**
 * API route to trigger scraping for a competitor URL
 * POST /api/scrape
 */
import { NextRequest, NextResponse } from 'next/server';
import { scrapingEngine } from '@/lib/scraper/engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, competitorId, productId, organizationId } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    console.log(`[API/scrape] Triggering scrape for: ${url}`);

    const result = await scrapingEngine.scrape(
      url,
      productId || '',
      competitorId || '',
      organizationId || ''
    );

    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        data: result.data,
        strategy: result.strategy,
        duration: result.duration,
      });
    }

    return NextResponse.json({
      success: false,
      error: result.error,
      strategy: result.strategy,
    }, { status: 422 });
  } catch (error: any) {
    console.error('[API/scrape Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Scraping API is running',
    endpoints: {
      POST: '/api/scrape',
      body: { url: 'string', competitorId: 'string', productId: 'string' },
    },
  });
}
