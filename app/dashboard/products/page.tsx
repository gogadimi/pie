'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../layout';
import { Plus, Search, Trash2, Upload, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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

export default function ProductsPage() {
  const { orgId, refreshStats } = useDashboard();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '', sku: '', currentPrice: '', costPrice: '', currency: 'EUR', category: '',
  });
  const [importing, setImporting] = useState(false);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    fetch(`/api/products?orgId=${orgId}&limit=100`)
      .then(r => r.json())
      .then(data => { if (data.success) setProducts(data.products || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleAddProduct = async () => {
    if (!newProduct.name) return;
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProduct, organizationId: orgId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
        refreshStats();
        setShowAdd(false);
        setNewProduct({ name: '', sku: '', currentPrice: '', costPrice: '', currency: 'EUR', category: '' });
      }
    } catch (e) { console.error(e); }
  };

  const handleImport = async () => {
    try {
      const lines = importText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ''; });
        return obj;
      });

      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: rows, organizationId: orgId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
        refreshStats();
        setShowImport(false);
        setImportText('');
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchProducts();
      refreshStats();
    } catch (e) { console.error(e); }
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500 mt-1">{products.length} products tracked</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products or SKUs..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Add Product Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Add Product</h2>
            <div className="space-y-3">
              <input className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Product name *" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Current price" value={newProduct.currentPrice} onChange={e => setNewProduct({...newProduct, currentPrice: e.target.value})} />
                <input className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Cost price" value={newProduct.costPrice} onChange={e => setNewProduct({...newProduct, costPrice: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm" placeholder="SKU" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
                <select className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm" value={newProduct.currency} onChange={e => setNewProduct({...newProduct, currency: e.target.value})}>
                  <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="MKD">MKD</option>
                </select>
              </div>
              <input className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Category" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleAddProduct} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Add Product</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowImport(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Import Products (CSV)</h2>
            <p className="text-xs text-slate-500 mb-3">Paste CSV with headers: name, currentPrice, costPrice, currency, category, sku</p>
            <textarea
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono h-40 resize-none"
              placeholder={`name,currentPrice,costPrice,currency\nProduct A,49.99,30.00,EUR\nProduct B,79.99,45.00,EUR`}
              value={importText}
              onChange={e => setImportText(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowImport(false)} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={handleImport} disabled={!importText} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Import</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Product</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Price</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Cost</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Margin</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <p className="text-slate-500 mb-3">No products found.</p>
                  <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">
                    <Plus className="w-4 h-4" /> Add your first product
                  </button>
                </td>
              </tr>
            ) : filtered.map((p) => {
              const m = margin(p.currentPrice, p.costPrice);
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <Link href={`/dashboard/products/${p.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                      {p.name}
                    </Link>
                    {p.sku && <p className="text-xs text-slate-400 font-mono mt-0.5">{p.sku}</p>}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-sm font-semibold text-slate-800">{p.currency} {p.currentPrice || '—'}</span>
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
                  <td className="px-6 py-3">
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
