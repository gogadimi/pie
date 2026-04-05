// Simple production monitoring utilities
import { checkDbConnection } from '@/db';
import { redis } from '@/lib/redis';

export interface HealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: Record<string, { status: 'ok' | 'error'; latency?: number }>;
  metrics: { memory?: number };
}

// Track start time
const startTime = Date.now();

export async function getHealthReport(): Promise<HealthReport> {
  const report: HealthReport = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    services: {},
    metrics: {},
  };

  // Check DB
  try {
    const start = Date.now();
    const dbOk = await checkDbConnection();
    report.services.database = { status: dbOk ? 'ok' : 'error', latency: Date.now() - start };
    if (!dbOk) report.status = 'degraded';
  } catch { report.services.database = { status: 'error' }; report.status = 'unhealthy'; }

  // Check Redis
  try {
    const start = Date.now();
    await redis.ping();
    report.services.redis = { status: 'ok', latency: Date.now() - start };
  } catch { report.services.redis = { status: 'error' }; if (report.status === 'healthy') report.status = 'degraded'; }

  return report;
}

export function logEvent(level: 'info' | 'warn' | 'error', module: string, message: string) {
  const ts = new Date().toISOString();
  const entry = { level, module, message, timestamp: ts };
  if (level === 'error') console.error(JSON.stringify(entry));
  else if (level === 'warn') console.warn(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}
