'use client';

import { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, ArrowRight, Search, Filter, Download, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface CompetitorPrice {
  competitorName: string;
  price: number;
  originalPrice: number | null;
  discountPct: number | null;
  inStock: boolean;
  lastUpdated: string;
}

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  ourPrice: number;
  costPrice: number;
  currency: string;
  avgCompetitorPrice: number;
  minCompetitorPrice: number;
  maxCompetitorPrice: number;
  marketPosition: 'cheapest' | 'below_avg' | 'average' | 'above_avg' | 'premium';
  competitors: CompetitorPrice[];
  priceChange7d: number;
  alerts: number;
}

const mockData: ProductRow[] = [
  {
    id: '1', name: 'MacBook Air M3 15"', sku: 'MBP-M3-15-256',
    ourPrice: 1299, costPrice: 950, currency: 'USD',
    avgCompetitorPrice: 1338, minCompetitorPrice: 1199, maxCompetitorPrice: 1499,
    marketPosition: 'below_avg',
    competitors: [
      { competitorName: 'Apple Store', price: 1299, originalPrice: null, discountPct: null, inStock: true, lastUpdated: '2026-04-05 10:00' },
      { competitorName: 'Best Buy', price: 1249, originalPrice: 1299, discountPct: 3.8, inStock: true, lastUpdated: '2026-04-05 09:30' },
      { competitorName: 'Amazon', price: 1199, originalPrice: 1299, discountPct: 7.7, inStock: true, lastUpdated: '2026-04-05 10:05' },
      { competitorName: 'Walmart', price: 1499, originalPrice: null, discountPct: null, inStock: false, lastUpdated: '2026-04-04 15:00' },
    ],
    priceChange7d: -2.3, alerts: 1,
  },
  {
    id: '2', name: 'iPhone 16 Pro 256GB', sku: 'IP16P-256-BLK',
    ourPrice: 1099, costPrice: 720, currency: 'USD',
    avgCompetitorPrice: 1086, minCompetitorPrice: 999, maxCompetitorPrice: 1199,
    marketPosition: 'above_avg',
    competitors: [
      { competitorName: 'Apple Store', price: 1099, originalPrice: null, discountPct: null, inStock: true, lastUpdated: '2026-04-05 10:00' },
      { competitorName: 'Amazon', price: 999, originalPrice: 1099, discountPct: 9.1, inStock: true, lastUpdated: '2026-04-05 09:50' },
      { competitorName: 'Best Buy', price: 1049, originalPrice: 1099, discountPct: 4.5, inStock: true, lastUpdated: '2026-04-05 09:00' },
      { competitorName: 'Target', price: 1199, originalPrice: null, discountPct: null, inStock: true, lastUpdated: '2026-04-04 14:00' },
    ],
    priceChange7d: 0, alerts: 2,
  },
  {
    id: '3', name: 'Sony WH-1000XM5', sku: 'SNY-WH1000XM5-B',
    ourPrice: 279, costPrice: 155, currency: 'USD',
    avgCompetitorPrice: 299, minCompetitorPrice: 248, maxCompetitorPrice: 349,
    marketPosition: 'below_avg',
    competitors: [
      { competitorName: 'Amazon', price: 278, originalPrice: 349, discountPct: 20.3, inStock: true, lastUpdated: '2026-04-05 10:10' },
      { competitorName: 'Best Buy', price: 299, originalPrice: 349, discountPct: 14.3, inStock: true, lastUpdated: '2026-04-05 08:00' },
      { competitorName: 'Walmart', price: 349, originalPrice: null, discountPct: null, inStock: true, lastUpdated: '2026-04-04 20:00' },
    ],
    priceChange7d: -5.1, alerts: 0,
  },
  {
    id: '4', name: 'AirPods Pro (2nd Gen)', sku: 'APP-AIRPODS-PRO2',
    ourPrice: 199, costPrice: 120, currency: 'USD',
    avgCompetitorPrice: 195, minCompetitorPrice: 169, maxCompetitorPrice: 249,
    marketPosition: 'average',
    competitors: [
      { competitorName: 'Apple Store', price: 249, originalPrice: null, discountPct: null, inStock: true, lastUpdated: '2026-04-05 10:00' },
      { competitorName: 'Amazon', price: 169, originalPrice: 199, discountPct: 15.1, inStock: true, lastUpdated: '2026-04-05 10:15' },
      { competitorName: 'Costco', price: 179, originalPrice: 199, discountPct: 10.1, inStock: true, lastUpdated: '2026-04-05 07:00' },
      { competitorName: 'Best Buy', price: 199, originalPrice: null, discountPct: null, inStock: true, lastUpdated: '2026-04-05 09:00' },
    ],
    priceChange7d: 3.1, alerts: 1,
  },
];

function getPositionBadge(pos: string) {
  const colors: Record<string, string> = {
    cheapest: 'bg-emerald-100 text-emerald-700',
    below_avg: 'bg-lime-100 text-lime-700',
    average: 'bg-amber-100 text-amber-700',
    above_avg: 'bg-orange-100 text-orange-700',
    premium: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
    cheapest: '🟢 Najevtin',
    below_avg: '🟢 Pod prosek',
    average: '🟡 Prosek',
    above_avg: '🟠 Nad prosek',
    premium: '🔴 Premium',
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${colors[pos]}`}>
      {labels[pos]}
    </span>
  );
}

export default function PriceMapPage() {
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return mockData.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesPosition = positionFilter === 'all' || p.marketPosition === positionFilter;
      return matchesSearch && matchesPosition;
    });
  }, [search, positionFilter]);

  const stats = useMemo(() => {
    const cheapest = mockData.filter(p => p.marketPosition === 'cheapest' || p.marketPosition === 'below_avg').length;
    const avg = mockData.filter(p => p.marketPosition === 'average').length;
    const premium = mockData.filter(p => p.marketPosition === 'above_avg' || p.marketPosition === 'premium').length;
    const margin = mockData.reduce((sum, p) => sum + ((p.ourPrice - p.costPrice) / p.ourPrice) * 100, 0) / mockData.length;
    return { cheapest, avg, premium, avgMargin: margin.toFixed(1), total: mockData.length };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">📊 Live Price Map</h1>
          <p className="text-slate-500 mt-1">Real-time competitor price comparison</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Products Tracked</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
          <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Below Market</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.cheapest}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">At Market</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{stats.avg}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Above Market</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{stats.premium}</p>
        </div>
        <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-4">
          <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">Avg Margin</p>
          <p className="text-2xl font-bold text-indigo-700 mt-1">{stats.avgMargin}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or SKUs..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="all">All Positions</option>
          <option value="cheapest">🟢 Najevtin</option>
          <option value="below_avg">🟢 Pod prosek</option>
          <option value="average">🟡 Prosek</option>
          <option value="above_avg">🟠 Nad prosek</option>
          <option value="premium">🔴 Premium</option>
        </select>
      </div>

      {/* Price Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Product</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Our Price</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg Market</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Min</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Max</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Position</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">7d Change</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Alerts</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((product) => {
                const margin = ((product.ourPrice - product.costPrice) / product.ourPrice) * 100;
                const isExpanded = expandedProduct === product.id;
                return (
                  <div key={product.id}>
                    <tr
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{product.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm font-bold text-slate-900">${product.ourPrice.toFixed(2)}</p>
                        <p className="text-xs text-slate-400">{margin.toFixed(1)}% margin</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm text-slate-700">${product.avgCompetitorPrice.toFixed(2)}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm text-emerald-600 font-medium">${product.minCompetitorPrice.toFixed(2)}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm text-red-500 font-medium">${product.maxCompetitorPrice.toFixed(2)}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getPositionBadge(product.marketPosition)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className={`inline-flex items-center gap-1 text-sm font-medium ${
                          product.priceChange7d < 0 ? 'text-emerald-600' :
                          product.priceChange7d > 0 ? 'text-red-600' : 'text-slate-500'
                        }`}>
                          {product.priceChange7d < 0 ? <ArrowDown className="w-3.5 h-3.5" /> :
                           product.priceChange7d > 0 ? <ArrowUp className="w-3.5 h-3.5" /> :
                           <ArrowRight className="w-3.5 h-3.5" />}
                          {Math.abs(product.priceChange7d).toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {product.alerts > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <AlertTriangle className="w-3 h-3" /> {product.alerts}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <svg className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </td>
                    </tr>
                    {/* Expanded row - competitor details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="px-4 py-4 bg-slate-50/70">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Competitor Breakdown</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {product.competitors.map((comp, i) => (
                              <div key={i} className={`p-3 rounded-lg border ${
                                comp.price < product.ourPrice
                                  ? 'border-red-200 bg-red-50/50'
                                  : comp.price === product.ourPrice
                                  ? 'border-amber-200 bg-amber-50/50'
                                  : 'border-emerald-200 bg-emerald-50/50'
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-medium text-slate-800">{comp.competitorName}</p>
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    comp.inStock ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                  }`}>{comp.inStock ? '✅' : '❌'}</span>
                                </div>
                                <p className={`text-lg font-bold ${
                                  comp.price < product.ourPrice ? 'text-red-600' :
                                  comp.price === product.ourPrice ? 'text-amber-600' : 'text-emerald-600'
                                }`}>
                                  ${comp.price.toFixed(2)}
                                </p>
                                {comp.originalPrice && comp.originalPrice > comp.price && (
                                  <p className="text-xs text-slate-400 line-through">${comp.originalPrice.toFixed(2)}</p>
                                )}
                                {comp.discountPct && (
                                  <p className="text-xs font-medium text-red-500">-{comp.discountPct}% off</p>
                                )}
                                <p className="text-xs text-slate-400 mt-2">{comp.lastUpdated}</p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </div>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-500">No products match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
