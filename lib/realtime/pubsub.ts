/**
 * Real-time Pub/Sub bridge using Redis sorted sets (Upstash-compatible).
 *
 * Since Upstash doesn't support native pub/sub via HTTP API, we use
 * a lightweight polling-pub-sub pattern: events are stored in Redis
 * sorted sets with timestamps and unique IDs. The SSE endpoint polls
 * these sorted sets for new entries and streams them to clients.
 *
 * Key format: pie:stream:{orgId}:events  (sorted set)
 * Score: timestamp in milliseconds
 * Value: JSON-stringified event with incrementing ID
 * TTL: 300 seconds (5 minutes)
 */

import { redis } from '@/lib/redis';

// ─── Types ────────────────────────────────────────────────────────────────

export type StreamEventType = 'price' | 'alert' | 'job';

export interface PriceUpdateEvent {
  id: string;
  type: 'price';
  timestamp: number;
  data: {
    productId: string;
    competitorId: string;
    competitorUrl: string;
    price: string | null;
    originalPrice: string | null;
    discountPct: string | null;
    inStock: boolean;
    currency: string;
    scrapedAt: string;
    productName?: string;
    strategy?: string;
    duration?: number;
  };
}

export interface AlertEvent {
  id: string;
  type: 'alert';
  timestamp: number;
  data: {
    alertId: string;
    alertType: string;
    message: string;
    severity: string;
    organizationId: string;
  };
}

export interface ScrapeJobEvent {
  id: string;
  type: 'job';
  timestamp: number;
  data: {
    jobId: string;
    organizationId: string;
    competitorId: string;
    competitorUrl: string;
    status: 'completed' | 'failed' | 'running';
    errorMessage?: string;
    price?: number;
    productName?: string;
    strategy?: string;
    duration?: number;
  };
}

export type StreamEvent = PriceUpdateEvent | AlertEvent | ScrapeJobEvent;

/** Internal event type used before type narrowing. */
type AnyStreamEvent = {
  id: string;
  type: StreamEventType;
  timestamp: number;
  data: Record<string, unknown>;
};

// ─── Configuration ────────────────────────────────────────────────────────

const STREAM_TTL_SECONDS = 300; // 5 minutes
const MAX_STREAM_EVENTS = 100; // cap per organization to prevent unbounded growth

/**
 * Get the Redis sorted set key for an organization's event stream.
 */
function streamKey(orgId: string): string {
  return `pie:stream:${orgId}:events`;
}

/**
 * Generate a unique event ID combining timestamp and random suffix.
 */
function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ─── Core Publishing Function ─────────────────────────────────────────────

/**
 * Add an event to the organization's Redis event stream.
 * Uses a sorted set with timestamp as score for ordered retrieval.
 */
async function addEvent(orgId: string, event: Omit<AnyStreamEvent, 'id' | 'timestamp'>): Promise<AnyStreamEvent> {
  const streamEvent: AnyStreamEvent = {
    ...event,
    id: generateEventId(),
    timestamp: Date.now(),
  };

  try {
    const key = streamKey(orgId);
    const score = streamEvent.timestamp;

    // Add to sorted set (scored by timestamp for ordered retrieval)
    await redis.zadd(key, { score, member: JSON.stringify(streamEvent) });

    // Set TTL on the key (only if key is new to avoid resetting on every event)
    await redis.expire(key, STREAM_TTL_SECONDS);

    // Remove oldest events if over max limit
    const count = await redis.zcard(key);
    if (count > MAX_STREAM_EVENTS) {
      const toRemove = count - MAX_STREAM_EVENTS;
      await redis.zremrangebyrank(key, 0, toRemove - 1);
    }

    return streamEvent;
  } catch (error) {
    console.error(`[pubsub] Error publishing event for org ${orgId}:`, error);
    throw error;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Publish a price update event to the organization's stream.
 */
export async function publishPriceUpdate(
  organizationId: string,
  priceRecord: {
    productId: string;
    competitorId: string;
    competitorUrl: string;
    price: number | null;
    originalPrice: number | null;
    discountPct: number | null;
    inStock: boolean;
    currency: string;
    productName?: string;
    strategy?: string;
    duration?: number;
  }
): Promise<PriceUpdateEvent> {
  return addEvent(organizationId, {
    type: 'price',
    data: {
      productId: priceRecord.productId,
      competitorId: priceRecord.competitorId,
      competitorUrl: priceRecord.competitorUrl,
      price: priceRecord.price !== null ? String(priceRecord.price) : null,
      originalPrice: priceRecord.originalPrice !== null ? String(priceRecord.originalPrice) : null,
      discountPct: priceRecord.discountPct !== null ? String(priceRecord.discountPct) : null,
      inStock: priceRecord.inStock,
      currency: priceRecord.currency,
      scrapedAt: new Date().toISOString(),
      productName: priceRecord.productName,
      strategy: priceRecord.strategy,
      duration: priceRecord.duration,
    },
  }) as unknown as PriceUpdateEvent;
}

/**
 * Publish an alert event to the organization's stream.
 */
export async function publishAlert(
  organizationId: string,
  alert: {
    alertId: string;
    alertType: string;
    message: string;
    severity: string;
  }
): Promise<AlertEvent> {
  return addEvent(organizationId, {
    type: 'alert',
    data: {
      alertId: alert.alertId,
      alertType: alert.alertType,
      message: alert.message,
      severity: alert.severity,
      organizationId,
    },
  }) as unknown as AlertEvent;
}

/**
 * Publish a scrape job status event to the organization's stream.
 */
export async function publishScrapeJob(
  organizationId: string,
  jobData: {
    jobId: string;
    competitorId: string;
    competitorUrl: string;
    status: 'completed' | 'failed' | 'running';
    errorMessage?: string;
    price?: number;
    productName?: string;
    strategy?: string;
    duration?: number;
  }
): Promise<ScrapeJobEvent> {
  return addEvent(organizationId, {
    type: 'job',
    data: {
      jobId: jobData.jobId,
      organizationId,
      competitorId: jobData.competitorId,
      competitorUrl: jobData.competitorUrl,
      status: jobData.status,
      errorMessage: jobData.errorMessage,
      price: jobData.price,
      productName: jobData.productName,
      strategy: jobData.strategy,
      duration: jobData.duration,
    },
  }) as unknown as ScrapeJobEvent;
}

// ─── SSE Endpoint Helper ──────────────────────────────────────────────────

/**
 * Read new events from the stream since a given timestamp.
 * Returns events sorted by timestamp (oldest first, like a FIFO stream).
 */
export async function readStreamSince(
  orgId: string,
  sinceTimestamp: number
): Promise<StreamEvent[]> {
  try {
    const key = streamKey(orgId);

    // Get all members with score >= sinceTimestamp
    // Upstash Redis uses zrange with byScore option
    const results = await redis.zrange(
      key,
      sinceTimestamp,
      '+inf',
      { byScore: true }
    ) as string[];

    return results
      .map((raw) => {
        try {
          return JSON.parse(raw) as StreamEvent;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as StreamEvent[];
  } catch (error) {
    console.error(`[pubsub] Error reading stream for org ${orgId}:`, error);
    return [];
  }
}

/**
 * Get the latest event timestamp from the stream (for initializing last seen).
 */
export async function getLatestTimestamp(orgId: string): Promise<number> {
  try {
    const key = streamKey(orgId);
    // Get the highest scoring element
    const results = await redis.zrange(key, -1, -1, { rev: true }) as string[];
    if (results && results.length > 0) {
      const event = JSON.parse(results[0]) as StreamEvent;
      return event.timestamp;
    }
  } catch {
    // ignore
  }
  return Date.now(); // default to now means no historical events
}
