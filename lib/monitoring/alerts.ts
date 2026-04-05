// Production alerting system for monitoring errors, slow queries, and outages
import { sendNotification } from '@/lib/notifications';

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
  
  console[`log`](JSON.stringify({ level: alert.severity, module: alert.module, message: alert.message, timestamp: new Date().toISOString() }));

  if (alert.severity === 'high' || alert.severity === 'critical') {
    await sendNotification({
      title: `[PIE] ${alert.severity.toUpperCase()}: ${alert.type}`,
      message: alert.message,
      type: 'info',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function checkSystemHealth() {
  try {
    const res = await fetch('http://localhost:3000/api/health');
    const data = await res.json();
    if (data.status === 'unhealthy') {
      await triggerAlert({ type: 'availability', module: 'health', message: 'System is unhealthy', severity: 'critical' });
    }
  } catch (error: unknown) {
    await triggerAlert({ type: 'availability', module: 'health', message: 'Health check failed', severity: 'critical' });
  }
}

export function trackError(error: Error, context: Record<string, any>): void {
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
      message: `Slow query: ${durationMs}ms (threshold: ${thresholdMs}ms)`,
      severity: 'medium',
      metadata: { query, durationMs, thresholdMs },
    });
  }
}
