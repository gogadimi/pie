interface AIPricingInput {
  productName: string;
  currentPrice: number;
  costPrice: number | null;
  currency: string;
  competitorPrices: {
    competitorName: string;
    price: number;
    currency: string;
    lastUpdated: string;
  }[];
  salesHistory?: { date: string; units: number; price: number }[];
  marginTarget: number;
}

interface AIPricingOutput {
  suggestedPrice: number;
  changePct: number;
  reason: string;
  expectedProfitChange: number;
  expectedVolumeChange: number;
  confidence: number;
  urgency: 'low' | 'medium' | 'high';
  marketPosition: 'cheapest' | 'average' | 'premium';
  competitorAnalysis: string;
  risks: string[];
}

export async function analyzePricing(
  input: AIPricingInput
): Promise<AIPricingOutput> {
  // If no API key, use heuristic-based pricing
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'placeholder') {
    return heuristicPricing(input);
  }

  try {
    const Anthropic = await import('@anthropic-ai/sdk');
    const client = new Anthropic.default({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });

    const competitorsStr = input.competitorPrices
      .map((c) => `- ${c.competitorName}: $${c.price} (${c.currency})`)
      .join('\n');

    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      temperature: 0.3,
      system: `You are an expert pricing analyst. Given pricing data for a product and competitors, provide an optimal price recommendation.

Return ONLY a JSON object with these fields:
{
  "suggestedPrice": number,
  "changePct": number (positive = increase, negative = decrease),
  "reason": string (1-2 sentences),
  "expectedProfitChange": number (%),
  "expectedVolumeChange": number (%),
  "confidence": number (0-1),
  "urgency": "low" | "medium" | "high",
  "marketPosition": "cheapest" | "average" | "premium",
  "competitorAnalysis": string (1-2 sentences about competitor landscape),
  "risks": string[] (list of 1-3 potential risks)
}

Key rules:
- Consider margin targets
- Don't suggest prices below cost
- Factor competitor positions
- Be conservative with changes (>10% = high urgency)
- Confidence should reflect data quality
`,
      messages: [
        {
          role: 'user',
          content: `Product: ${input.productName}
Current price: $${input.currentPrice} ${input.currency}
Cost price: ${input.costPrice ? '$' + input.costPrice : 'Unknown'}
Margin target: ${input.marginTarget}%

Competitor prices:
${competitorsStr}

Provide the optimal pricing recommendation.`,
        },
      ],
    });

    const text = message.content[0].type === 'text'
      ? message.content[0].text
      : '{}';
    const jsonText = text.replace(/```json\n?|```/g, '').trim();

    return JSON.parse(jsonText);
  } catch (error: any) {
    console.error('[AI Pricing Error]', error?.message || error);
    return heuristicPricing(input);
  }
}

/**
 * Heuristic-based pricing fallback (no API call)
 */
function heuristicPricing(input: AIPricingInput): AIPricingOutput {
  const prices = input.competitorPrices.map((c) => c.price);
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : input.currentPrice;
  const minPrice = prices.length > 0 ? Math.min(...prices) : input.currentPrice;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : input.currentPrice;

  const diffFromAvg = ((input.currentPrice - avgPrice) / avgPrice) * 100;

  let suggestedPrice: number;
  let marketPosition: 'cheapest' | 'average' | 'premium';
  let urgency: 'low' | 'medium' | 'high';

  if (diffFromAvg > 10) {
    // We're above average — consider lowering
    suggestedPrice = avgPrice * 0.95;
    marketPosition = 'premium';
    urgency = diffFromAvg > 25 ? 'high' : 'medium';
  } else if (diffFromAvg < -10) {
    // We're below average — can raise
    suggestedPrice = avgPrice * 1.03;
    marketPosition = 'cheapest';
    urgency = 'low';
  } else {
    marketPosition = 'average';
    suggestedPrice = input.currentPrice;
    urgency = 'low';
  }

  // Respect cost floor
  if (input.costPrice && input.costPrice > 0 && input.marginTarget > 0) {
    const minPriceForMargin = input.costPrice / (1 - input.marginTarget / 100);
    if (suggestedPrice < minPriceForMargin) {
      suggestedPrice = minPriceForMargin;
    }
  }

  const changePct = ((suggestedPrice - input.currentPrice) / input.currentPrice) * 100;
  const confidence = prices.length > 3 ? 0.8 : prices.length > 0 ? 0.6 : 0.3;

  let reason = '';
  if (changePct > 0) {
    reason = `Market average is $${avgPrice.toFixed(2)}. We can increase by ${changePct.toFixed(1)}% while remaining competitive.`;
  } else if (changePct < 0) {
    reason = `We are ${Math.abs(diffFromAvg).toFixed(1)}% above market average. Recommend lowering to $${suggestedPrice.toFixed(2)} to stay competitive.`;
  } else {
    reason = 'Our price aligns well with the market. No change needed.';
  }

  return {
    suggestedPrice: Math.round(suggestedPrice * 100) / 100,
    changePct: Math.round(changePct * 10) / 10,
    reason,
    expectedProfitChange: changePct > 0 ? changePct * 0.5 : changePct * 0.3,
    expectedVolumeChange: changePct > 0 ? -changePct * 0.2 : Math.abs(changePct) * 0.3,
    confidence,
    urgency,
    marketPosition,
    competitorAnalysis: `Market ranges from $${minPrice.toFixed(2)} to $${maxPrice.toFixed(2)}, average $${avgPrice.toFixed(2)}.`,
    risks: changePct < -5
      ? ['Reduced profit margin', 'Price war trigger']
      : changePct > 5
      ? ['Potential volume loss', 'Competitor undercut']
      : ['Market conditions may change'],
  };
}
