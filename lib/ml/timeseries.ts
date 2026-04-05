/**
 * Time Series Analysis Module for Price Optimization
 * 
 * Pure functions for analyzing price trends, volatility, and momentum.
 * No external dependencies - implemented from scratch.
 */

// ─── Types ─────────────────────────────────────────────────────────────

export interface TimePoint {
  timestamp: Date;
  value: number;
}

export interface TrendResult {
  slope: number;
  intercept: number;
  rSquared: number;
  direction: 'uptrend' | 'downtrend' | 'stable';
}

export interface MovingAverageResult {
  sma: (number | null)[];
  ema: (number | null)[];
}

export interface VolatilityResult {
  standardDeviation: number;
  variance: number;
  meanDelta: number;
  maxDelta: number;
  minDelta: number;
}

export interface MomentumResult {
  velocity: number;  // First derivative rate
  acceleration: number;  // Second derivative rate
  direction: 'accelerating_up' | 'accelerating_down' | 'decelerating_up' | 'decelerating_down' | 'stable';
}

export interface TrendAnalysis {
  trend: TrendResult;
  volatility: VolatilityResult;
  momentum: MomentumResult;
  movingAverages: MovingAverageResult;
  dataPoints: number;
  timeRange: number; // days
}

// ─── Linear Regression ─────────────────────────────────────────────────

/**
 * Simple linear regression using ordinary least squares.
 * Returns slope, intercept, and R² (coefficient of determination).
 */
export function linearRegression(data: number[]): {
  slope: number;
  intercept: number;
  rSquared: number;
} {
  const n = data.length;
  if (n < 2) {
    return { slope: 0, intercept: n > 0 ? data[0] : 0, rSquared: 0 };
  }

  const xValues: number[] = [];
  for (let i = 0; i < n; i++) {
    xValues.push(i);
  }

  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = data.reduce((a, b) => a + b, 0) / n;

  let ssXY = 0;
  let ssXX = 0;
  for (let i = 0; i < n; i++) {
    const xD = xValues[i] - xMean;
    ssXY += xD * (data[i] - yMean);
    ssXX += xD * xD;
  }

  const slope = ssXX !== 0 ? ssXY / ssXX : 0;
  const intercept = yMean - slope * xMean;

  // R² calculation
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * xValues[i] + intercept;
    ssRes += (data[i] - predicted) * (data[i] - predicted);
    ssTot += (data[i] - yMean) * (data[i] - yMean);
  }

  const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, rSquared };
}

/**
 * Detect trend direction from linear regression results.
 */
export function detectTrendDirection(
  slope: number,
  rSquared: number,
  threshold: number = 0.001
): 'uptrend' | 'downtrend' | 'stable' {
  const normalizedSlope = rSquared * slope;
  if (normalizedSlope > threshold) return 'uptrend';
  if (normalizedSlope < -threshold) return 'downtrend';
  return 'stable';
}

// ─── Moving Averages ───────────────────────────────────────────────────

/**
 * Simple Moving Average (SMA)
 */
export function simpleMovingAverage(data: number[], windowSize: number): (number | null)[] {
  const result: (number | null)[] = [];
  if (windowSize <= 0 || data.length === 0) return [];

  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - windowSize + 1; j <= i; j++) {
        sum += data[j];
      }
      result.push(sum / windowSize);
    }
  }

  return result;
}

/**
 * Exponential Moving Average (EMA)
 * @param smoothing The smoothing factor (alpha). Default: 2/(window+1)
 */
export function exponentialMovingAverage(data: number[], windowSize: number, smoothing?: number): (number | null)[] {
  const result: (number | null)[] = [];
  if (windowSize <= 0 || data.length === 0) return [];

  const alpha = smoothing ?? 2 / (windowSize + 1);

  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      result.push(null);
    } else if (i === windowSize - 1) {
      // First EMA value = SMA of first window
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        sum += data[j];
      }
      result.push(sum / windowSize);
    } else {
      const prevEma = result[i - 1] !== null ? result[i - 1]! : data[i];
      result.push(data[i] * alpha + prevEma * (1 - alpha));
    }
  }

  return result;
}

// ─── Volatility Analysis ───────────────────────────────────────────────

/**
 * Calculate price volatility from a series of prices.
 */
export function calculateVolatility(data: number[]): VolatilityResult {
  if (data.length < 2) {
    return { standardDeviation: 0, variance: 0, meanDelta: 0, maxDelta: 0, minDelta: 0 };
  }

  // Calculate price changes (deltas)
  const deltas: number[] = [];
  for (let i = 1; i < data.length; i++) {
    deltas.push(data[i] - data[i - 1]);
  }

  const n = deltas.length;
  const mean = deltas.reduce((a, b) => a + b, 0) / n;

  // Variance and standard deviation of deltas
  let variance = 0;
  for (let i = 0; i < n; i++) {
    variance += (deltas[i] - mean) * (deltas[i] - mean);
  }
  variance = variance / n;
  const standardDeviation = Math.sqrt(variance);

  return {
    standardDeviation,
    variance,
    meanDelta: mean,
    maxDelta: Math.max(...deltas),
    minDelta: Math.min(...deltas),
  };
}

// ─── Momentum Analysis ─────────────────────────────────────────────────

/**
 * Calculate price change momentum (velocity and acceleration).
 */
export function calculateMomentum(data: number[]): MomentumResult {
  if (data.length < 3) {
    return { velocity: 0, acceleration: 0, direction: 'stable' };
  }

  // Velocity: average rate of change
  const deltas: number[] = [];
  for (let i = 1; i < data.length; i++) {
    deltas.push(data[i] - data[i - 1]);
  }

  const velocity = deltas.reduce((a, b) => a + b, 0) / deltas.length;

  // Acceleration: rate of change of velocity (second derivative)
  const accelerations: number[] = [];
  for (let i = 1; i < deltas.length; i++) {
    accelerations.push(deltas[i] - deltas[i - 1]);
  }

  const acceleration = accelerations.length > 0
    ? accelerations.reduce((a, b) => a + b, 0) / accelerations.length
    : 0;

  // Determine direction
  let direction: MomentumResult['direction'];
  const absThreshold = Math.max(0.001, Math.max(...data.map((_, i) => i > 0 ? Math.abs(data[i] - data[i - 1]) : 0)) * 0.05);

  if (Math.abs(velocity) < absThreshold && Math.abs(acceleration) < absThreshold) {
    direction = 'stable';
  } else if (velocity > 0 && acceleration > 0) {
    direction = 'accelerating_up';
  } else if (velocity > 0 && acceleration <= 0) {
    direction = 'decelerating_up';
  } else if (velocity < 0 && acceleration < 0) {
    direction = 'accelerating_down';
  } else {
    direction = 'decelerating_down';
  }

  return { velocity, acceleration, direction };
}

// ─── Trend Analysis ────────────────────────────────────────────────────

/**
 * Perform full trend analysis on price data.
 */
export function analyzeTrend(timePoints: TimePoint[], windowSize: number = 7): TrendAnalysis {
  if (timePoints.length === 0) {
    return {
      trend: { slope: 0, intercept: 0, rSquared: 0, direction: 'stable' },
      volatility: { standardDeviation: 0, variance: 0, meanDelta: 0, maxDelta: 0, minDelta: 0 },
      momentum: { velocity: 0, acceleration: 0, direction: 'stable' },
      movingAverages: { sma: [], ema: [] },
      dataPoints: 0,
      timeRange: 0,
    };
  }

  // Sort by timestamp
  const sorted = [...timePoints].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const values = sorted.map(p => p.value);

  // Linear regression
  const regression = linearRegression(values);
  const direction = detectTrendDirection(regression.slope, regression.rSquared);

  // Volatility
  const volatility = calculateVolatility(values);

  // Momentum
  const momentum = calculateMomentum(values);

  // Moving averages
  const sma = simpleMovingAverage(values, Math.min(windowSize, values.length));
  const ema = exponentialMovingAverage(values, Math.min(windowSize, values.length));

  // Time range
  const timeRange = sorted.length > 1
    ? (sorted[sorted.length - 1].timestamp.getTime() - sorted[0].timestamp.getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  return {
    trend: { ...regression, direction },
    volatility,
    momentum,
    movingAverages: { sma, ema },
    dataPoints: sorted.length,
    timeRange,
  };
}

/**
 * Calculate weighted trend with recent data weighted more heavily.
 */
export function weightedTrend(timePoints: TimePoint[], decay: number = 0.95): {
  weightedSlope: number;
  weightedR2: number;
  recentTrend: 'up' | 'down' | 'stable';
} {
  if (timePoints.length < 2) {
    return { weightedSlope: 0, weightedR2: 0, recentTrend: 'stable' };
  }

  const sorted = [...timePoints].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const values = sorted.map(p => p.value);
  const n = values.length;

  // Calculate time-weighted deltas
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 1; i < n; i++) {
    const weight = Math.pow(decay, n - 1 - i);
    const delta = values[i] - values[i - 1];
    weightedSum += weight * delta;
    weightTotal += weight;
  }

  const weightedAvgDelta = weightTotal > 0 ? weightedSum / weightTotal : 0;
  
  // Calculate weighted R² approximation
  const weightedMean = values.reduce((sum, v, i) => {
    const weight = Math.pow(decay, n - 1 - i);
    return sum + weight * v;
  }, 0) / weightTotal;

  let weightedSSTotal = 0;
  let weightedSSRes = 0;
  for (let i = 0; i < n; i++) {
    const weight = Math.pow(decay, n - 1 - i);
    const predicted = values[0] + weightedAvgDelta * i;
    weightedSSTotal += weight * (values[i] - weightedMean) * (values[i] - weightedMean);
    weightedSSRes += weight * (values[i] - predicted) * (values[i] - predicted);
  }

  const weightedR2 = weightedSSTotal > 0 ? 1 - weightedSSRes / weightedSSTotal : 0;
  const absThreshold = Math.max(...values) * 0.002;

  let recentTrend: 'up' | 'down' | 'stable';
  if (weightedAvgDelta > absThreshold) {
    recentTrend = 'up';
  } else if (weightedAvgDelta < -absThreshold) {
    recentTrend = 'down';
  } else {
    recentTrend = 'stable';
  }

  return { weightedSlope: weightedAvgDelta, weightedR2: Math.max(0, weightedR2), recentTrend };
}
