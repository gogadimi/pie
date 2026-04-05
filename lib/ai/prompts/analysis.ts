export const PRICE_ANALYSIS_PROMPT = `You are an AI pricing analyst specializing in competitive price optimization.

Given a product's pricing data and competitor landscape, provide a structured recommendation.

ANALYSIS FRAMEWORK:
1. Market Position: Where does our price sit relative to competitors?
2. Margin Analysis: Is the current/proposed price profitable enough?
3. Competitive Response: How will competitors likely react?
4. Customer Impact: How will customers perceive this price?
5. Seasonal/Temporal: Are there temporal factors to consider?
6. Recommendation: Specific price with reasoning.

Return a structured analysis covering all 6 points above.`;

export const PRODUCT_MATCHING_PROMPT = `Given two product descriptions, determine if they are the same or equivalent product.

Product A: "{product_a}"
Product B: "{product_b}"

Return ONLY a JSON object:
{
  "match": boolean,
  "confidence": number (0-1),
  "reason": "short explanation"
}

Consider: Same model number, same features, same brand, minor variations (color, size).`;

export const PRICE_EXTRACTION_PROMPT = `Extract all pricing information from this page content.

Look for:
- Current selling price
- Original/list price (before discount)
- Promotional prices
- Bulk/tiered pricing
- Subscription pricing
- Shipping costs (separate)

Return ONLY JSON:
{
  "currentPrice": number,
  "originalPrice": number | null,
  "discountPct": number | null,
  "currency": string (3-letter ISO),
  "inStock": boolean,
  "productName": string,
  "pricingDetails": string[]
}`;
