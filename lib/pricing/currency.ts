export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rateToUSD: number;
}

export const CURRENCIES: Record<string, CurrencyRate> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', rateToUSD: 1 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', rateToUSD: 1.08 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', rateToUSD: 1.27 },
  MKD: { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден', rateToUSD: 0.0175 },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rateToUSD: 0.0067 },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', rateToUSD: 1.13 },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rateToUSD: 0.74 },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rateToUSD: 0.65 },
};

export function convertCurrency(
  amount: number,
  fromCode: string,
  toCode: string
): number {
  const from = CURRENCIES[fromCode];
  const to = CURRENCIES[toCode];
  if (!from || !to) return amount;
  const inUSD = amount * from.rateToUSD;
  return Math.round((inUSD / to.rateToUSD) * 100) / 100;
}

export function formatCurrency(
  amount: number,
  currencyCode: string = 'EUR',
  locale: string = 'en-US'
): string {
  const currency = CURRENCIES[currencyCode];
  if (!currency) return `${amount.toFixed(2)} ${currencyCode}`;
  return `${currency.symbol}${amount.toFixed(2)}`;
}

export function normalizePrice(
  price: number,
  detectedCurrency: string,
  baseCurrency: string = 'EUR'
): number {
  return convertCurrency(price, detectedCurrency, baseCurrency);
}
