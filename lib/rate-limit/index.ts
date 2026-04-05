import { NextResponse } from 'next/server';
import { redis } from '../redis';

export interface RateLimitConfig {
  limit: number;
  window: number; // in seconds
}

const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 100,
  window: 60,
};

const STRIPER_CONFIG: Record<string, RateLimitConfig> = {
  '/api/scrape': { limit: 20, window: 60 },
  '/api/products': { limit: 200, window: 60 },
  '/api/recommendations': { limit: 50, window: 60 },
  '/api/alerts': { limit: 100, window: 60 },
  'default': DEFAULT_CONFIG,
};

export async function checkRateLimit(
  key: string,
  config?: RateLimitConfig
): Promise<{ limited: boolean; remaining: number; resetAt: number }> {
  const { limit, window } = config || DEFAULT_CONFIG;
  const redisKey = `ratelimit:${key}`;

  try {
    const current = await redis.incr(redisKey);
    if (current === 1) {
      await redis.expire(redisKey, window);
    }

    const ttl = await redis.ttl(redisKey);
    return {
      limited: current > limit,
      remaining: Math.max(0, limit - current),
      resetAt: Date.now() + (ttl * 1000),
    };
  } catch {
    // If Redis is down, allow the request
    return { limited: false, remaining: limit, resetAt: Date.now() + window * 1000 };
  }
}

export function getRouteLimit(pathname: string): RateLimitConfig {
  for (const [path, config] of Object.entries(STRIPER_CONFIG)) {
    if (path !== 'default' && pathname.startsWith(path)) {
      return config;
    }
  }
  return STRIPER_CONFIG.default;
}
