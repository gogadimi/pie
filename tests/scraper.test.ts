import { extractPriceWithRegex } from '../lib/scraper/extract';

describe('Price Extraction (Regex Fallback)', () => {
  test('extracts USD price', () => {
    const html = `
      <div class="price">
        <span class="currency">$</span>
        <span class="amount">49.99</span>
      </div>
    `;
    const result = extractPriceWithRegex(html, 'https://example.com');
    expect(result.price).toBe(49.99);
    expect(result.currency).toBe('USD');
  });

  test('extracts EUR price', () => {
    const html = `
      <div class="product-price">€79.95</div>
      <p class="original-price">Was €99.95</p>
    `;
    const result = extractPriceWithRegex(html, 'https://example.eu');
    expect(result.price).toBe(79.95);
    expect(result.currency).toBe('EUR');
  });

  test('returns null when no price found', () => {
    const html = `<div>No prices here</div>`;
    const result = extractPriceWithRegex(html, 'https://example.com');
    expect(result.price).toBeNull();
    expect(result.confidence).toBe(0);
  });

  test('detects out of stock', () => {
    const html = `<div class="stock">Out of Stock</div><span>$29.99</span>`;
    const result = extractPriceWithRegex(html, 'https://example.com');
    expect(result.inStock).toBe(false);
  });

  test('handles GBP', () => {
    const html = `<span class="price">£45.00</span>`;
    const result = extractPriceWithRegex(html, 'https://shop.co.uk');
    expect(result.price).toBe(45);
    expect(result.currency).toBe('GBP');
  });
});

describe('Rate Limiter', () => {
  test('extracts domain from URL', async () => {
    const { extractDomain } = await import('../lib/scraper/ratelimit');
    expect(extractDomain('https://www.amazon.com/dp/B001')).toBe('www.amazon.com');
    expect(extractDomain('https://shop.example.de/products/123')).toBe('shop.example.de');
    expect(extractDomain('invalid-url')).toBe('invalid-url');
  });
});
