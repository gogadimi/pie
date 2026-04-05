import { ScrapedPrice } from './types';

/**
 * AI-powered price extraction from HTML
 * Uses LLM to parse messy HTML and extract structured pricing data
 */
export async function extractPriceWithAI(html: string, url: string): Promise<ScrapedPrice> {
  const Anthropic = await import('@anthropic-ai/sdk');
  
  const client = new Anthropic.default({
    apiKey: process.env.ANTHROPIC_API_KEY || 'placeholder',
  });

  // Truncate HTML to first 15KB to save tokens
  const truncatedHtml = html.length > 15000 
    ? html.substring(0, 15000) + '\n\n<!-- HTML truncated for token limits -->' 
    : html;

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      temperature: 0,
      system: `You are a price extraction expert. Extract pricing information from HTML content.
Return ONLY a JSON object with these fields (all required):
{
  "price": number | null,
  "originalPrice": number | null,
  "discountPct": number | null,
  "currency": string (3-letter ISO, e.g. "USD", "EUR"),
  "inStock": boolean,
  "productName": string,
  "confidence": number (0-1, how confident you are)
}
Rules:
- price is the CURRENT selling price (after discounts)
- originalPrice is the price before any discount (null if no discount)
- If there is no price visible, set price to null and confidence to 0
- Ignore shipping costs
- Ignore subscription/trial prices unless they are the main price
- For currency, look for €, $, or £ symbols, or text like "USD"
- Stock: look for "In Stock", "Out of Stock", "Add to Cart", "Sold Out"
`,
      messages: [
        {
          role: 'user',
          content: `Extract pricing data from this HTML page: ${url}
          
HTML content:
${truncatedHtml}

Return ONLY the JSON object, nothing else.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '{}';
    
    // Extract JSON from potential markdown code blocks
    const jsonText = text.replace(/```json\n?|```/g, '').trim();
    const result = JSON.parse(jsonText);

    return {
      price: result.price ?? null,
      originalPrice: result.originalPrice ?? null,
      discountPct: result.discountPct ?? null,
      currency: result.currency ?? 'USD',
      inStock: result.inStock ?? true,
      productName: result.productName ?? '',
      confidence: result.confidence ?? 0.5,
      scrapedAt: new Date().toISOString(),
      competitorUrl: url,
      htmlSnippet: truncatedHtml.substring(0, 500),
    };
  } catch (error: any) {
    console.error('[AI Extraction Error]', error?.message || error);
    // Fallback to regex extraction
    return extractPriceWithRegex(truncatedHtml, url);
  }
}

/**
 * Fallback: regex-based price extraction
 */
export function extractPriceWithRegex(html: string, url: string): ScrapedPrice {
  // Remove scripts and styles
  const cleaned = html.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Pattern for prices: €49.99, $49.99, 49.99 EUR, 49.99 USD
  const pricePatterns = [
    /([€$£¥])\s*([\d,.]+)/g,
    /([\d,.]+)\s*(USD|EUR|GBP|USD)/gi,
    /price["']?\s*:\s*["']?([\d,.]+)/gi,
    /"price"\s*:\s*"?([\d,.]+)/gi,
    /amount["']?\s*:\s*["']?([\d,.]+)/gi,
  ];

  let price: number | null = null;
  let currency = 'USD';

  for (const pattern of pricePatterns) {
    const match = pattern.exec(cleaned);
    if (match) {
      if (['€', '$', '£', '¥'].includes(match[1])) {
        const symbols: Record<string, string> = { '€': 'EUR', '$': 'USD', '£': 'GBP', '¥': 'JPY' };
        currency = symbols[match[1]] || 'USD';
      } else {
        currency = match[2]?.toUpperCase() || 'USD';
      }
      
      const numStr = match[1]?.replace(/,/g, '.') || match[2];
      price = parseFloat(numStr);
      if (!isNaN(price) && price > 0) break;
    }
  }

  // Check stock
  const inStock = !/out of stock|sold out|unavailable|nema na zaliha/i.test(cleaned);

  return {
    price,
    originalPrice: null,
    discountPct: null,
    currency,
    inStock,
    productName: extractTitle(cleaned),
    confidence: price ? 0.4 : 0,
    scrapedAt: new Date().toISOString(),
    competitorUrl: url,
  };
}

function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>(.+?)<\/title>/i);
  return titleMatch?.[1]?.trim() || '';
}

// Re-export types
export type { ScrapedPrice } from './types';
