export interface SafetyRails {
  maxIncreasePct: number;      // Maximum price increase percentage (default 25%)
  maxDecreasePct: number;      // Maximum price decrease percentage (default 30%)
  minMarginPct: number;        // Minimum profit margin floor (default 10%)
  minPrice: number;            // Absolute minimum price (default 0)
  maxPrice: number;            // Absolute maximum price (default Infinity)
  maxChangePerDay: number;     // Maximum price changes per day (default 5)
  requireHumanApproval: boolean; // Always require human approval (default true)
}

export const DEFAULT_SAFETY_RAILS: SafetyRails = {
  maxIncreasePct: 25,
  maxDecreasePct: 30,
  minMarginPct: 10,
  minPrice: 0,
  maxPrice: Infinity,
  maxChangePerDay: 5,
  requireHumanApproval: true,
};

export function validatePriceChange(
  currentPrice: number,
  suggestedPrice: number,
  costPrice: number | null,
  rails: SafetyRails = DEFAULT_SAFETY_RAILS
): { safe: boolean; violations: string[]; adjustedPrice: number } {
  const violations: string[] = [];
  let adjustedPrice = suggestedPrice;

  // Check absolute min/max
  if (suggestedPrice < rails.minPrice) {
    violations.push(`Below minimum price (${rails.minPrice})`);
    adjustedPrice = Math.max(adjustedPrice, rails.minPrice);
  }
  if (suggestedPrice > rails.maxPrice) {
    violations.push(`Above maximum price (${rails.maxPrice})`);
    adjustedPrice = Math.min(adjustedPrice, rails.maxPrice);
  }

  // Check percentage change limits
  const changePct = ((suggestedPrice - currentPrice) / currentPrice) * 100;
  if (changePct > rails.maxIncreasePct) {
    violations.push(`Increase of ${changePct.toFixed(1)}% exceeds max ${rails.maxIncreasePct}%`);
    adjustedPrice = currentPrice * (1 + rails.maxIncreasePct / 100);
  }
  if (changePct < -rails.maxDecreasePct) { // negative = decrease
    violations.push(`Decrease of ${Math.abs(changePct).toFixed(1)}% exceeds max ${rails.maxDecreasePct}%`);
    adjustedPrice = currentPrice * (1 - rails.maxDecreasePct / 100);
  }

  // Check margin floor
  if (costPrice && costPrice > 0) {
    const margin = ((adjustedPrice - costPrice) / adjustedPrice) * 100;
    if (margin < rails.minMarginPct) {
      violations.push(`Margin of ${margin.toFixed(1)}% below floor ${rails.minMarginPct}%`);
      // Adjust to meet min margin
      adjustedPrice = costPrice / (1 - rails.minMarginPct / 100);
    }
  }

  // Round to 2 decimal places
  adjustedPrice = Math.round(adjustedPrice * 100) / 100;

  return {
    safe: violations.length === 0,
    violations,
    adjustedPrice,
  };
}

export function calculateMargin(
  sellingPrice: number,
  costPrice: number
): number {
  if (!sellingPrice || sellingPrice === 0) return 0;
  return ((sellingPrice - costPrice) / sellingPrice) * 100;
}

export function calculateMarkup(
  sellingPrice: number,
  costPrice: number
): number {
  if (!costPrice || costPrice === 0) return 0;
  return ((sellingPrice - costPrice) / costPrice) * 100;
}
