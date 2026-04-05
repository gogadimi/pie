'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../layout';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  currentPrice: string | null;
  costPrice: string | null;
  currency: string;
  category: string | null;
}

export default function PriceMapPage() {
  const { orgId } = useDashboard();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchProducts = useCallback(() => {
    setLoading(true);
    fetch(`/api/products?orgId=${orgId}&limit=100`)
      .then(r => r.json())
      .then(data => { if (data.success) setProducts(data.products || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const margin = (price: string | null, cost: string | null) => {
    if (!price || !cost || parseFloat(price) === 0) return null;
    return ((parseFloat(price) - parseFloat(cost)) / parseFloat(price) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">📊 Price Map</h1>
        <p className="text-slate-500 mt-1">Compare your prices against competitors</p>
      </div>

      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Product</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Our Price</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Cost</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Margin</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-slate-500">No products to compare. Add products first.</p>
                </td>
              </tr>
            ) : (
              filtered.map(p => {
                const m = margin(p.currentPrice, p.costPrice);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <p className="text-sm font-medium text-slate-900">{p.name}</p>
                      {p.sku && <p className="text-xs text-slate-400 font-mono">{p.sku}</p>}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-bold text-slate-800">{p.currency} {p.currentPrice || '—'}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm text-slate-600">{p.currency} {p.costPrice || '—'}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      {m !== null ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${parseFloat(m) > 30 ? 'bg-emerald-100 text-emerald-700' : parseFloat(m) > 15 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {m}%
                        </span>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {p.category ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{p.category}</span> : <span className="text-xs text-slate-400">—</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
