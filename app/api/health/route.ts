import { NextResponse } from 'next/server';
import { checkDbConnection } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function GET() {
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: { database: 'unknown', redis: 'unknown' },
  };

  try {
    const dbOk = await checkDbConnection();
    health.services.database = dbOk ? 'connected' : 'disconnected';
    if (!dbOk) health.status = 'degraded';
  } catch { health.services.database = 'error'; health.status = 'degraded'; }

  try {
    await redis.ping();
    health.services.redis = 'connected';
  } catch { health.services.redis = 'disconnected'; if (health.status === 'ok') health.status = 'degraded'; }

  return NextResponse.json(health, { status: health.status === 'ok' ? 200 : 503 });
}
