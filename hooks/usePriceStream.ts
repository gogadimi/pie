/**
 * Client-side hook for Server-Sent Events (SSE) real-time price stream.
 * 
 * Uses the native EventSource API to connect to /api/stream and maintains
 * a live list of recent price updates, alerts, and job statuses.
 * Implements auto-reconnect with exponential backoff on disconnect.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PriceUpdate {
  id: string;
  type: 'price';
  timestamp: number;
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
}

export interface AlertItem {
  id: string;
  type: 'alert';
  timestamp: number;
  alertId: string;
  alertType: string;
  message: string;
  severity: string;
  organizationId: string;
}

export interface JobStatus {
  id: string;
  type: 'job';
  timestamp: number;
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
}

interface UsePriceStreamReturn {
  prices: PriceUpdate[];
  alerts: AlertItem[];
  jobs: JobStatus[];
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
  disconnect: () => void;
}

// ─── Configuration ─────────────────────────────────────────────────────────

const MAX_ITEMS = 50; // Maximum events to keep per type
const DEFAULT_POLL_INTERVAL_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000; // 30 seconds max backoff
const MIN_RECONNECT_DELAY_MS = 1000; // 1 second min backoff

// ─── Hook ──────────────────────────────────────────────────────────────────

export function usePriceStream(
  options?: {
    pollIntervalMs?: number;
    maxItems?: number;
    orgId?: string;
    enabled?: boolean;
  }
): UsePriceStreamReturn {
  const {
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    maxItems = MAX_ITEMS,
    orgId,
    enabled = true,
  } = options || {};

  const [prices, setPrices] = useState<PriceUpdate[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const orgIdRef = useRef(orgId || 'demo-org');

  // Update ref when orgId changes
  useEffect(() => {
    if (orgId) {
      orgIdRef.current = orgId;
    }
  }, [orgId]);

  const trimArray = useCallback(<T extends { id: string }>(arr: T[], max: number): T[] => {
    if (arr.length <= max) return arr;
    return arr.slice(arr.length - max);
  }, []);

  const handleEvent = useCallback(
    (eventType: 'price' | 'alert' | 'job', raw: unknown) => {
      const data = raw as Record<string, unknown>;
      const baseEvent = {
        id: (data?.id as string) || crypto.randomUUID(),
        timestamp: (data?.timestamp as number) || Date.now(),
        type: eventType,
      };

      switch (eventType) {
        case 'price':
          setPrices((prev) => {
            const newPrices = [...prev, { ...baseEvent, ...data } as PriceUpdate];
            return trimArray(newPrices, maxItems);
          });
          break;
        case 'alert':
          setAlerts((prev) => {
            const newAlerts = [...prev, { ...baseEvent, ...data } as AlertItem];
            return trimArray(newAlerts, maxItems);
          });
          break;
        case 'job':
          setJobs((prev) => {
            const newJobs = [...prev, { ...baseEvent, ...data } as JobStatus];
            return trimArray(newJobs, maxItems);
          });
          break;
      }
    },
    [maxItems, trimArray]
  );

  const connect = useCallback(() => {
    if (!enabled) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      const orgQuery = orgIdRef.current ? `?orgId=${encodeURIComponent(orgIdRef.current)}` : '';
      const url = `/api/stream${orgQuery}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptRef.current = 0;
      };

      // Listen for specific event types
      eventSource.addEventListener('price', (e) => {
        try {
          const data = JSON.parse(e.data);
          handleEvent('price', data);
        } catch (err) {
          console.error('[usePriceStream] Failed to parse price event:', err);
        }
      });

      eventSource.addEventListener('alert', (e) => {
        try {
          const data = JSON.parse(e.data);
          handleEvent('alert', data);
        } catch (err) {
          console.error('[usePriceStream] Failed to parse alert event:', err);
        }
      });

      eventSource.addEventListener('job', (e) => {
        try {
          const data = JSON.parse(e.data);
          handleEvent('job', data);
        } catch (err) {
          console.error('[usePriceStream] Failed to parse job event:', err);
        }
      });

      eventSource.onerror = () => {
        setIsConnected(false);
        setError('Connection lost. Reconnecting...');

        // Exponential backoff for reconnection
        const attempt = reconnectAttemptRef.current;
        const delay = Math.min(
          MIN_RECONNECT_DELAY_MS * Math.pow(2, attempt),
          MAX_RECONNECT_DELAY_MS
        );
        reconnectAttemptRef.current = attempt + 1;

        // Close the broken connection
        eventSource.close();
        eventSourceRef.current = null;

        // Schedule reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    } catch (err: any) {
      setError(`Failed to connect: ${err.message}`);
      setIsConnected(false);
    }
  }, [enabled, handleEvent]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttemptRef.current = 0;
    disconnect();
    // Small delay to ensure cleanup is complete
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  // Manage connection lifecycle
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Poll-based fallback: if EventSource is not supported or fails,
  // fall back to polling the stream endpoint
  useEffect(() => {
    if (typeof window === 'undefined' || typeof (window as any).EventSource === 'undefined') {
      console.warn('[usePriceStream] EventSource not supported, falling back to polling');

      const pollInterval = setInterval(async () => {
        try {
          const orgQuery = orgIdRef.current ? `?orgId=${encodeURIComponent(orgIdRef.current)}` : '';
          const response = await fetch(`/api/stream${orgQuery}`, {
            headers: { Accept: 'text/event-stream' },
          });
          if (response.ok) {
            setIsConnected(true);
          } else {
            setIsConnected(false);
          }
        } catch {
          setIsConnected(false);
        }
      }, pollIntervalMs * 5); // Longer interval for polling fallback

      return () => clearInterval(pollInterval);
    }
  }, [pollIntervalMs]);

  return {
    prices,
    alerts,
    jobs,
    isConnected,
    error,
    reconnect,
    disconnect,
  };
}

export default usePriceStream;
