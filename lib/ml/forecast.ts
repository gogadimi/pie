/**
 * Competitor Price Forecast Module
 * 
 * Predicts future competitor prices using a weighted combination of:
 * - Linear extrapolation of recent trends
 * - EMA-based prediction
 * - Mean reversion to historical average
 * 
 * Includes seasonal pattern detection and confidence intervals.
 */

import { linearRegression, simpleMovingAverage, exponentialMovingAverage } from './timeseries';

// ─── Types ─────────────────────────────────────────────────────────────

export interface ForecastInput {
  /** Historical prices for a specific competitor-product pair */
  prices: { price: number; scrapedAt: Date }[];
  /** Optional: other competitors' prices for market context */
  marketPrices?: { averagePrice: number; scrapedAt: Date }[];
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence: number; // e.g., 0.95 for 95% CI
}

export interface SeasonalPattern {
  detected: boolean;
  periodDays: number;
  strength: number; // 0-1
  adjustment: number; // Price adjustment for the forecasted day
}

export interface Prediction {
  predictedPrice: number;
  confidenceScore: number; // 0-1
  confidenceInterval: ConfidenceInterval;
  seasonalPattern: SeasonalPattern;
  forecastMethod: string;
  trend: 'rising' | 'falling' | 'stable';
  daysAhead: number;
}

// ─── Seasonality Detection ─────────────────────────────────────────────

/**
 * Detect weekly patterns in price data based on day-of-week.
 */
export function detectSeasonality(
  prices: { price: number; scrapedAt: Date }[]
): SeasonalPattern {
  if (prices.length < 14) {
    return { detected: false, periodDays: 7, strength: 0, adjustment: 0 };
  }

  // Group prices by day of week
  const dayGroups: Map<number, number[]> = new Map();
  for (const p of prices) {
    const dayOfWeek = p.scrapedAt.getDay(); // 0=Sun, 6=Sat
    if (!dayGroups.has(dayOfWeek)) dayGroups.set(dayOfWeek, []);
    dayGroups.get(dayOfWeek)!.push(p.price);
  }

  // Calculate mean per day
  const dayMeans: Map<number, number> = new Map();
  for (const [day, vals] of dayGroups) {
    dayMeans.set(day, vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  const overallMean = prices.reduce((a, p) => a + p.price, 0) / prices.length;

  // Check if day-of-week explains significant variance
  let betweenVariance = 0;
  for (const [day, mean] of dayMeans) {
    betweenVariance += (mean - overallMean) ** 2;
  }

  let totalVariance = 0;
  for (const p of prices) {
    totalVariance += (p.price - overallMean) ** 2;
  }

  const strength = totalVariance > 0 ? betweenVariance / totalVariance : 0;
  const detected = strength > 0.1; // At least 10% of variance explained

  return {
    detected,
    periodDays: 7,
    strength: Math.min(1, strength * 5), // Normalize to 0-1
    adjustment: 0, // Set by forecast function for specific target day
  };
}

/**
 * Get seasonal adjustment for a specific day-of-week.
 */
function getSeasonalAdjustment(
  prices: { price: number; scrapedAt: Date }[],
  targetDayOfWeek: number
): number {
  const dayPrices: number[] = [];
  const allPrices: number[] = [];
  
  for (const p of prices) {
    allPrices.push(p.price);
    if (p.scrapedAt.getDay() === targetDayOfWeek) {
      dayPrices.push(p.price);
    }
  }

  if (dayPrices.length < 2) return 0;

  const dayMean = dayPrices.reduce((a, b) => a + b, 0) / dayPrices.length;
  const overallMean = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;

  return overallMean > 0 ? ((dayMean - overallMean) / overallMean) * 100 : 0;
}

// ─── Forecast Methods ──────────────────────────────────────────────────

/**
 * Predict using linear extrapolation.
 * Extends the recent trend line forward.
 */
function linearExtrapolation(prices: number[], daysAhead: number): { prediction: number; weight: number } {
  if (prices.length < 2) {
    return { prediction: prices[0] ?? 0, weight: 0.3 };
  }

  const regression = linearRegression(prices);
  const lastIdx = prices.length - 1;

  // Estimate how many "periods" daysAhead represents relative to data
  const periodsAhead = Math.max(1, daysAhead);
  const prediction = regression.slope * (lastIdx + periodsAhead) + regression.intercept;

  // Weight decreases with forecast distance and poor fit
  const weight = 0.5 * regression.rSquared * Math.max(0.1, 1 - daysAhead / 30);

  return { prediction, weight };
}

/**
 * Predict using EMA continuation.
 */
function emaPrediction(prices: number[], daysAhead: number): { prediction: number; weight: number } {
  if (prices.length < 3) {
    return { prediction: prices[prices.length - 1] ?? 0, weight: 0.25 };
  }

  const ema = exponentialMovingAverage(prices, Math.min(7, prices.length));
  const lastEma = ema.filter(v => v !== null).pop() ?? prices[prices.length - 1];

  // Get rate of change from last few EMA values
  const validEma = ema.filter(v => v !== null) as number[];
  const avgChange = validEma.length > 1
    ? (validEma[validEma.length - 1] - validEma[validEma.length - 2])
    : 0;

  const prediction = lastEma + avgChange * Math.max(1, daysAhead);
  const weight = 0.35 * Math.max(0.1, 1 - daysAhead / 20);

  return { prediction, weight };
}

/**
 * Predict using mean reversion.
 * Prices tend to pull back toward historical average.
 */
function meanReversion(prices: number[], daysAhead: number): { prediction: number; weight: number } {
  if (prices.length < 2) {
    return { prediction: prices[0] ?? 0, weight: 0.2 };
  }

  const historicalAvg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const currentPrice = prices[prices.length - 1];

  // Recent trend component (short-term)
  const recentLength = Math.min(5, prices.length);
  const recentPrices = prices.slice(-recentLength);
  const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentLength;

  // Pull toward mean: strength increases with distance from mean
  const distanceFromMean = currentPrice - historicalAvg;
  const reversionStrength = Math.min(0.5, 0.1 + 0.05 * daysAhead);

  // Blend recent trend with mean reversion
  const trendComponent = currentPrice + (prices.length >= 2 ? (recentAvg - prices[prices.length - 2]) * daysAhead * 0.5 : 0);
  const meanComponent = historicalAvg;

  const prediction = trendComponent * (1 - reversionStrength) + meanComponent * reversionStrength;
  const weight = 0.25 * Math.max(0.1, 1 - daysAhead / 40);

  return { prediction, weight };
}

// ─── Confidence Interval ───────────────────────────────────────────────

/**
 * Calculate confidence interval based on historical variance and forecast horizon.
 */
function calculateConfidenceInterval(
  prices: number[],
  prediction: number,
  daysAhead: number
): ConfidenceInterval {
  if (prices.length < 2) {
    return { lower: prediction, upper: prediction, confidence: 0.1 };
  }

  const n = prices.length;
  const mean = prices.reduce((a, b) => a + b, 0) / n;
  const variance = prices.reduce((s, p) => s + (p - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  // Confidence decreases with forecast horizon
  const confidenceMultiplier = 1 + (daysAhead / 7) * 0.3; // Wider interval for further forecasts
  const margin = stdDev * confidenceMultiplier * 1.96; // ~95% CI

  return {
    lower: Math.round((prediction - margin) * 100) / 100,
    upper: Math.round((prediction + margin) * 100) / 100,
    confidence: Math.max(0.1, 1 - daysAhead / 30),
  };
}

// ─── Main Forecast Function ────────────────────────────────────────────

/**
 * Predict competitor price at a future date.
 * Uses weighted combination of linear extrapolation, EMA, and mean reversion.
 */
export function predictCompetitorPrice(
  productId: string,
  competitorId: string,
  prices: { price: number; scrapedAt: Date }[],
  daysAhead: number = 7
): Prediction {
  if (prices.length === 0) {
    return {
      predictedPrice: 0,
      confidenceScore: 0,
      confidenceInterval: { lower: 0, upper: 0, confidence: 0 },
      seasonalPattern: { detected: false, periodDays: 7, strength: 0, adjustment: 0 },
      forecastMethod: 'no_data',
      trend: 'stable',
      daysAhead,
    };
  }

  // Sort by date
  const sorted = [...prices].sort((a, b) =>
    a.scrapedAt.getTime() - b.scrapedAt.getTime()
  );
  const values = sorted.map(p => p.price);

  // Get all three predictions
  const linear = linearExtrapolation(values, daysAhead);
  const ema = emaPrediction(values, daysAhead);
  const meanRev = meanReversion(values, daysAhead);

  // Normalize weights
  const totalWeight = linear.weight + ema.weight + meanRev.weight;
  const wLinear = totalWeight > 0 ? linear.weight / totalWeight : 0.33;
  const wEma = totalWeight > 0 ? ema.weight / totalWeight : 0.33;
  const wMeanRev = totalWeight > 0 ? meanRev.weight / totalWeight : 0.34;

  // Weighted combination
  const predictedPrice = wLinear * linear.prediction + wEma * ema.prediction + wMeanRev * meanRev.prediction;

  // Seasonal adjustment
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);
  const seasonalAdjustPct = getSeasonalAdjustment(sorted, targetDate.getDay());
  const adjustedPrediction = predictedPrice * (1 + seasonalAdjustPct / 100);

  // Confidence
  const sortedPrices = [...sorted];
  const ci = calculateConfidenceInterval(values, adjustedPrediction, daysAhead);
  const seasonal = detectSeasonality(sortedPrices);
  seasonal.adjustment = seasonalAdjustPct;

  // Trend
  let trend: 'rising' | 'falling' | 'stable';
  const recentValues = values.slice(-5);
  if (recentValues.length >= 2) {
    const recentChange = (recentValues[recentValues.length - 1] - recentValues[0]) / recentValues[0];
    if (recentChange > 0.02) trend = 'rising';
    else if (recentChange < -0.02) trend = 'falling';
    else trend = 'stable';
  } else {
    trend = 'stable';
  }

  // Overall confidence score
  const dataQuality = Math.min(1, values.length / 10);
  const fitQuality = totalWeight / 1.0;
  const timePenalty = Math.max(0.3, 1 - daysAhead / 30);
  const confidenceScore = Math.round(dataQuality * fitQuality * timePenalty * 100) / 100;

  // Determine dominant method
  let dominantMethod: string;
  if (wLinear >= wEma && wLinear >= wMeanRev) dominantMethod = 'linear_extrapolation';
  else if (wEma >= wLinear && wEma >= wMeanRev) dominantMethod = 'ema_continuation';
  else dominantMethod = 'mean_reversion';

  return {
    predictedPrice: Math.round(Math.max(0, adjustedPrediction) * 100) / 100,
    confidenceScore,
    confidenceInterval: ci,
    seasonalPattern: seasonal,
    forecastMethod: `${dominantMethod} (linear=${(wLinear * 100).toFixed(0)}%, ema=${(wEma * 100).toFixed(0)}%, mean-reversion=${(wMeanRev * 100).toFixed(0)}%)`,
    trend,
    daysAhead,
  };
}
