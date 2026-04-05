export interface PricingInput {
  productName: string;
  currentPrice: number;
  costPrice: number | null;
  currency: string;
  competitorPrices: { name: string; price: number; currency: string }[];
  salesHistory?: { date: string; units: number; revenue: number }[];
  marginTarget: number; // percentage (e.g., 20 for 20%)
  strategy: 'aggressive' | 'balanced' | 'conservative';
}

export interface PricingResult {
  suggestedPrice: number;
  strategyUsed: string;
  changePct: number;
  reason: string;
  expectedProfitChange: number;
  expectedVolumeChange: number;
  confidence: number; // 0-1
  risks: string[];
  competitorAnalysis: string;
}

/**
 * Complete Pricing Engine — heuristic fallback + AI when available
 */
export async function analyzePricing(input: PricingInput): Promise<PricingResult> {
  // Try AI first
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'placeholder') {
    return analyzeWithAI(input);
  }
  // Fall back to heuristic
  return analyzeWithHeuristics(input);
}

/** Heuristic pricing algorithm */
function analyzeWithHeuristics(input: PricingInput): PricingResult {
  const { currentPrice, costPrice, competitorPrices, marginTarget, strategy } = input;
  const prices = competitorPrices.map(c => c.price).filter(p => p > 0);
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : currentPrice;
  const minPrice = prices.length ? Math.min(...prices) : currentPrice;
  const maxPrice = prices.length ? Math.max(...prices) : currentPrice;

  const diffFromAvg = ((currentPrice - avgPrice) / avgPrice) * 100;

  // Strategy adjustments
  const strategyConfig = {
    aggressive: { followCompetitor: 0.02, marginFloor: 0.05, changeLimit: 0.15 },
    balanced: { followCompetitor: 0.03, marginFloor: 0.10, changeLimit: 0.10 },
    conservative: { followCompetitor: 0.01, marginFloor: 0.15, changeLimit: 0.05 },
  }[strategy];

  let suggestedPrice = currentPrice;
  let urgency: 'low' | 'medium' | 'high' = 'low';
  let marketPosition: string;

  if (diffFromAvg > 5) {
    suggestedPrice = avgPrice * (1 + strategyConfig.followCompetitor);
    marketPosition = 'premium';
    urgency = diffFromAvg > 20 ? 'high' : 'medium';
  } else if (diffFromAvg < -5) {
    suggestedPrice = avgPrice * (1 - strategyConfig.followCompetitor);
    marketPosition = 'cheapest';
    urgency = 'medium';
  } else {
    marketPosition = 'at market';
    suggestedPrice = currentPrice;
  }

  // Enforce margin floor
  if (costPrice && costPrice > 0) {
    const minPriceForMargin = costPrice / (1 - (marginTarget / 100));
    if (suggestedPrice < minPriceForMargin) {
      suggestedPrice = minPriceForMargin;
      urgency = 'high';
    }
  }

  // Enforce absolute floor
  suggestedPrice = Math.max(suggestedPrice, strategy === 'aggressive' ? minPrice : avgPrice * 0.95);

  const changePct = ((suggestedPrice - currentPrice) / currentPrice) * 100;
  const confidence = prices.length >= 5 ? 0.9 : prices.length >= 3 ? 0.75 : prices.length > 0 ? 0.5 : 0.2;

  let reason = '';
  if (changePct === 0) reason = 'Current price aligns well with market. No action needed.';
  else if (changePct > 0) reason = `Market average is €${avgPrice.toFixed(2)}. Recommendation: increase by ${changePct.toFixed(1)}% while remaining competitive.`;
  else reason = `We are ${Math.abs(diffFromAvg).toFixed(1)}% above market. Recommendation: reduce to €${suggestedPrice.toFixed(2)} to stay competitive.`;

  const risks: string[] = [];
  if (costPrice && costPrice > 0) {
    const margin = ((suggestedPrice - costPrice!) / suggestedPrice) * 100;
    if (margin < marginTarget + 5) risks.push(`Margin ${margin.toFixed(1)}% close to target floor`);
  }

  return {
    suggestedPrice: Math.round(suggestedPrice * 100) / 100,
    strategyUsed: 'heuristic',
    changePct: Math.round(changePct * 10) / 10,
    reason,
    expectedProfitChange: changePct > 0 ? changePct * 0.5 : changePct * 0.3,
    expectedVolumeChange: changePct > 0 ? -changePct * 0.2 : Math.abs(changePct) * 0.25,
    confidence,
    risks,
    competitorAnalysis: `Market: €${minPrice.toFixed(2)}–€${maxPrice.toFixed(2)}, avg €${avgPrice.toFixed(2)} (${prices.length} competitors)`,
  };
}

/** AI-powered analysis (Claude) */
async function analyzeWithAI(input: PricingInput): Promise<PricingResult> {
  try {
    const { Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const competitorsStr = input.competitorPrices.map(c => `- ${c.name}: €${c.price}`).join('\n');

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      temperature: 0.3,
      system: 'You are an expert pricing analyst. Return ONLY a JSON object with fields: suggestedPrice (number), changePct (number), reason (string 1-2 sentences), expectedProfitChange (number %), expectedVolumeChange (number %), confidence (number 0-1), risks (array 1-3 strings), competitorAnalysis (string).',
      messages: [{
        role: 'user',
        content: `Product: ${input.productName}\nCurrent: €${input.currentPrice}\nCost: €${input.costPrice ?? 'Unknown'}\nMargin target: ${input.marginTarget}%\nStrategy: ${input.strategy}\n\nCompetitors:\n${competitorsStr}\n\nReturn the optimal pricing recommendation.`,
      }],
    });

    const text = typeof response.content[0] === 'object' && 'text' in response.content[0] ? response.content[0].text : '{}';
    const json = JSON.parse(text.replace(/```json\n?|```/g, '').trim());

    const heuristic = analyzeWithHeuristics(input);

    return {
      suggestedPrice: json.suggestedPrice ?? heuristic.suggestedPrice,
      strategyUsed: 'ai-claude',
      changePct: json.changePct ?? heuristic.changePct,
      reason: json.reason || heuristic.reason,
      expectedProfitChange: json.expectedProfitChange ?? heuristic.expectedProfitChange,
      expectedVolumeChange: json.expectedVolumeChange ?? heuristic.expectedVolumeChange,
      confidence: json.confidence ?? heuristic.confidence,
      risks: json.risks || heuristic.risks,
      competitorAnalysis: json.competitorAnalysis || heuristic.competitorAnalysis,
    };
  } catch (error: any) {
    console.error('AI pricing error, falling back to heuristic:', error.message);
    return analyzeWithHeuristics(input);
  }
}
