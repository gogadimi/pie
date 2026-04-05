import { Redis } from '@upstash/redis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  retry: {
    retries: 3,
    backoff: (retryCount) => Math.min(retryCount * 100, 500),
  },
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
