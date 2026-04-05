import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, and, gt, desc } from 'drizzle-orm';
import { products, priceRecords, competitors } from '@/db/schema';
import {
  analyzeTrend,
  TimePoint,
  simpleMovingAverage,
  exponentialMovingAverage,
} from '@/lib/ml/timeseries';
import {
  calculateElasticity,
  estimateDemandImpact,
  findOptimalPrice,
} from '@/lib/ml/elasticity';
import { predictCompetitorPrice } from '@/lib/ml/forecast';

/** Internal helper: build ML analytics for a product */
async function getProductAnalytics(productId: string) {
  // Fetch product
  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (productRows.length === 0) return null;

  const product = productRows[0];
  const currentPrice = product.currentPrice ? parseFloat(product.currentPrice) : 0;
  const costPrice = product.costPrice ? parseFloat(product.costPrice) : null;

  // Get price history (90 days)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const priceHistory = await db
    .select()
    .from(priceRecords)
    .where(and(eq(priceRecords.productId, productId), gt(priceRecords.scrapedAt, cutoffDate)))
    .orderBy(priceRecords.scrapedAt);

  // Get distinct competitor IDs
  const compIds = [
    ...new Set(priceHistory.filter((p) => p.competitorId).map((p) => p.competitorId!)),
  ];

  // ── 1. Time Series Analysis ──────────────────────────────────────────
  const timePoints: TimePoint[] = priceHistory
    .filter((p) => p.price !== null)
    .map((p) => ({
      timestamp: p.scrapedAt ?? new Date(),
      value: parseFloat(p.price!),
    }));

  const trendAnalysis = analyzeTrend(timePoints, 7);

  // Build SMA/EMA values for visualization
  const prices = timePoints.map((tp) => tp.value);
  const smaValues = simpleMovingAverage(prices, 7);
  const emaValues = exponentialMovingAverage(prices, 7);

  const priceHistoryViz = prices.map((p: number, i: number) => ({
    date: timePoints[i]?.timestamp ?? new Date(),
    price: p,
    sma: smaValues[i] as number | null,
    ema: emaValues[i] as number | null,
  }));

  // ── 2. Elasticity ────────────────────────────────────────────────────
  // Build elasticity input
  const dateMap = new Map<string, number[]>();
  for (const record of priceHistory) {
    if (!record.price || !record.scrapedAt) continue;
    const day = record.scrapedAt.toISOString().slice(0, 10);
    if (!dateMap.has(day)) dateMap.set(day, []);
    dateMap.get(day)!.push(parseFloat(record.price));
  }

  const elasticityInput = {
    priceHistory: Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        ourPrice: vals.reduce((s, v) => s + v, 0) / vals.length,
        marketAvgPrice: vals.reduce((s, v) => s + v, 0) / vals.length,
        scrapedAt: new Date(date),
      })),
    costPrice: costPrice ? parseFloat(String(costPrice)) : null,
  };

  const elasticity = calculateElasticity(elasticityInput);

  // Optimal price
  const optimalResult = currentPrice > 0
    ? findOptimalPrice(currentPrice, elasticity, { costPrice, minPrice: costPrice ? costPrice * 1.01 : currentPrice * 0.5 })
    : null;

  // Demand impact
  const demandImpact = optimalResult
    ? estimateDemandImpact(currentPrice, optimalResult.optimalPrice, elasticity)
    : null;

  // ── 3. Competitor Forecasts ──────────────────────────────────────────
  const competitorForecasts: Array<{
    competitorId: string;
    competitorName: string | null;
    currentPrice: number;
    forecast: Awaited<ReturnType<typeof predictCompetitorPrice>>;
  }> = [];

  // Group by competitor
  const compPriceMap = new Map<string, { price: number; scrapedAt: Date }[]>();
  for (const record of priceHistory) {
    if (record.price && record.scrapedAt && record.competitorId) {
      const key = record.competitorId;
      if (!compPriceMap.has(key)) compPriceMap.set(key, []);
      compPriceMap.get(key)!.push({
        price: parseFloat(record.price),
        scrapedAt: record.scrapedAt,
      });
    }
  }

  for (const [compId, records] of compPriceMap) {
    const forecast = predictCompetitorPrice(productId, compId, records, 7);
    const currentCompPrice = records.length > 0 ? records[records.length - 1].price : 0;

    competitorForecasts.push({
      competitorId: compId,
      competitorName: null,
      currentPrice: currentCompPrice,
      forecast,
    });
  }

  // Fetch competitor names
  if (compIds.length > 0) {
    const compRows = await db
      .select({ id: competitors.id, name: competitors.name })
      .from(competitors)
      .where(eq(competitors.id, compIds[0] as string));

    const compMap = new Map(compRows.map((c) => [c.id, c.name]));
    for (const f of competitorForecasts) {
      if (compMap.has(f.competitorId)) {
        f.competitorName = compMap.get(f.competitorId) ?? null;
      }
    }
  }

  // ── 4. Market Position ───────────────────────────────────────────────
  const marketAvg =
    prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : currentPrice;

  return {
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku,
      currentPrice,
      costPrice,
      currency: product.currency,
    },
    trend: {
      direction: trendAnalysis.trend.direction,
      slope: Math.round(trendAnalysis.trend.slope * 10000) / 10000,
      rSquared: Math.round(trendAnalysis.trend.rSquared * 100) / 100,
      momentum: trendAnalysis.momentum.direction,
      volatility: {
        stdDev: Math.round(trendAnalysis.volatility.standardDeviation * 100) / 100,
        meanDelta: Math.round(trendAnalysis.volatility.meanDelta * 100) / 100,
      },
    },
    elasticity: {
      value: Math.round(elasticity.elasticity * 100) / 100,
      category: elasticity.category,
      sensitivity: elasticity.sensitivity,
      marketPositionPct: Math.round(elasticity.marketPositionPct * 100) / 100,
    },
    optimalPrice: optimalResult
      ? {
          price: optimalResult.optimalPrice,
          revenueChangePct: optimalResult.expectedRevenueChangePct,
          profitChangePct: optimalResult.expectedProfitChangePct,
        }
      : null,
    demandImpact: demandImpact
      ? {
          demandChangePct: demandImpact.demandChangePct,
          revenueChangePct: demandImpact.revenueChangePct,
          profitChangePct: demandImpact.profitChangePct,
          direction: demandImpact.direction,
        }
      : null,
    competitorForecasts,
    priceHistory: priceHistoryViz,
    summary: {
      dataPoints: timePoints.length,
      timeRangeDays: Math.round(trendAnalysis.timeRange * 10) / 10,
      marketAvgPrice: Math.round(marketAvg * 100) / 100,
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'productId query parameter is required' }, { status: 400 });
    }

    const analytics = await getProductAnalytics(productId);

    if (!analytics) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: analytics });
  } catch (error: any) {
    console.error('ML Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
