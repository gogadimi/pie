/**
 * Price Elasticity Model
 * 
 * Calculates price elasticity of demand from historical data
 * using competitor price position as a proxy for demand impact.
 */

// ─── Types ─────────────────────────────────────────────────────────────

export interface PriceElasticityInput {
  /** Historical pairs of (ourPrice, marketAvgPrice) */
  priceHistory: { ourPrice: number; marketAvgPrice: number; scrapedAt: Date }[];
  /** Current product cost */
  costPrice: number | null;
}

export interface ElasticityResult {
  elasticity: number; // E = %ΔQ / %ΔP  (using proxy)
  category: 'elastic' | 'inelastic' | 'unit_elastic';
  sensitivity: 'high' | 'medium' | 'low';
  marketPositionPct: number; // How far above/below market average
  demandImpactPerPctChange: number; // Estimated demand change per 1% price change
}

export interface DemandImpact {
  demandChangePct: number;
  revenueChangePct: number;
  profitChangePct: number;
  direction: 'favorable' | 'unfavorable' | 'neutral';
}

export interface OptimalPriceResult {
  optimalPrice: number;
  currentPrice: number;
  expectedRevenueChangePct: number;
  expectedProfitChangePct: number;
  iterations: number;
}

export interface CompetitorShift {
  competitorId: string;
  competitorName: string;
  oldPrice: number;
  newPrice: number;
  priceChangePct: number;
}

// ─── Elasticity Calculation ────────────────────────────────────────────

/**
 * Calculate price elasticity using competitive position as a demand proxy.
 * 
 * Since we lack actual volume data, we estimate elasticity by observing:
 * - When our price > market avg, the competitive pressure is higher (more elastic)
 * - When our price < market avg, competitive pressure is lower (less elastic)
 * - The slope of market position vs. time correlates with demand sensitivity
 */
export function calculateElasticity(input: PriceElasticityInput): ElasticityResult {
  const { priceHistory, costPrice } = input;

  if (priceHistory.length < 2) {
    return {
      elasticity: -0.8,
      category: 'inelastic',
      sensitivity: 'low',
      marketPositionPct: 0,
      demandImpactPerPctChange: -0.5,
    };
  }

  // Calculate market position (% above/below average) for each data point
  const marketPositions: number[] = [];
  const priceChanges: number[] = [];
  
  for (let i = 0; i < priceHistory.length; i++) {
    const { ourPrice, marketAvgPrice } = priceHistory[i];
    if (marketAvgPrice > 0) {
      marketPositions.push(((ourPrice - marketAvgPrice) / marketAvgPrice) * 100);
    }
    if (i > 0) {
      const prev = priceHistory[i - 1].ourPrice;
      if (prev > 0) {
        priceChanges.push(((ourPrice - prev) / prev) * 100);
      }
    }
  }

  // Current market position
  const latest = priceHistory[priceHistory.length - 1];
  const currentMarketPosition = latest.marketAvgPrice > 0
    ? ((latest.ourPrice - latest.marketAvgPrice) / latest.marketAvgPrice) * 100
    : 0;

  // Estimate elasticity using price position variance and price change frequency
  // Higher variance in pricing → more elastic demand (customers are price-sensitive)
  // More frequent changes → more elastic market
  const positionMean = marketPositions.reduce((a, b) => a + b, 0) / marketPositions.length;
  const positionVariance = marketPositions.reduce((sum, p) => sum + (p - positionMean) ** 2, 0) / marketPositions.length;

  // Price change volatility as elasticity proxy
  const avgAbsPriceChange = priceChanges.length > 0
    ? priceChanges.reduce((sum, c) => sum + Math.abs(c), 0) / priceChanges.length
    : 0;

  // Base elasticity estimate
  // Markets with high price variance are more elastic
  // Premium-positioned products tend more elastic (consumers will switch)
  const baseElasticity = -1.2 * (1 + Math.sqrt(positionVariance) / 20);
  const premiumAdjustment = currentMarketPosition > 0 ? -0.1 * Math.log(1 + currentMarketPosition / 10) : 0;
  
  const elasticity = baseElasticity - premiumAdjustment;

  // Determine category
  const absE = Math.abs(elasticity);
  let category: 'elastic' | 'inelastic' | 'unit_elastic';
  if (absE > 1.2) category = 'elastic';
  else if (absE < 0.8) category = 'inelastic';
  else category = 'unit_elastic';

  // Sensitivity
  const demandImpactPerPctChange = elasticity / 100; // Per 1% price change
  let sensitivity: 'high' | 'medium' | 'low';
  if (absE > 1.5) sensitivity = 'high';
  else if (absE > 0.9) sensitivity = 'medium';
  else sensitivity = 'low';

  return {
    elasticity,
    category,
    sensitivity,
    marketPositionPct: currentMarketPosition,
    demandImpactPerPctChange,
  };
}

// ─── Demand Impact Estimation ──────────────────────────────────────────

/**
 * Estimate demand and revenue impact of a price change.
 */
export function estimateDemandImpact(
  currentPrice: number,
  newPrice: number,
  elasticity: ElasticityResult
): DemandImpact {
  if (currentPrice <= 0) {
    return { demandChangePct: 0, revenueChangePct: 0, profitChangePct: 0, direction: 'neutral' };
  }

  const priceChangePct = ((newPrice - currentPrice) / currentPrice) * 100;
  
  // E = %ΔQ / %ΔP  →  %ΔQ = E × %ΔP
  const demandChangePct = elasticity.elasticity * priceChangePct;
  
  // Revenue = Price × Quantity
  // %ΔRevenue ≈ %ΔP + %ΔQ + (%ΔP × %ΔQ / 100)
  const revenueChangePct = priceChangePct + demandChangePct + (priceChangePct * demandChangePct / 100);
  
  // Profit change (more complex - depends on cost structure)
  // Profit = (Price - Cost) × Quantity
  // Estimate: profit change ≈ revenue change + cost savings from lower volume
  const demandFactor = 1 + demandChangePct / 100;
  const revenueFactor = (newPrice / currentPrice) * demandFactor;
  const profitFactor = revenueFactor - 1;
  const profitChangePct = profitFactor * 100;

  // Direction
  let direction: 'favorable' | 'unfavorable' | 'neutral';
  if (profitChangePct > 1) direction = 'favorable';
  else if (profitChangePct < -1) direction = 'unfavorable';
  else direction = 'neutral';

  return {
    demandChangePct: Math.round(demandChangePct * 100) / 100,
    revenueChangePct: Math.round(revenueChangePct * 100) / 100,
    profitChangePct: Math.round(profitChangePct * 100) / 100,
    direction,
  };
}

// ─── Optimal Price Finding ─────────────────────────────────────────────

/**
 * Find the optimal price that maximizes revenue on the demand curve.
 * Uses grid search over a reasonable price range.
 */
export function findOptimalPrice(
  currentPrice: number,
  elasticity: ElasticityResult,
  options?: {
    /** Minimum price (default: 50% of current) */
    minPrice?: number;
    /** Maximum price (default: 200% of current) */
    maxPrice?: number;
    /** Cost price for profit optimization */
    costPrice?: number | null;
    /** Price granularity for search (default: 0.01) */
    step?: number;
  }
): OptimalPriceResult {
  const minPrice = options?.minPrice ?? currentPrice * 0.5;
  const maxPrice = options?.maxPrice ?? currentPrice * 2;
  const step = options?.step ?? 0.01;
  const costPrice = options?.costPrice ?? null;
  const absE = Math.abs(elasticity.elasticity);

  let bestPrice = currentPrice;
  let bestValue = costPrice
    ? (currentPrice - costPrice) // Profit per unit (ignoring demand for baseline)
    : currentPrice; // Revenue per unit
  let iterations = 0;

  for (let p = minPrice; p <= maxPrice; p += step) {
    const priceChangePct = ((p - currentPrice) / currentPrice) * 100;
    const demandChangePct = elasticity.elasticity * priceChangePct;
    const demandFactor = Math.max(0.01, 1 + demandChangePct / 100);
    
    let value: number;
    if (costPrice !== null && costPrice > 0) {
      // Maximize profit: (price - cost) × demand_factor
      value = (p - costPrice) * demandFactor;
    } else {
      // Maximize revenue: price × demand_factor
      value = p * demandFactor;
    }

    iterations++;
    if (value > bestValue) {
      bestValue = value;
      bestPrice = p;
    }
  }

  // Calculate expected changes
  const baseDemandFactor = 1;
  const newDemandFactor = Math.max(0.01, 1 + elasticity.elasticity * ((bestPrice - currentPrice) / currentPrice) * 100 / 100);
  const revenueChangePct = costPrice
    ? ((bestValue * newDemandFactor - (currentPrice - costPrice) * baseDemandFactor) / ((currentPrice - costPrice) * baseDemandFactor)) * 100
    : ((bestPrice * newDemandFactor - currentPrice * baseDemandFactor) / (currentPrice * baseDemandFactor)) * 100;

  return {
    optimalPrice: Math.round(bestPrice * 100) / 100,
    currentPrice,
    expectedRevenueChangePct: isFinite(revenueChangePct) ? Math.round(revenueChangePct * 100) / 100 : 0,
    expectedProfitChangePct: costPrice
      ? Math.round(((bestPrice - costPrice) * newDemandFactor - (currentPrice - costPrice)) / (currentPrice - costPrice) * 10000) / 100
      : Math.round(revenueChangePct * 100) / 100,
    iterations,
  };
}

// ─── Competitor Impact on Demand ───────────────────────────────────────

/**
 * Estimate how competitor price shifts affect our demand.
 */
export function estimateCompetitorDemandShift(
  competitorShifts: CompetitorShift[],
  elasticity: ElasticityResult,
  ourPrice: number,
  marketAvgBefore: number,
  marketAvgAfter: number
): {
  ourNewMarketPosition: number;
  competitivePressureChange: 'increased' | 'decreased' | 'stable';
  estimatedVolumeImpact: number;
} {
  const oldPosition = ((ourPrice - marketAvgBefore) / marketAvgBefore) * 100;
  const newPosition = marketAvgAfter > 0
    ? ((ourPrice - marketAvgAfter) / marketAvgAfter) * 100
    : oldPosition;

  // If market avg drops and we haven't lowered, our effective price rose relative to market
  const marketShiftPct = marketAvgBefore > 0
    ? ((marketAvgAfter - marketAvgBefore) / marketAvgBefore) * 100
    : 0;

  // We feel competitive pressure equal to the market shift × our elasticity
  const estimatedVolumeImpact = Math.abs(marketShiftPct) > 0.1
    ? marketShiftPct * Math.abs(elasticity.elasticity) * 0.5
    : 0;

  let competitivePressureChange: 'increased' | 'decreased' | 'stable';
  if (marketShiftPct < -0.5) {
    competitivePressureChange = 'increased';
  } else if (marketShiftPct > 0.5) {
    competitivePressureChange = 'decreased';
  } else {
    competitivePressureChange = 'stable';
  }

  return {
    ourNewMarketPosition: Math.round(newPosition * 100) / 100,
    competitivePressureChange,
    estimatedVolumeImpact: Math.round(estimatedVolumeImpact * 100) / 100,
  };
}
