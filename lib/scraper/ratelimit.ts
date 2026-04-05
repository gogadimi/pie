import { redis } from '../redis';

/**
 * Per-domain rate limiting
 */
const DEFAULT_RATE_LIMIT = 5; // requests per domain per minute
const RATE_WINDOW = 60; // seconds

export async function checkRateLimit(domain: string, limit: number = DEFAULT_RATE_LIMIT): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  if (!process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL?.includes('example')) {
    // No Redis configured, always allow
    return { allowed: true, remaining: limit };
  }

  const key = `ratelimit:${domain}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, RATE_WINDOW);
  }

  if (current > limit) {
    const ttl = await redis.ttl(key);
    return { 
      allowed: false, 
      remaining: 0, 
      retryAfter: ttl 
    };
  }

  return { 
    allowed: true, 
    remaining: limit - current 
  };
}

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url;
  }
}
