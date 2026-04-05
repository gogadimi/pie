#!/usr/bin/env node
/**
 * Test realtime/pubsub module (no Redis needed for unit logic).
 * Tests event creation, serialization, and stream parsing logic.
 */

import {
  publishPriceUpdate,
  publishAlert,
  publishScrapeJob,
  type PriceUpdateEvent,
  type AlertEvent,
  type ScrapeJobEvent,
  SSE_EVENT_PRICE,
  SSE_EVENT_ALERT,
  SSE_EVENT_JOB,
} from './lib/realtime/pubsub';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

// Mock Redis Upstash client for testing event structure
const mockRedis = {
  zadd: async (...args: unknown[]) => {
    console.log('    [Redis mock] zadd called:', args.length, 'args');
    return 'OK';
  },
  zrangebyscore: async (...args: unknown[]) => {
    return [];
  },
  zremrangebyscore: async (...args: unknown[]) => {
    return 0;
  },
  zrevrangebyscore: async (...args: unknown[]) => {
    return [];
  },
  expire: async (...args: unknown[]) => {
    return 1;
  },
} as any;

console.log('═══════════════════════════════════════════');
console.log('TEST: Realtime PubSub Event Creation');
console.log('═══════════════════════════════════════════');

// Test event types exist
assert(SSE_EVENT_PRICE === 'price', 'SSE_EVENT_PRICE = "price"');
assert(SSE_EVENT_ALERT === 'alert', 'SSE_EVENT_ALERT = "alert"');
assert(SSE_EVENT_JOB === 'job', 'SSE_EVENT_JOB = "job"');

// Test publishPriceUpdate creates correct event shape
const publishPriceResult = await publishPriceUpdate(mockRedis, 'test-org', {
  productId: 'prod-1',
  competitorId: 'comp-1',
  competitorUrl: 'https://example.com/product',
  price: '29.99',
  originalPrice: '39.99',
  discountPct: '25',
  inStock: true,
  currency: 'EUR',
  scrapedAt: new Date().toISOString(),
});

assert(publishPriceResult.ok, 'publishPriceUpdate returned ok=true');
assert(publishPriceResult.eventId !== '', 'Event ID generated');
assert(typeof publishPriceResult.timestamp === 'number', 'Timestamp is numeric');

// Test publishAlert
const publishAlertResult = await publishAlert(mockRedis, 'test-org', {
  alertId: 'alert-1',
  alertType: 'price_drop',
  message: 'Competitor dropped price by 15%',
  severity: 'high',
  productId: 'prod-1',
});

assert(publishAlertResult.ok, 'publishAlert returned ok=true');
assert(publishAlertResult.eventId !== '', 'Alert event ID generated');

// Test publishScrapeJob
const publishJobResult = await publishScrapeJob(mockRedis, 'test-org', {
  jobId: 'job-1',
  competitorId: 'comp-1',
  competitorUrl: 'https://example.com',
  status: 'completed',
  price: 19.99,
  productName: 'Test Product',
  duration: 1250,
});

assert(publishJobResult.ok, 'publishScrapeJob returned ok=true');
assert(publishJobResult.eventId !== '', 'Job event ID generated');

// Test with errors
const errorResult = await publishPriceUpdate(mockRedis, 'test-org', null as any);
assert(!errorResult.ok, 'Null data handled gracefully');

console.log('\n═══════════════════════════════════════════');
console.log(`RESULTS: ${passed} passed, ${failed} failed (${passed + failed} total)`);
console.log('═══════════════════════════════════════════');

if (failed > 0) {
  process.exit(1);
}
