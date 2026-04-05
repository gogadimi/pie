'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useDashboard } from './layout';
import RealTimeFeed from '@/components/RealTimeFeed';
import MLInsights from '@/components/MLInsights';
import {
  TrendingUp, TrendingDown, DollarSign, Package, Users2,
  Bell, Brain, Zap, AlertTriangle, ArrowRight, Globe, Sparkles, Wifi,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  currentPrice: string | null;
  costPrice: string | null;
  currency: string;
  category: string | null;
  createdAt: string | null;
}

export default function DashboardPage() {
  const { orgId, stats, refreshStats } = useDashboard();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    fetch(`/api/products?orgId=${orgId}&limit=5`)
      .then(r => r.json())
      .then(data => { if (data.success) setProducts(data.products || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => {
    fetchProducts();
    refreshStats();
  }, [fetchProducts, refreshStats]);

  const margin = (price: string | null, cost: string | null) => {
    if (!price || !cost || parseFloat(price) === 0) return null;
    return ((parseFloat(price) - parseFloat(cost)) / parseFloat(price) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your pricing intelligence</p>
        </div>
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
        >
          <Package className="w-4 h-4" /> Add Products <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Products', value: stats?.totalProducts || 0, icon: Package, color: 'indigo' },
          { label: 'Competitors', value: stats?.totalCompetitors || 0, icon: Users2, color: 'emerald' },
          { label: 'Price Checks', value: stats?.priceUpdatesLast7d || 0, icon: Zap, color: 'amber' },
          { label: 'Active Jobs', value: stats?.activeJobs || 0, icon: TrendingUp, color: 'blue' },
          { label: 'Unread Alerts', value: stats?.unreadAlerts || 0, icon: Bell, color: 'red' },
          { label: 'Pending AI', value: stats?.pendingRecommendations || 0, icon: Brain, color: 'violet' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <kpi.icon className={`w-5 h-5 text-${kpi.color}-500`} />
            </div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{kpi.label}</p>
            <p className={`text-2xl font-bold text-${kpi.color}-600 mt-1`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Real-Time Live Feed */}
      <div>
        <RealTimeFeed orgId={orgId || undefined} maxVisible={8} />
      </div>

      {/* ML Pricing Insights */}
      <div>
        <MLInsights orgId={orgId || undefined} maxProducts={3} />
      </div>

      {/* Recent Products */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Recent Products</h2>
          <Link href="/dashboard/products" className="text-sm text-indigo-600 hover:underline font-medium">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Product</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Price</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Cost</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Margin</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-slate-500 mb-3">No products yet. Start by adding your first product!</p>
                    <Link
                      href="/dashboard/products"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                    >
                      <Package className="w-4 h-4" /> Add Product
                    </Link>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const m = margin(p.currentPrice, p.costPrice);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3">
                        <p className="text-sm font-medium text-slate-900">{p.name}</p>
                        {p.sku && <p className="text-xs text-slate-400 font-mono">{p.sku}</p>}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <p className="text-sm font-semibold text-slate-800">
                          {p.currency} {p.currentPrice || '—'}
                        </p>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <p className="text-sm text-slate-600">
                          {p.currency} {p.costPrice || '—'}
                        </p>
                      </td>
                      <td className="px-6 py-3 text-right">
                        {m !== null ? (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            parseFloat(m) > 30 ? 'bg-emerald-100 text-emerald-700' :
                            parseFloat(m) > 15 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {m}%
                          </span>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {p.category ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            {p.category}
                          </span>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/scraping" className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:shadow-md transition-shadow">
          <Globe className="w-6 h-6 text-blue-500 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">Test Scraping</h3>
          <p className="text-xs text-slate-500 mt-1">Scrape a competitor URL and see real-time results</p>
        </Link>
        <Link href="/dashboard/simulator" className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl hover:shadow-md transition-shadow">
          <TrendingUp className="w-6 h-6 text-emerald-500 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">Price Simulator</h3>
          <p className="text-xs text-slate-500 mt-1">Test different prices and see projected outcomes</p>
        </Link>
        <Link href="/dashboard/recommendations" className="p-5 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-xl hover:shadow-md transition-shadow">
          <Brain className="w-6 h-6 text-violet-500 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">AI Recommendations</h3>
          <p className="text-xs text-slate-500 mt-1">Review pricing suggestions generated by AI</p>
        </Link>
      </div>
    </div>
  );
}
