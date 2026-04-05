/**
 * ML Insights Dashboard Widget
 * 
 * Displays ML-based pricing insights including:
 * - Price trend sparklines and direction
 * - Elasticity analysis
 * - Competitor price forecasts
 * - Action recommendation badges
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Minus, Brain, Target,
  AlertCircle, ChevronRight, Sparkles, BarChart3,
  ArrowUpRight, ArrowDownRight, Loader2,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────

interface TrendInfo {
  direction: 'up' | 'down' | 'stable';
  slope: number;
  rSquared: number;
  sma7: number;
  ema14: number;
  volatility: number;
  sparkline: number[];
}

interface ElasticityInfo {
  elasticity: number;
  category: string;
  sensitivity: string;
  optimalPrice: number | null;
}

interface ForecastInfo {
  competitorName: string | null;
  currentPrice: number;
  predictedPrice: number;
  daysAhead: number;
  confidence: number;
}

interface MLInsightsData {
  productId: string;
  productName: string;
  currentPrice: number;
  trend: TrendInfo;
  elasticity: ElasticityInfo;
  forecasts: ForecastInfo[];
  recommendedAction: string;
  confidence: number;
}

interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

// ─── Sparkline Mini-Chart ──────────────────────────────────────────────

function Sparkline({ data, color, width = 80, height = 28 }: SparklineProps) {
  if (!data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── ML Insight Row ────────────────────────────────────────────────────

function MLInsightCard({ insight }: { insight: MLInsightsData }) {
  const trendColor = insight.trend.direction === 'up' ? 'text-red-500' :
    insight.trend.direction === 'down' ? 'text-emerald-500' : 'text-slate-400';

  const trendIcon = insight.trend.direction === 'up' ? <ArrowUpRight className="w-4 h-4 text-red-500" /> :
    insight.trend.direction === 'down' ? <ArrowDownRight className="w-4 h-4 text-emerald-500" /> :
      <Minus className="w-4 h-4 text-slate-400" />;

  const elasticityBadge = insight.elasticity.elasticity > 1 ?
    { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Elastic' } :
    insight.elasticity.elasticity < 0.5 ?
      { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Inelastic' } :
      { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Unit' };

  const actionColor = insight.recommendedAction === 'raise' ?
    { bg: 'bg-red-100', text: 'text-red-700', icon: <TrendingUp className="w-3 h-3" /> } :
    insight.recommendedAction === 'lower' ?
      { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <TrendingDown className="w-3 h-3" /> } :
      { bg: 'bg-slate-100', text: 'text-slate-600', icon: <Minus className="w-3 h-3" /> };

  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{insight.productName}</h3>
          <p className="text-xs text-slate-400">
            {insight.currentPrice > 0 ? `€${insight.currentPrice.toFixed(2)}` : 'No price data'}
          </p>
        </div>
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${actionColor.bg} ${actionColor.text}`}>
          {actionColor.icon}
          {insight.recommendedAction.charAt(0).toUpperCase() + insight.recommendedAction.slice(1)}
        </div>
      </div>

      {/* Sparkline + Trend */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1">
          <Sparkline
            data={insight.trend.sparkline}
            color={insight.trend.direction === 'down' ? '#10b981' : insight.trend.direction === 'up' ? '#ef4444' : '#94a3b8'}
          />
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            {trendIcon}
            {insight.trend.direction === 'up' ? 'Uptrend' : insight.trend.direction === 'down' ? 'Downtrend' : 'Stable'}
          </div>
          {insight.trend.rSquared > 0 && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              R² = {insight.trend.rSquared.toFixed(2)}
            </p>
          )}
          {insight.trend.volatility > 0 && (
            <p className="text-[10px] text-slate-400">
              Vol: {insight.trend.volatility.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Elasticity */}
      <div className="flex items-center gap-3 mb-3 py-2 border-t border-b border-slate-100">
        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${elasticityBadge.bg} ${elasticityBadge.text}`}>
          {elasticityBadge.label}
        </div>
        <span className="text-xs text-slate-500">
          E = {insight.elasticity.elasticity.toFixed(2)}
        </span>
        {insight.elasticity.sensitivity && (
          <span className="text-[10px] text-slate-400">
            ({insight.elasticity.sensitivity} sensitivity)
          </span>
        )}
        {insight.elasticity.optimalPrice !== null && insight.elasticity.optimalPrice > 0 && (
          <span className="text-[10px] text-emerald-600 font-medium ml-auto flex items-center gap-0.5">
            <Target className="w-3 h-3" />
            Optimal: €{insight.elasticity.optimalPrice.toFixed(2)}
          </span>
        )}
      </div>

      {/* Forecasts */}
      {insight.forecasts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Competitor Forecast</p>
          {insight.forecasts.slice(0, 2).map((f, i) => {
            const priceDir = f.predictedPrice < f.currentPrice ? 'down' : 'up';
            return (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 truncate flex-1">
                  {f.competitorName || 'Competitor'}
                </span>
                <span className="flex items-center gap-1 text-slate-500 tabular-nums">
                  €{f.currentPrice.toFixed(2)}
                  {priceDir === 'down' ?
                    <ArrowDownRight className="w-3 h-3 text-emerald-500" /> :
                    <ArrowUpRight className="w-3 h-3 text-red-500" />}
                  €{f.predictedPrice.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 w-12 text-right">
                  {f.daysAhead}d · {(f.confidence * 100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Confidence */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Brain className="w-3 h-3 text-violet-400" />
          <span className="text-[10px] text-slate-400">ML Confidence</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-violet-500 transition-all"
              style={{ width: `${Math.min(100, insight.confidence * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-medium tabular-nums">
            {(insight.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

interface MLInsightsProps {
  orgId?: string;
  maxProducts?: number;
}

export default function MLInsights({ orgId, maxProducts = 4 }: MLInsightsProps) {
  const [insights, setInsights] = useState<MLInsightsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch products for the org
      const orgQuery = orgId ? `&organizationId=${encodeURIComponent(orgId)}` : '';
      const [productsRes, recsRes] = await Promise.all([
        fetch(`/api/products?limit=10${orgQuery}`),
        fetch(`/api/recommendations?ml=true${orgQuery}`),
      ]);

      const productsData = await productsRes.json();
      const recsData = await recsRes.json().catch(() => null);

      if (!productsData?.success || !productsData.products?.length) {
        setLoading(false);
        return;
      }

      const results: MLInsightsData[] = [];

      for (const product of productsData.products.slice(0, maxProducts)) {
        try {
          const res = await fetch(`/api/ml/analytics?productId=${product.id}`);
          if (!res.ok) continue;

          const mlData = await res.json();
          if (!mlData?.success) continue;

          const trend = mlData.trend || {};
          const elasticity = mlData.elasticity || {};
          const forecasts = mlData.forecasts || [];
          const recommendation = mlData.recommendation || {};

          // Generate sparkline from price history
          const sparkline: number[] = (mlData.priceHistory || []).slice(-20).map(
            (p: any) => p.price ? parseFloat(p.price) : 0
          ).filter(Boolean);

          results.push({
            productId: product.id,
            productName: product.name,
            currentPrice: product.currentPrice ? parseFloat(product.currentPrice) : 0,
            trend: {
              direction: trend.direction || 'stable',
              slope: trend.slope || 0,
              rSquared: trend.rSquared || 0,
              sma7: trend.sma7 || 0,
              ema14: trend.ema14 || 0,
              volatility: trend.volatility || 0,
              sparkline: sparkline.length >= 2 ? sparkline : [product.currentPrice ? parseFloat(product.currentPrice) : 0],
            },
            elasticity: {
              elasticity: elasticity.elasticity || 0,
              category: elasticity.category || '',
              sensitivity: elasticity.sensitivity || '',
              optimalPrice: elasticity.optimalPrice || null,
            },
            forecasts: forecasts.slice(0, 3).map((f: any) => ({
              competitorName: f.competitorName ?? null,
              currentPrice: f.currentPrice || 0,
              predictedPrice: f.prediction || 0,
              daysAhead: f.daysAhead || 7,
              confidence: f.confidence || 0,
            })),
            recommendedAction: recommendation.action || 'hold',
            confidence: recommendation.confidence || 0.5,
          });
        } catch (e) {
          // Skip individual failures
        }
      }

      setInsights(results);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [orgId, maxProducts]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-5 h-5 text-violet-500" />
          <h2 className="text-sm font-semibold text-slate-800">ML Pricing Insights</h2>
          <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
        </div>
        <div className="text-center py-8 text-slate-400 text-sm">
          Analyzing pricing patterns...
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-5 h-5 text-violet-500" />
          <h2 className="text-sm font-semibold text-slate-800">ML Pricing Insights</h2>
        </div>
        <div className="text-center py-8">
          <Brain className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No ML data yet.</p>
          <p className="text-xs text-slate-400 mt-1">More price history data improves ML accuracy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-violet-500" />
          <h2 className="text-sm font-semibold text-slate-800">ML Pricing Insights</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 font-medium">
            {insights.length} products
          </span>
        </div>
        <button
          onClick={loadInsights}
          className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 py-2 bg-red-50 border-b border-red-100">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Cards */}
      <div className="p-5 space-y-4">
        {insights.map((insight) => (
          <MLInsightCard key={insight.productId} insight={insight} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <Sparkles className="w-3 h-3" />
          Powered by ML models · Elasticity + Forecast + Trend
        </div>
      </div>
    </div>
  );
}
