/**
 * Hybrid ML+AI Recommendation Engine
 *
 * Combines ALL signals into a unified price recommendation:
 * - Time series trends (momentum, volatility, direction)
 * - Price elasticity analysis
 * - Competitor price forecasts
 * - Cost margins
 * - Claude AI analysis (existing)
 *
 * Produces unified recommendation with suggestedPrice, confidenceScore,
 * expectedProfitChange, recommendedAction, and human-readable reasoning.
 */

import { db } from '@/db';
import { eq, and, gt } from 'drizzle-orm';
import { products, priceRecords, competitors } from '@/db/schema';
import type { InferSelectModel } from 'drizzle-orm';

import {
  analyzeTrend,
  TimePoint,
  linearRegression,
  detectTrendDirection,
  weightedTrend,
} from './timeseries';
import {
  calculateElasticity,
  estimateDemandImpact,
  findOptimalPrice,
  type PriceElasticityInput,
  type ElasticityResult,
} from './elasticity';
import {
  predictCompetitorPrice,
  type Prediction as PriceForecast,
} from './forecast';

type PriceRecordRow = InferSelectModel<typeof priceRecords>;

// ─── Types ─────────────────────────────────────────────────────────────

export type RecommendedAction = 'raise' | 'lower' | 'hold';

export interface MLRecommendation {
  suggestedPrice: number;
  confidenceScore: number; // 0-1
  expectedProfitChange: number; // %
  recommendedAction: RecommendedAction;
  reasoning: string;
  // Supporting data
  trendDirection: 'uptrend' | 'downtrend' | 'stable';
  trendStrength: number; // R² from regression
  elasticityCategory: 'elastic' | 'inelastic' | 'unit_elastic';
  currentMargin: number | null;
  competitorForecast?: PriceForecast;
  optimalPriceFromElasticity: number;
  mlSignals: MLSignalSummary;
  timestamp: Date;
}

export interface MLSignalSummary {
  trend: {
    direction: string;
    slope: number;
    rSquared: number;
    momentum: string;
  };
  volatility: {
    standardDeviation: number;
    meanDelta: number;
  };
  elasticity: {
    value: number;
    category: string;
    sensitivity: string;
  };
  marketPosition: {
    pctAboveMarket: number;
  };
  competitorForecast: {
    predictedPrice: number | null;
    trend: string | null;
    daysAhead: number;
  } | null;
}

// ─── Internal: fetch product + price history ───────────────────────────

/**
 * Fetch the product and its historical price records.
 */
async function fetchProductAndHistory(productId: string) {
  // Fetch the product
  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (productRows.length === 0) {
    return null;
  }
  const product = productRows[0];

  // Fetch price history for this product (all competitors)
  // Get up to 90 days of price records
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const priceHistory = await db
    .select()
    .from(priceRecords)
    .where(and(eq(priceRecords.productId, productId), gt(priceRecords.scrapedAt, cutoffDate)))
    .orderBy(priceRecords.scrapedAt);

  // Group price history by competitor
  const competitorIds = [
    ...new Set(priceHistory.filter((p) => p.competitorId).map((p) => p.competitorId!)),
  ];
  let competitorRows: typeof competitors.$inferSelect[] = [];
  if (competitorIds.length > 0) {
    competitorRows = await db
      .select()
      .from(competitors)
      .where(eq(competitors.id, competitorIds[0] as string));
  }

  return { product, priceHistory, competitors: competitorRows };
}

// ─── Internal: build ML signals ────────────────────────────────────────

/**
 * Build price history time points from scraped prices.
 */
function buildTimePoints(priceHistory: (typeof priceRecords.$inferSelect)[]): TimePoint[] {
  return priceHistory
    .filter((p) => p.price !== null)
    .map((p) => ({
      timestamp: p.scrapedAt ?? new Date(),
      value: parseFloat(p.price!),
    }));
}

/**
 * Build elasticity inputs from price history.
 */
function buildElasticityInput(
  priceHistory: (typeof priceRecords.$inferSelect)[],
  costPrice: string | null
): PriceElasticityInput {
  // Group by scrapedAt date to get daily market averages
  const dateMap = new Map<string, { prices: number[]; ourAvgPrice: number[] }>();

  for (const record of priceHistory) {
    if (!record.price || !record.scrapedAt) continue;
    const day = record.scrapedAt.toISOString().slice(0, 10);
    if (!dateMap.has(day)) dateMap.set(day, { prices: [], ourAvgPrice: [] });
    dateMap.get(day)!.prices.push(parseFloat(record.price));
  }

  const priceHistoryEntries = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => {
      const marketAvg = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
      return {
        ourPrice: marketAvg, // Use market average as proxy when we don't have "our price" per competitor record
        marketAvgPrice: marketAvg,
        scrapedAt: new Date(date),
      };
    });

  return {
    priceHistory: priceHistoryEntries,
    costPrice: costPrice ? parseFloat(costPrice) : null,
  };
}

// ─── Core Recommendation Generation ────────────────────────────────────

/**
 * Generate a hybrid ML-based recommendation for a product.
 * This is the main entry point — pure ML/heuristic without AI fallback.
 */
export function generateMLRecommendation(params: {
  currentPrice: number;
  costPrice: number | null;
  priceHistory: PriceRecordRow[];
  competitorPriceHistory: Map<string, { price: number; scrapedAt: Date }[]>;
  productName: string;
}): MLRecommendation {
  const { currentPrice, costPrice, priceHistory, competitorPriceHistory, productName } = params;

  // ── 1. Time series analysis ──────────────────────────────────────────
  const timePoints = buildTimePoints(priceHistory);
  const trendAnalysis = analyzeTrend(timePoints, 7);
  const trendDirection = trendAnalysis.trend.direction;
  const trendStrength = trendAnalysis.trend.rSquared;

  // ── 2. Elasticity analysis ───────────────────────────────────────────
  const elasticityInput = buildElasticityInput(priceHistory, costPrice ? String(costPrice) : null);
  const elasticity: ElasticityResult = calculateElasticity(elasticityInput);

  // ── 3. Competitor price forecast ─────────────────────────────────────
  const firstCompetitorId = [...competitorPriceHistory.keys()][0] ?? null;
  const competitorForecast: PriceForecast | null =
    firstCompetitorId && competitorPriceHistory.has(firstCompetitorId)
      ? predictCompetitorPrice(
          params.productName, // productId proxy
          firstCompetitorId,
          competitorPriceHistory.get(firstCompetitorId)!,
          7
        )
      : null;

  // ── 4. Find optimal price via elasticity ─────────────────────────────
  const optimalResult = findOptimalPrice(currentPrice, elasticity, {
    costPrice,
    minPrice: costPrice ? costPrice * 1.01 : currentPrice * 0.5,
    maxPrice: currentPrice * 2,
  });

  // ── 5. Market position ──────────────────────────────────────────────
  const latestPrices = priceHistory.slice(-10);
  const avgMarketPrice =
    latestPrices.length > 0
      ? latestPrices
          .filter((p) => p.price !== null)
          .reduce((sum, p) => sum + parseFloat(p.price!), 0) /
        latestPrices.filter((p) => p.price !== null).length
      : currentPrice;

  const marketPositionPct =
    avgMarketPrice > 0 ? ((currentPrice - avgMarketPrice) / avgMarketPrice) * 100 : 0;

  // ── 6. Demand impact of suggested price ──────────────────────────────
  const demandImpact = estimateDemandImpact(currentPrice, optimalResult.optimalPrice, elasticity);

  // ── 7. Cost margin ──────────────────────────────────────────────────
  const currentMargin =
    costPrice && costPrice > 0 ? ((currentPrice - costPrice) / currentPrice) * 100 : null;

  // ── 8. Determine suggested price ─────────────────────────────────────
  // Blend the elasticity-optimal price with heuristic signals
  let suggestedPrice = optimalResult.optimalPrice;

  // Downward pressure from competitor forecast
  if (competitorForecast && competitorForecast.predictedPrice > 0) {
    // If competitors are predicted to drop, move price down slightly
    if (competitorForecast.trend === 'falling') {
      suggestedPrice = suggestedPrice * 0.98;
    }
  }

  // Upward pressure from uptrend
  if (trendDirection === 'uptrend' && trendStrength > 0.5) {
    suggestedPrice = suggestedPrice * 1.01;
  }

  // Respect cost floor
  if (costPrice && costPrice > 0) {
    suggestedPrice = Math.max(suggestedPrice, costPrice * 1.01);
  }

  suggestedPrice = Math.round(suggestedPrice * 100) / 100;

  // ── 9. Determine action ──────────────────────────────────────────────
  const priceChangePct =
    currentPrice > 0 ? ((suggestedPrice - currentPrice) / currentPrice) * 100 : 0;
  const absChange = Math.abs(priceChangePct);

  let recommendedAction: RecommendedAction;
  if (absChange < 2) {
    recommendedAction = 'hold';
  } else if (priceChangePct > 0) {
    recommendedAction = 'raise';
  } else {
    recommendedAction = 'lower';
  }

  // ── 10. Calculate expected profit change ─────────────────────────────
  const expectedProfitChange = demandImpact.profitChangePct;

  // ── 11. Calculate confidence score ───────────────────────────────────
  let confidenceScore = 0.5;

  // Data quality: more data points = higher confidence
  confidenceScore += Math.min(0.15, timePoints.length / 100);

  // Trend strength: stronger trend = higher confidence
  confidenceScore += trendStrength * 0.15;

  // Competitor forecast confidence
  if (competitorForecast) {
    confidenceScore += competitorForecast.confidenceScore * 0.1;
  }

  // Elasticity validity
  confidenceScore += Math.abs(elasticity.elasticity) > 0.3 ? 0.05 : 0;

  // Cap at 0.95
  confidenceScore = Math.min(0.95, Math.max(0.1, confidenceScore));
  confidenceScore = Math.round(confidenceScore * 100) / 100;

  // ── 12. Build reasoning ──────────────────────────────────────────────
  const reasoning = buildReasoning({
    productName,
    trendDirection,
    trendStrength,
    momentum: trendAnalysis.momentum.direction,
    elasticity,
    currentMargin,
    marketPositionPct,
    competitorForecast,
    suggestedPrice,
    currentPrice,
    optimalPrice: optimalResult.optimalPrice,
    expectedProfitChange,
    recommendedAction,
  });

  // ── 13. Build signal summary ─────────────────────────────────────────
  const mlSignals: MLSignalSummary = {
    trend: {
      direction: trendDirection,
      slope: Math.round(trendAnalysis.trend.slope * 10000) / 10000,
      rSquared: Math.round(trendStrength * 100) / 100,
      momentum: trendAnalysis.momentum.direction,
    },
    volatility: {
      standardDeviation: Math.round(trendAnalysis.volatility.standardDeviation * 100) / 100,
      meanDelta: Math.round(trendAnalysis.volatility.meanDelta * 100) / 100,
    },
    elasticity: {
      value: Math.round(elasticity.elasticity * 100) / 100,
      category: elasticity.category,
      sensitivity: elasticity.sensitivity,
    },
    marketPosition: {
      pctAboveMarket: Math.round(marketPositionPct * 100) / 100,
    },
    competitorForecast: competitorForecast
      ? {
          predictedPrice: competitorForecast.predictedPrice || null,
          trend: competitorForecast.trend || null,
          daysAhead: competitorForecast.daysAhead,
        }
      : null,
  };

  return {
    suggestedPrice,
    confidenceScore,
    expectedProfitChange,
    recommendedAction,
    reasoning,
    trendDirection,
    trendStrength,
    elasticityCategory: elasticity.category,
    currentMargin,
    competitorForecast: competitorForecast ?? undefined,
    optimalPriceFromElasticity: optimalResult.optimalPrice,
    mlSignals,
    timestamp: new Date(),
  };
}

// ─── Public API (async, queries DB) ──────────────────────────────────────

/**
 * Full recommendation generator that queries the database.
 */
export async function generateRecommendation(
  productId: string,
  _organizationId?: string
): Promise<MLRecommendation | null> {
  const data = await fetchProductAndHistory(productId);
  if (!data) return null;

  const currentPrice = data.product.currentPrice ? parseFloat(data.product.currentPrice) : 0;
  const costPrice = data.product.costPrice ? parseFloat(data.product.costPrice) : null;

  // Group price history by competitor
  const competitorPriceHistory = new Map<
    string,
    { price: number; scrapedAt: Date }[]
  >();
  for (const record of data.priceHistory) {
    if (record.price && record.scrapedAt) {
      const key = record.competitorId ?? 'self';
      if (!competitorPriceHistory.has(key)) {
        competitorPriceHistory.set(key, []);
      }
      competitorPriceHistory.get(key)!.push({
        price: parseFloat(record.price),
        scrapedAt: record.scrapedAt,
      });
    }
  }

  return generateMLRecommendation({
    currentPrice,
    costPrice,
    priceHistory: data.priceHistory,
    competitorPriceHistory,
    productName: data.product.name,
  });
}

// ─── Reasoning Builder ─────────────────────────────────────────────────

interface ReasoningInput {
  productName: string;
  trendDirection: string;
  trendStrength: number;
  momentum: string;
  elasticity: ElasticityResult;
  currentMargin: number | null;
  marketPositionPct: number;
  competitorForecast: PriceForecast | null;
  suggestedPrice: number;
  currentPrice: number;
  optimalPrice: number;
  expectedProfitChange: number;
  recommendedAction: RecommendedAction;
}

function buildReasoning(input: ReasoningInput): string {
  const {
    productName,
    trendDirection,
    momentum,
    elasticity,
    currentMargin,
    marketPositionPct,
    competitorForecast,
    suggestedPrice,
    currentPrice,
    expectedProfitChange,
    recommendedAction,
  } = input;

  const parts: string[] = [];

  // Action headline
  const actionText =
    recommendedAction === 'raise'
      ? `Increase price to €${suggestedPrice.toFixed(2)}`
      : recommendedAction === 'lower'
        ? `Lower price to €${suggestedPrice.toFixed(2)}`
        : `Hold price at €${currentPrice.toFixed(2)}`;
  parts.push(actionText);

  // Trend
  parts.push(
    `Price trend is ${trendDirection} (${momentum}).`
  );

  // Elasticity
  parts.push(
    `Demand is ${elasticity.category} (elasticity=${elasticity.elasticity.toFixed(2)}), indicating ${
      elasticity.sensitivity
    } price sensitivity.`
  );

  // Market position
  if (Math.abs(marketPositionPct) > 2) {
    const dir = marketPositionPct > 0 ? 'above' : 'below';
    parts.push(`Currently positioned ${Math.abs(marketPositionPct).toFixed(1)}% ${dir} market average.`);
  }

  // Competitor forecast
  if (competitorForecast && competitorForecast.predictedPrice > 0) {
    parts.push(
      `Competitors predicted to ${competitorForecast.trend} to ${competitorForecast.predictedPrice.toFixed(2)} in ${competitorForecast.daysAhead} days.`
    );
  }

  // Profit
  parts.push(`Expected profit change: ${expectedProfitChange > 0 ? '+' : ''}${expectedProfitChange.toFixed(1)}%.`);

  // Margin warning
  if (currentMargin !== null && currentMargin < 10) {
    parts.push(
      `Warning: Current margin (${currentMargin.toFixed(1)}%) is very low.`
    );
  }

  return parts.join(' ');
}
