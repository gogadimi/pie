// Production alerting system for monitoring errors, slow queries, and outages
import { sendNotification } from '@/lib/notifications';
import { logger } from '@/lib/utils';

interface MonitoringAlert {
  type: 'error' | 'warning' | 'performance' | 'availability';
  module: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

const alertCache = new Map<string, number>();
const ALERT_COOLDOWN = 5 * 60 * 1000;

export async function triggerAlert(alert: MonitoringAlert) {
  const key = `${alert.type}-${alert.module}-${alert.message}`;
  const lastAlerted = alertCache.get(key) || 0;
  if (Date.now() - lastAlerted < ALERT_COOLDOWN) return;
  
  alertCache.set(key, Date.now());
  logger[alert.severity === 'error' ? 'error' : alert.severity === 'warning' ? 'warn' : 'info'](alert.message, alert.module, alert.metadata);

  if (alert.severity === 'high' || alert.severity === 'critical') {
    await sendNotification({
      title: `[PIE] ${alert.severity.toUpperCase()}: ${alert.type}`,
      message: alert.message,
      type: alert.severity === 'critical' ? 'critical' : 'warning',
      timestamp: new Date().toISOString(),
      metadata: alert.metadata,
    });
  }
}

export async function checkSystemHealth() {
  try {
    const res = await fetch('http://localhost:3000/api/health');
    const data = await res.json();
    if (data.status === 'unhealthy') {
      await triggerAlert({ type: 'availability', module: 'health', message: 'System is unhealthy', severity: 'critical', metadata: data });
    }
  } catch (error: any) {
    await triggerAlert({ type: 'availability', module: 'health', message: 'Health check endpoint unreachable', severity: 'critical' });
  }
}

export function trackError(error: Error, context: Record<string, any>): void {
  logger.error('Production Error', 'monitoring', error);
  triggerAlert({
    type: 'error',
    module: context.module || 'unknown',
    message: error.message,
    severity: 'high',
    metadata: { stack: error.stack, context },
  });
}

export function trackSlowQuery(query: string, durationMs: number, thresholdMs = 1000): void {
  if (durationMs > thresholdMs) {
    triggerAlert({
      type: 'performance',
      module: 'database',
      message: `Slow query took ${durationMs}ms (threshold: ${thresholdMs}ms)`,
      severity: 'medium',
      metadata: { query, durationMs, thresholdMs },
    });
  }
}

export function trackAPILatency(endpoint: string, method: string, durationMs: number): void {
  if (durationMs > 5000) {
    triggerAlert({
      type: 'performance',
      module: 'api',
      message: `${method} ${endpoint} took ${durationMs}ms`,
      severity: 'medium',
      metadata: { endpoint, method, durationMs },
    });
  }
}
