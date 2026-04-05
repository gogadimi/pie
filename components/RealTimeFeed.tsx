/**
 * Real-time price feed dashboard widget.
 * 
 * Displays live price changes, alerts, and job statuses from the SSE stream.
 * Features:
 * - Color-coded price movements (green for drop, red for increase)
 * - Auto-scrolling feed of latest updates
 * - Connection status indicator
 * - Animated flash on new data
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { usePriceStream, PriceUpdate, AlertItem, JobStatus } from '@/hooks/usePriceStream';
import {
  Wifi,
  WifiOff,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  Package,
  Globe,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────

interface FeedItem {
  id: string;
  timestamp: number;
  kind: 'price' | 'alert' | 'job';
  label: string;
  description: string;
  color: 'green' | 'red' | 'amber' | 'blue' | 'neutral';
}

// ─── Helpers ───────────────────────────────────────────────────────────

function priceDirectionColor(
  currentPrice: string | null,
  previousPrice: string | null
): 'green' | 'red' | 'neutral' {
  if (!currentPrice || !previousPrice) return 'neutral';
  const curr = parseFloat(currentPrice);
  const prev = parseFloat(previousPrice);
  if (isNaN(curr) || isNaN(prev)) return 'neutral';
  if (curr < prev) return 'green';
  if (curr > prev) return 'red';
  return 'neutral';
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 1000) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return formatTimestamp(ts);
}

// ─── Icon maps ─────────────────────────────────────────────────────────

const severityIcon: Record<string, React.ReactNode> = {
  low: <Globe className="w-4 h-4 text-slate-400" />,
  medium: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  high: <AlertTriangle className="w-4 h-4 text-orange-500" />,
  critical: <XCircle className="w-4 h-4 text-red-500" />,
};

const jobStatusIcon: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  failed: <XCircle className="w-4 h-4 text-red-500" />,
  running: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
};

const colorClasses: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  green: {
    bg: 'bg-emerald-50',
    border: 'border-l-emerald-400',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-l-red-400',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-l-amber-400',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
  },
  blue: {
    bg: 'bg-sky-50',
    border: 'border-l-sky-400',
    text: 'text-sky-700',
    badge: 'bg-sky-100 text-sky-700',
  },
  neutral: {
    bg: 'bg-slate-50',
    border: 'border-l-slate-300',
    text: 'text-slate-700',
    badge: 'bg-slate-100 text-slate-600',
  },
};

// ─── Feed Item Component ───────────────────────────────────────────────

function FeedItemRow({ item, isNew }: { item: FeedItem; isNew: boolean }) {
  const classes = colorClasses[item.color] || colorClasses.neutral;
  const [flash, setFlash] = useState(isNew);

  // Re-trigger flash animation on mount
  useEffect(() => {
    if (isNew) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 border-l-4 ${classes.border} ${classes.bg} 
        transition-all duration-500 ${flash ? 'ring-2 ring-indigo-300/50 ring-offset-1' : ''}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {item.kind === 'price' && (
          item.color === 'green' ? (
            <TrendingDown className="w-4 h-4 text-emerald-500" />
          ) : item.color === 'red' ? (
            <TrendingUp className="w-4 h-4 text-red-500" />
          ) : (
            <Package className="w-4 h-4 text-slate-400" />
          )
        )}
        {item.kind === 'alert' && severityIcon.medium}
        {item.kind === 'job' && jobStatusIcon[item.description.split(' ')[0]?.toLowerCase()] || <Loader2 className="w-4 h-4 text-blue-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${classes.text} truncate`}>
          {item.label}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</p>
      </div>
      <span className="text-[10px] text-slate-400 flex-shrink-0 tabular-nums">
        {formatRelativeTime(item.timestamp)}
      </span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

interface RealTimeFeedProps {
  orgId?: string;
  maxVisible?: number;
  autoScroll?: boolean;
}

export default function RealTimeFeed({
  orgId,
  maxVisible = 50,
  autoScroll = true,
}: RealTimeFeedProps) {
  const { prices, alerts, jobs, isConnected, error, reconnect } = usePriceStream({
    orgId,
    maxItems: maxVisible,
  });

  const feedContainerRef = useRef<HTMLDivElement>(null);
  const prevItemsLengthRef = useRef(0);
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());

  // Merge all events into a single sorted feed
  const feedItems: FeedItem[] = [];

  // Track previous prices for direction detection
  const priceHistory = useRef<Map<string, string>>(new Map());

  // Add price events
  for (const p of prices) {
    const prev = priceHistory.current.get(p.productId);
    const direction = priceDirectionColor(p.price, prev ?? null);
    if (p.price) {
      priceHistory.current.set(p.productId, p.price);
    }

    feedItems.push({
      id: p.id,
      timestamp: p.timestamp,
      kind: 'price',
      label: `Price update: ${p.productName || p.productId}`,
      description: `${p.currency ?? ''} ${p.price} — ${p.inStock ? 'In stock' : 'Out of stock'}${p.discountPct ? ` (${p.discountPct}% off)` : ''}`,
      color: direction,
    });
  }

  // Add alert events
  for (const a of alerts) {
    feedItems.push({
      id: a.id,
      timestamp: a.timestamp,
      kind: 'alert',
      label: `Alert: ${a.alertType}`,
      description: a.message,
      color: a.severity === 'critical' || a.severity === 'high' ? 'amber' : 'neutral',
    });
  }

  // Add job events
  for (const j of jobs) {
    feedItems.push({
      id: j.id,
      timestamp: j.timestamp,
      kind: 'job',
      label: `Job ${j.status}`,
      description: `${j.competitorUrl || j.competitorId}${j.productName ? ` — ${j.productName}` : ''}${j.duration ? ` (${Math.round(j.duration)}ms)` : ''}${j.errorMessage ? ` — Error: ${j.errorMessage}` : ''}`,
      color: j.status === 'completed' ? 'green' : j.status === 'failed' ? 'red' : 'blue',
    });
  }

  // Sort by timestamp descending (newest first)
  feedItems.sort((a, b) => b.timestamp - a.timestamp);

  // Detect new items (for flash animation)
  const currentIds = new Set(feedItems.map((i) => i.id));
  if (feedItems.length > prevItemsLengthRef.current) {
    const newIds = new Set<string>();
    for (const item of feedItems) {
      if (prevItemsLengthRef.current === 0 || !newItemIds.has(item.id)) {
        newIds.add(item.id);
      }
    }
    setNewItemIds(newIds);
  }
  prevItemsLengthRef.current = feedItems.length;

  // Auto-scroll to top on new items
  useEffect(() => {
    if (autoScroll && feedContainerRef.current && feedItems.length > prevItemsLengthRef.current) {
      feedContainerRef.current.scrollTop = 0;
    }
  }, [feedItems.length, autoScroll]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-800">Live Feed</h2>
          {/* Connection status */}
          <div className="flex items-center gap-1">
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] text-emerald-600 font-medium">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-red-400" />
                <span className="text-[10px] text-red-500 font-medium">Offline</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Stats badges */}
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            {feedItems.length}
          </span>
          {/* Reconnect button */}
          {!isConnected && (
            <button
              onClick={reconnect}
              className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium transition-colors"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-5 py-2 bg-red-50 border-b border-red-100">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Feed */}
      <div
        ref={feedContainerRef}
        className="max-h-96 overflow-y-auto divide-y divide-slate-100"
      >
        {feedItems.length === 0 ? (
          <div className="px-6 py-12 text-center">
            {isConnected ? (
              <>
                <Loader2 className="w-6 h-6 text-slate-300 animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-400">Waiting for events...</p>
              </>
            ) : (
              <>
                <WifiOff className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Not connected to stream</p>
              </>
            )}
          </div>
        ) : (
          feedItems.slice(0, maxVisible).map((item) => (
            <FeedItemRow
              key={item.id}
              item={item}
              isNew={newItemIds.has(item.id)}
            />
          ))
        )}
      </div>

      {/* Footer with summary */}
      {feedItems.length > 0 && (
        <div className="px-5 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span>{prices.length} price updates</span>
            <span>·</span>
            <span>{alerts.length} alerts</span>
            <span>·</span>
            <span>{jobs.length} jobs</span>
          </div>
          {prices.length > 0 && (
            <span className="text-[10px] text-slate-400">
              Last: {formatTimestamp(feedItems[0]?.timestamp ?? 0)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
