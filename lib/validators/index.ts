// Product validation
export function validateProduct(data: any): { valid: boolean; errors: string[]; data?: any } {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 1) {
    errors.push('Product name is required');
  }
  if (data.name && data.name.length > 255) {
    errors.push('Product name must be less than 255 characters');
  }
  if (data.currentPrice !== undefined) {
    const price = Number(data.currentPrice);
    if (isNaN(price) || price < 0) {
      errors.push('Current price must be a positive number');
    }
  }
  if (data.costPrice !== undefined) {
    const cost = Number(data.costPrice);
    if (isNaN(cost) || cost < 0) {
      errors.push('Cost price must be a positive number');
    }
  }
  if (data.currency && !['USD', 'EUR', 'GBP', 'MKD', 'JPY', 'CHF', 'CAD', 'AUD'].includes(data.currency)) {
    errors.push('Invalid currency code');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? {
      name: data.name?.trim(),
      sku: data.sku || null,
      currentPrice: data.currentPrice !== undefined ? String(data.currentPrice) : null,
      costPrice: data.costPrice !== undefined ? String(data.costPrice) : null,
      currency: data.currency || 'EUR',
      category: data.category || null,
      source: data.source || 'manual',
      externalId: data.externalId || null,
    } : undefined,
  };
}

// Competitor validation
export function validateCompetitor(data: any): { valid: boolean; errors: string[]; data?: any } {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 1) {
    errors.push('Competitor name is required');
  }
  if (data.url) {
    try {
      new URL(data.url);
    } catch {
      errors.push('Invalid URL format');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? {
      name: data.name?.trim(),
      url: data.url || null,
      industry: data.industry || null,
    } : undefined,
  };
}

// Scrape request validation
export function validateScrapeRequest(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.url) errors.push('URL is required');
  else {
    try { new URL(data.url); } catch { errors.push('Invalid URL format'); }
  }
  if (!data.productId) errors.push('Product ID is required');
  return { valid: errors.length === 0, errors };
}

// CSV import validation
export function validateCSV(headers: string[]): { valid: boolean; errors: string[] } {
  const required = ['name', 'currentPrice'];
  const missing = required.filter(h => !headers.includes(h));
  return {
    valid: missing.length === 0,
    errors: missing.length > 0 ? [`Missing required columns: ${missing.join(', ')}`] : [],
  };
}

// Pricing recommendation validation
export function validateRecommendation(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.productId) errors.push('Product ID is required');
  if (data.suggestedPrice !== undefined) {
    const price = Number(data.suggestedPrice);
    if (isNaN(price) || price <= 0) errors.push('Suggested price must be positive');
  }
  return { valid: errors.length === 0, errors };
}
