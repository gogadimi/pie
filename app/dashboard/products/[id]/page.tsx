'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDashboard, DashboardContext } from '../../layout';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Trash2, ExternalLink, Plus, Tag, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  currentPrice: string | null;
  costPrice: string | null;
  currency: string;
  category: string | null;
}

interface CompetitorPrice {
  price: string | null;
  originalPrice: string | null;
  discountPct: string | null;
  inStock: boolean | null;
  scrapedAt: string | null;
  competitorName: string | null;
  competitorUrl: string | null;
}

export default function ProductDetailPage() {
  const { orgId } = useDashboard();
  const pathname = usePathname();
  const productId = pathname?.split('/').pop() || '';

  const [product, setProduct] = useState<Product | null>(null);
  const [competitorPrices, setCompetitorPrices] = useState<CompetitorPrice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(() => {
    setLoading(true);
    fetch(`/api/products/${productId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setProduct(data.product);
          setCompetitorPrices(data.competitorPrices || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const margin = (price: string | null, cost: string | null) => {
    if (!price || !cost || parseFloat(price) === 0) return null;
    return ((parseFloat(price) - parseFloat(cost)) / parseFloat(price) * 100).toFixed(1);
  };

  const formatPrice = (price: string | null, currency: string) => {
    if (!price) return '—';
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', MKD: 'ден' };
    return `${symbols[currency] || ''}${price}`;
  };

  // Move calculations after null check - use default values before loading
  // Calculate after null check
  const ourPrice = product ? parseFloat(product.currentPrice || '0') : 0;
  const ourCost = product ? parseFloat(product.costPrice || '0') : 0;
  const ourMargin = product ? margin(product.currentPrice, product.costPrice) : null;

  // Calculate market stats
  const compPrices = competitorPrices
    .map(cp => parseFloat(cp.price || '0'))
    .filter(p => p > 0);
  const avgComp = compPrices.length > 0 ? compPrices.reduce((a, b) => a + b, 0) / compPrices.length : 0;
  const minComp = compPrices.length > 0 ? Math.min(...compPrices) : 0;
  const maxComp = compPrices.length > 0 ? Math.max(...compPrices) : 0;

  // Unique competitors
  const uniqueComps: CompetitorPrice[] = [];
  const seen = new Set<string>();
  for (const cp of competitorPrices) {
    const cpName = cp.competitorName || null;
    if (cpName && !seen.has(cpName)) {
      seen.add(cpName);
      uniqueComps.push(cp);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            {product.sku && <span className="text-xs font-mono text-slate-400">{product.sku}</span>}
            {product.category && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{product.category}</span>}
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Add Competitor
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Our Price</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatPrice(product.currentPrice || '0', product.currency)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Our Cost</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatPrice(product.costPrice || '0', product.currency)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Our Margin</p>
          <p className={`text-2xl font-bold mt-1 ${ourMargin ? (parseFloat(ourMargin) > 30 ? 'text-emerald-600' : parseFloat(ourMargin) > 15 ? 'text-amber-600' : 'text-red-600') : 'text-slate-400'}`}>
            {ourMargin ? `${ourMargin}%` : '—'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Avg Market</p>
          <p className="text-2xl font-bold text-slate-700 mt-1">{avgComp > 0 ? formatPrice(avgComp.toFixed(2) || '0', product.currency) : '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Competitors</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{uniqueComps.length}</p>
        </div>
      </div>

      {/* Position Indicator */}
      {avgComp > 0 && ourPrice > 0 && (
        <div className={`rounded-xl border p-5 flex items-center gap-4 ${
          ourPrice < avgComp * 0.9 ? 'bg-emerald-50 border-emerald-200' :
          ourPrice > avgComp * 1.1 ? 'bg-red-50 border-red-200' :
          'bg-amber-50 border-amber-200'
        }`}>
          {ourPrice < avgComp * 0.9 ? (
            <TrendingDown className="w-8 h-8 text-emerald-500 shrink-0" />
          ) : ourPrice > avgComp * 1.1 ? (
            <TrendingUp className="w-8 h-8 text-red-500 shrink-0" />
          ) : (
            <DollarSign className="w-8 h-8 text-amber-500 shrink-0" />
          )}
          <div>
            <p className="font-semibold text-slate-800">
              {ourPrice < avgComp * 0.9 ? 'You are below market average' :
               ourPrice > avgComp * 1.1 ? 'You are above market average' :
               'You are at market average'}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">
              Market ranges from {formatPrice(minComp.toFixed(2) || '0', product.currency)} to {formatPrice(maxComp.toFixed(2) || '0', product.currency)} (avg: {formatPrice(avgComp.toFixed(2) || '0', product.currency)})
            </p>
          </div>
        </div>
      )}

      {/* Competitor Prices */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Competitor Prices</h2>
        </div>
        {uniqueComps.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Tag className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-3">No competitor prices scraped yet.</p>
            <Link href="/dashboard/scraping" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">
              Test Scraping
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Competitor</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Price</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Original</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Discount</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Stock</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Last Updated</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {uniqueComps.map((cp, i) => {
                  const compPrice = parseFloat(cp.price || '0');
                  const diffFromUs = ourPrice > 0 && compPrice > 0 ? ((compPrice - ourPrice) / ourPrice * 100) : 0;
                  return (
                    <tr key={i} className={`hover:bg-slate-50 ${
                      compPrice < ourPrice ? 'bg-red-50/30' : compPrice > ourPrice ? 'bg-emerald-50/30' : ''
                    }`}>
                      <td className="px-6 py-3">
                        <p className="text-sm font-medium text-slate-800">{cp.competitorName}</p>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="text-right">
                          <p className={`text-sm font-bold ${
                            compPrice < ourPrice ? 'text-red-600' : compPrice > ourPrice ? 'text-emerald-600' : 'text-slate-800'
                          }`}>
                            {formatPrice(cp.price || '0', product.currency)}
                          </p>
                          {diffFromUs !== 0 && (
                            <p className={`text-xs ${diffFromUs < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                              {diffFromUs > 0 ? '+' : ''}{diffFromUs.toFixed(1)}% vs us
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        {cp.originalPrice ? (
                          <p className="text-sm text-slate-400 line-through">{formatPrice(cp.originalPrice, product.currency)}</p>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {cp.discountPct ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">-{cp.discountPct}%</span>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cp.inStock ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {cp.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-xs text-slate-400">{cp.scrapedAt ? new Date(cp.scrapedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                      </td>
                      <td className="px-6 py-3">
                        {cp.competitorUrl && (
                          <a href={cp.competitorUrl || "#"} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
