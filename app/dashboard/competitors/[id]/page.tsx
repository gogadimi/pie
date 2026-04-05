'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Trash2, ExternalLink, Plus, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function CompetitorDetailPage() {
  const pathname = usePathname();
  const compId = pathname?.split('/').pop() || '';

  const [competitor, setCompetitor] = useState<any>(null);
  const [trackedProducts, setTrackedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch from API
    setLoading(false);
    setCompetitor({ id: compId, name: 'Amazon', url: 'https://amazon.com', industry: 'Marketplace', isActive: true });
    setTrackedProducts([
      { id: '1', name: 'MacBook Air M3 15"', ourPrice: 1299, theirPrice: 1199, discount: 7.7, lastChecked: '2026-04-05 10:05' },
      { id: '2', name: 'iPhone 16 Pro 256GB', ourPrice: 1099, theirPrice: 999, discount: 9.1, lastChecked: '2026-04-05 09:50' },
      { id: '3', name: 'AirPods Pro (2nd Gen)', ourPrice: 199, theirPrice: 169, discount: 15.1, lastChecked: '2026-04-05 10:15' },
    ]);
  }, [compId]);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Loading...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/competitors" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-slate-500"/></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{competitor?.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            {competitor?.url && <a href={competitor.url} target="_blank" className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1">{competitor.url} <ExternalLink className="w-3 h-3"/></a>}
            {competitor?.industry && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{competitor.industry}</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Products Tracked</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{trackedProducts.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Avg Discount</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{(trackedProducts.reduce((s, p) => s + p.discount, 0) / trackedProducts.length).toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Lower Than Us</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{trackedProducts.filter(p => p.theirPrice < p.ourPrice).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Last Check</p>
          <p className="text-sm font-bold text-slate-800 mt-1">5 min ago</p>
        </div>
      </div>

      {/* Tracked Products */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Tracked Products</h2>
          <button className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">
            <Plus className="w-3.5 h-3.5"/> Add Product
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Product</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Our Price</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Their Price</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Diff</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Last Checked</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trackedProducts.map(p => {
              const diff = ((p.theirPrice - p.ourPrice) / p.ourPrice * 100).toFixed(1);
              return (
                <tr key={p.id} className={`hover:bg-slate-50 ${p.theirPrice < p.ourPrice ? 'bg-red-50/30' : 'bg-emerald-50/30'}`}>
                  <td className="px-6 py-3"><p className="text-sm font-medium text-slate-800">{p.name}</p></td>
                  <td className="px-6 py-3 text-right"><span className="text-sm text-slate-700">${p.ourPrice}</span></td>
                  <td className="px-6 py-3 text-right"><span className={`text-sm font-bold ${p.theirPrice < p.ourPrice ? 'text-red-600' : 'text-emerald-600'}`}>${p.theirPrice}</span></td>
                  <td className="px-6 py-3 text-right"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.theirPrice < p.ourPrice ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{diff > 0 ? '+' : ''}{diff}%</span></td>
                  <td className="px-6 py-3 text-center"><span className="text-xs text-slate-400">{p.lastChecked}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
