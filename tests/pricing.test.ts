import { validatePriceChange, calculateMargin, calculateMarkup } from '../lib/pricing/safety';

describe('Safety Rails', () => {
  test('allows small increase within limits', () => {
    const result = validatePriceChange(100, 110, 50);
    expect(result.safe).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.adjustedPrice).toBe(110);
  });

  test('blocks increase above max', () => {
    const result = validatePriceChange(100, 200, 50); // +100% but max is 25%
    expect(result.safe).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.adjustedPrice).toBe(125); // capped at 25%
  });

  test('blocks below cost price', () => {
    const result = validatePriceChange(100, 40, 90, { 
      minMarginPct: 10, maxIncreasePct: 25, maxDecreasePct: 30, 
      minPrice: 0, maxPrice: Infinity, maxChangePerDay: 5, requireHumanApproval: true
    });
    // At $40 with cost $90, margin is negative
    expect(result.safe).toBe(false);
  });

  test('respects min price floor', () => {
    const result = validatePriceChange(100, 5, 50, {
      minMarginPct: 10, maxIncreasePct: 25, maxDecreasePct: 30,
      minPrice: 10, maxPrice: Infinity, maxChangePerDay: 5, requireHumanApproval: true
    });
    expect(result.adjustedPrice).toBeGreaterThanOrEqual(10);
  });
});

describe('Margin Calculations', () => {
  test('calculates margin correctly', () => {
    expect(calculateMargin(100, 60)).toBe(40);
    expect(calculateMargin(200, 100)).toBe(50);
  });

  test('calculates markup correctly', () => {
    expect(calculateMarkup(150, 100)).toBe(50);
    expect(calculateMarkup(200, 100)).toBe(100);
  });
});
