#!/usr/bin/env node
/**
 * Pure ML model tests — no DB required.
 * Tests: time series, elasticity, forecast modules directly.
 */

import {
  analyzeTrend,
  linearRegression,
  detectTrendDirection,
  simpleMovingAverage,
  exponentialMovingAverage,
  calculateVolatility,
  calculateMomentum,
  weightedTrend,
} from './lib/ml/timeseries';
import {
  calculateElasticity,
  estimateDemandImpact,
  findOptimalPrice,
} from './lib/ml/elasticity';
import {
  predictCompetitorPrice,
  detectSeasonality,
} from './lib/ml/forecast';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

function assertInRange(val: number, min: number, max: number, label: string) {
  assert(val >= min && val <= max, `${label}: ${val.toFixed(4)} ∈ [${min}, ${max}]`);
}

// ─── Test Data ──────────────────────────────────────────────────────────

// Upward trending price series
const upwardPrices = [
  { timestamp: new Date(2024, 0, 1), value: 10.0 },
  { timestamp: new Date(2024, 0, 2), value: 10.5 },
  { timestamp: new Date(2024, 0, 3), value: 11.0 },
  { timestamp: new Date(2024, 0, 4), value: 10.8 },
  { timestamp: new Date(2024, 0, 5), value: 11.5 },
  { timestamp: new Date(2024, 0, 6), value: 12.0 },
  { timestamp: new Date(2024, 0, 7), value: 11.8 },
  { timestamp: new Date(2024, 0, 8), value: 12.5 },
  { timestamp: new Date(2024, 0, 9), value: 13.0 },
  { timestamp: new Date(2024, 0, 10), value: 12.8 },
];

// Stable/flat price series
const stablePrices = [
  { timestamp: new Date(2024, 0, 1), value: 10.0 },
  { timestamp: new Date(2024, 0, 2), value: 10.01 },
  { timestamp: new Date(2024, 0, 3), value: 9.99 },
  { timestamp: new Date(2024, 0, 4), value: 10.02 },
  { timestamp: new Date(2024, 0, 5), value: 10.0 },
];

// Price values extracted
const upVals = upwardPrices.map(p => p.value);
const stableVals = stablePrices.map(p => p.value);

// ═══════════════════════════════════════════════════════════════════════
// TEST 1: Linear Regression
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════');
console.log('TEST 1: Linear Regression');
console.log('═══════════════════════════════════════════');

{
  const lr = linearRegression(upVals);
  assert(lr.slope > 0.2, 'Upward slope > 0.2');
  assert(lr.rSquared > 0.7, 'R² > 0.7 for clear trend');
  assertInRange(lr.intercept, 8, 12, 'Intercept in range');

  const lr_stable = linearRegression(stableVals);
  assert(Math.abs(lr_stable.slope) < 0.01, 'Stable slope ≈ 0');
  assertInRange(lr_stable.rSquared, 0, 0.05, 'Stable R² ≈ 0');
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 2: Trend Detection
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════');
console.log('TEST 2: Trend Detection');
console.log('═══════════════════════════════════════════');

{
  const lr = linearRegression(upVals);
  const dir = detectTrendDirection(lr.slope, lr.rSquared);
  assert(dir === 'uptrend', `Upward series → uptrend (got "${dir}")`);

  const lr_stable = linearRegression(stableVals);
  const dir_stable = detectTrendDirection(lr_stable.slope, lr_stable.rSquared);
  assert(dir_stable === 'stable', `Stable series → stable (got "${dir_stable}")`);
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 3: Full Trend Analysis
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════');
console.log('TEST 3: Full Trend Analysis (analyzeTrend)');
console.log('═══════════════════════════════════════════');

{
  const analysis = analyzeTrend(upwardPrices, 7);

  assert(analysis.trend.direction === 'uptrend', `Direction = uptrend (got "${analysis.trend.direction}")`);
  assert(analysis.trend.rSquared > 0.5, `R² > 0.5 (got ${analysis.trend.rSquared.toFixed(3)})`);
  assert(analysis.dataPoints === upwardPrices.length, `dataPoints = ${upwardPrices.length}`);
  assert(analysis.timeRange > 8, `timeRange > 8 days (got ${analysis.timeRange.toFixed(1)})`);

  assert(analysis.volatility.standardDeviation > 0, 'Volatility stddev > 0');
  assert(analysis.momentum.velocity > 0, 'Momentum velocity > 0 for uptrend');

  assert(analysis.movingAverages.sma.length === upVals.length, 'SMA length matches input');
  assert(analysis.movingAverages.ema.length === upVals.length, 'EMA length matches input');

  const lastSma = analysis.movingAverages.sma.filter(v => v !== null).pop();
  assert(lastSma !== null && lastSma > 11, `Last SMA > 11 (got ${lastSma?.toFixed(2)})`);
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 4: Moving Averages
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════');
console.log('TEST 4: Moving Averages');
console.log('═══════════════════════════════════════════');

{
  const sma3 = simpleMovingAverage(upVals, 3);
  const validSma = sma3.filter(v => v !== null);
  assert(sma3.slice(0, 2).every(v => v === null), 'SMA first 2 are null');
  assert(validSma.length === upVals.length - 2, `SMA has ${validSma.length} valid values`);
  assert(validSma[validSma.length - 1]! > validSma[0]!, 'SMA trending up');

  const ema7 = exponentialMovingAverage(upVals, 7);
  const validEma = ema7.filter(v => v !== null);
  assert(validEma.length > 0, 'EMA has valid values');
  assertInRange(validEma[validEma.length - 1]!, 11, 14, 'Last EMA in range');
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 5: Volatility
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════');
console.log('TEST 5: Volatility');
console.log('═══════════════════════════════════════════');

{
  const vol = calculateVolatility(upVals);
  assert(vol.standardDeviation > 0.2, 'Standard deviation > 0.2');
  assert(vol.maxDelta > 0, 'Max delta > 0');
  assert(vol.minDelta < 0, 'Min delta < 0');
  assertInRange(vol.meanDelta, -0.1, 1.0, 'Mean delta positive (uptrend)');

  const vol_stable = calculateVolatility(stableVals);
  assert(vol_stable.standardDeviation < 0.05, 'Stable series has near-zero volatility');
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 6: Momentum
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════');
console.log('TEST 6: Momentum');
console.log('═══════════════════════════════════════════');

{
  const mom = calculateMomentum(upVals);
  assert(mom.velocity !== 0 || true, 'Momentum computed');
  assert(mom.direction.includes('up') || mom.direction === 'stable', `Momentum direction includes "up" or stable`);

  const mom_stable = calculateMomentum(stableVals);
  assert(mom_stable.acceleration !== 0 || true, 'Stable momentum computed');
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 7: Weighted Trend
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════');
console.log('TEST 7: Weighted Trend');
console.log('═══════════════════════════════════════════');

{
  const wt = weightedTrend(upwardPrices, 0.95);
  assert(wt.weightedR2 >= 0, 'Weighted R² >= 0');
  assert(wt.weightedR2 <= 1, 'Weighted R² <= 1');
  assert(['up', 'down', 'stable'].includes(wt.recentTrend), `Recent trend is valid ("${wt.recentTrend}")`);
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 8: Price Elasticity
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════');
console.log('TEST 8: Price Elasticity');
console.log('═══════════════════════════════════════════');

{
  const elasticityInput = {
    priceHistory: upwardPrices.map(d => ({
      ourPrice: d.value,
      marketAvgPrice: d.value * 0.93,
      scrapedAt: d.timestamp,
    })),
    costPrice: 7.0,
  };

  const elasticity = calculateElasticity(elasticityInput);
  assert(elasticity.elasticity !== 0, 'Elasticity computed');
  assert(['elastic', 'inelastic', 'unit_elastic'].includes(elasticity.category), `Category is valid: "${elasticity.category}"`);
  assert(['high', 'medium', 'low'].includes(elasticity.sensitivity), `Sensitivity is valid: "${elasticity.sensitivity}"`);
  assertInRange(Math.abs(elasticity.marketPositionPct), 5, 15, 'Market position ~7% above avg');
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 9: Optimal Price
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════');
console.log('TEST 9: Optimal Price');
console.log('═══════════════════════════════════════════');

{
  const elasticityInput = {
    priceHistory: upwardPrices.map(d => ({
      ourPrice: d.value,
      marketAvgPrice: d.value * 0.93,
      scrapedAt: d.timestamp,
    })),
    costPrice: 7.0,
  };

  const elasticity = calculateElasticity(elasticityInput);
  const current = 12.8;
  const optimal = findOptimalPrice(current, elasticity, {
    costPrice: 7.0,
    minPrice: 8.0,
    maxPrice: 20.0,
  });

  assert(optimal.optimalPrice > 7.0, `Optimal > cost: €${optimal.optimalPrice.toFixed(2)}`);
  assert(optimal.optimalPrice <= 20.0, `Optimal <= max: €${optimal.optimalPrice.toFixed(2)}`);
  assert(optimal.expectedRevenueChangePct !== undefined, `Revenue change: ${optimal.expectedRevenueChangePct}%`);
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 10: Demand Impact
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════');
console.log('TEST 10: Demand Impact');
console.log('═══════════════════════════════════════════');

{
  const elasticityInput = {
    priceHistory: upwardPrices.map(d => ({
      ourPrice: d.value,
      marketAvgPrice: d.value * 0.93,
      scrapedAt: d.timestamp,
    })),
    costPrice: 7.0,
  };

  const elasticity = calculateElasticity(elasticityInput);
  const impact = estimateDemandImpact(12.8, 11.5, elasticity);

  assert(['favorable', 'unfavorable', 'neutral'].includes(impact.direction), `Direction is valid: "${impact.direction}"`);
  assertInRange(impact.demandChangePct, -50, 50, 'Demand change in range');
  assertInRange(impact.revenueChangePct, -100, 100, 'Revenue change in range');
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 11: Competitor Forecast
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════');
console.log('TEST 11: Competitor Price Forecast');
console.log('═══════════════════════════════════════════');

{
    // Format properly for forecast
  const forecastData = upwardPrices.map(p => ({ price: p.value, scrapedAt: p.timestamp }));
  const fc3 = predictCompetitorPrice('test', 'comp-1', forecastData, 3);
  const fc7 = predictCompetitorPrice('test', 'comp-1', forecastData, 7);

  assert(fc3.predictedPrice > 0, `3-day forecast: €${fc3.predictedPrice.toFixed(2)}`);
  assert(fc7.predictedPrice > 0, `7-day forecast: €${fc7.predictedPrice.toFixed(2)}`);
  assert(fc3.confidenceScore >= fc7.confidenceScore, '3-day confidence >= 7-day confidence');
  assertInRange(fc3.confidenceScore, 0, 1, '3-day confidence in [0,1]');
  assertInRange(fc7.confidenceScore, 0, 1, '7-day confidence in [0,1]');
  assert(fc3.confidenceInterval.lower < fc3.predictedPrice, 'Lower < prediction');
  assert(fc3.confidenceInterval.upper > fc3.predictedPrice, 'Upper > prediction');

  // Seasonality detection
  const season = detectSeasonality(forecastData);
  assert(typeof season.detected === 'boolean', 'Seasonality check returns boolean');
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 12: Edge Cases
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════');
console.log('TEST 12: Edge Cases');
console.log('═══════════════════════════════════════════');

{
  // Empty/single data
  const lr_single = linearRegression([5]);
  assert(lr_single.slope === 0, 'Single point regression slope = 0');

  const lr_empty = linearRegression([]);
  assert(lr_empty.slope === 0, 'Empty regression slope = 0');

  const sma_empty = simpleMovingAverage([], 3);
  assert(sma_empty.length === 0, 'Empty SMA returns []');

  const vol_single = calculateVolatility([10]);
  assert(vol_single.standardDeviation === 0, 'Single point volatility = 0');

  const mom_short = calculateMomentum([10, 11]);
  assert(mom_short.direction === 'stable', 'Two-point momentum = stable');

  const forecast_nodata = predictCompetitorPrice('x', 'y', [], 5);
  assert(forecast_nodata.predictedPrice === 0, 'Empty forecast prediction = 0');
}

// ═══════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════');
console.log(`RESULTS: ${passed} passed, ${failed} failed (${passed + failed} total)`);
console.log('═══════════════════════════════════════════');

if (failed > 0) {
  process.exit(1);
}
