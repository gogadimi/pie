import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', MKD: 'ден', JPY: '¥'
  };
  return `${symbols[currency] || ''}${amount.toFixed(2)}`;
}

export function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function generateSKU(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 12) + '-' + Date.now().toString(36).toUpperCase();
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.substring(0, len) + '...' : str;
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === maxAttempts - 1) throw error;
      await sleep(delayMs * Math.pow(2, i));
    }
  }
  throw new Error('Unreachable');
}

export { logger } from './logger';
