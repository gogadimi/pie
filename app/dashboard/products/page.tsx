'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../layout';
import { Plus, Search, Trash2, Upload, Edit2, Check, X } from 'lucide-react';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', currentPrice: '', costPrice: '', currency: 'EUR', category: '', sku: '' });
  const [csvText, setCsvText] = useState('');

  const fetchProducts = useCallback(() => {
    setLoading(true);
    fetch(`/api/products?orgId=${orgId}`)
      .then(r => r.json())
      .then(data => { if (data.success) setProducts(data.products || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleAdd = async () => {
    if (!newProduct.name || !newProduct.currentPrice) return;
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
        setNewProduct({ name: '', currentPrice: '', costPrice: '', currency: 'EUR', category: '', sku: '' });
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async (id: string, updates: Record<string, string>) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) { setEditingId(null); fetchProducts(); }
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

  const handleBulkImport = async () => {
    try {
      const lines = csvText.trim().split('
');
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim());
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { if (vals[i]) obj[h] = vals[i]; });
        return obj;
      });
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: rows, organizationId: orgId }),
      });
      const data = await res.json();
      if (data.success) { fetchProducts(); refreshStats(); setCsvText(''); setBulkMode(false); }
    } catch (e) { console.error(e); }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
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
          <button onClick={() => setBulkMode(!bulkMode)} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            <Upload className="w-4 h-4" /> {bulkMode ? 'Cancel Import' : 'Import CSV'}
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Add Product Form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">New Product</h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <input className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Product name *" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
            <input className="px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="SKU" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
            <input className="px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Price *" value={newProduct.currentPrice} onChange={e => setNewProduct({...newProduct, currentPrice: e.target.value})} />
            <input className="px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Cost" value={newProduct.costPrice} onChange={e => setNewProduct({...newProduct, costPrice: e.target.value})} />
            <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm" value={newProduct.currency} onChange={e => setNewProduct({...newProduct, currency: e.target.value})}>
              <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
            </select>
            <input className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Category" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
            <div className="md:col-span-4 flex gap-2">
              <button onClick={handleAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Add Product</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk CSV Import */}
      {bulkMode && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Import from CSV</h2>
          <p className="text-xs text-slate-500 mb-2">Headers: name, currentPrice, costPrice, currency, category, sku</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <textarea className="md:col-span-2 h-32 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono resize-none" placeholder={`name,currentPrice,costPrice,currency,category
MacBook Air,1299,950,EUR,Laptops
iPhone 16,1099,720,EUR,Smartphones`} value={csvText} onChange={e => setCsvText(e.target.value)} />
            <div className="flex flex-col gap-2">
              <button onClick={() => setCsvText('name,currentPrice,costPrice,currency,category
MacBook Air M3,1299,950,EUR,Laptops
Sony WH-1000XM5,279,155,EUR,Audio')} className="px-3 py-1.5 bg-slate-100 rounded text-xs text-slate-600 hover:bg-slate-200">Load sample</button>
              <button onClick={handleBulkImport} disabled={!csvText} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Import</button>
              <button onClick={() => setBulkMode(false)} className="px-3 py-1.5 border border-slate-300 rounded text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, SKU, or category..." className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 animate-pulse space-y-3"><div className="h-8 bg-slate-200 rounded"/><div className="h-8 bg-slate-100 rounded"/><div className="h-8 bg-slate-100 rounded"/></div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-500 mb-3">{products.length === 0 ? 'No products yet. Start by adding your first product!' : 'No products match your search.'}</p>
            {products.length === 0 && <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"><Plus className="w-4 h-4"/> Add Product</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Product</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Price</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Cost</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Margin</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                  <th className="px-5 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(p => {
                  const m = margin(p.currentPrice, p.costPrice);
                  const isEditing = editingId === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 group">
                      <td className="px-5 py-3">
                        {isEditing ? (
                          <input className="w-full px-2 py-1 border border-indigo-300 rounded text-sm" placeholder="Name" defaultValue={p.name} id={`edit-name-${p.id}`} />
                        ) : (
                          <a href={`/dashboard/products/${p.id}`} className="text-sm font-medium text-indigo-600 hover:underline">{p.name}</a>
                        )}
                        {p.sku && !isEditing && <p className="text-xs text-slate-400 font-mono mt-0.5">{p.sku}</p>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isEditing ? <input className="w-20 px-2 py-1 border border-indigo-300 rounded text-sm text-right" placeholder="Price" defaultValue={p.currentPrice || ''} id={`edit-price-${p.id}`} /> : <span className="text-sm font-semibold text-slate-800">{p.currency} {p.currentPrice || '—'}</span>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isEditing ? <input className="w-20 px-2 py-1 border border-indigo-300 rounded text-sm text-right" placeholder="Cost" defaultValue={p.costPrice || ''} id={`edit-cost-${p.id}`} /> : <span className="text-sm text-slate-600">{p.currency} {p.costPrice || '—'}</span>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {m !== null ? <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${parseFloat(m) > 30 ? 'bg-emerald-100 text-emerald-700' : parseFloat(m) > 15 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{m}%</span> : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {isEditing ? <input className="w-24 px-2 py-1 border border-indigo-300 rounded text-sm text-center" placeholder="Category" defaultValue={p.category || ''} id={`edit-cat-${p.id}`} /> : p.category ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{p.category}</span> : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button onClick={() => {
                              const name = (document.getElementById(`edit-name-${p.id}`) as HTMLInputElement)?.value;
                              const price = (document.getElementById(`edit-price-${p.id}`) as HTMLInputElement)?.value;
                              const cost = (document.getElementById(`edit-cost-${p.id}`) as HTMLInputElement)?.value;
                              const cat = (document.getElementById(`edit-cat-${p.id}`) as HTMLInputElement)?.value;
                              handleUpdate(p.id, { name: name || p.name, currentPrice: price || p.currentPrice, costPrice: cost || p.costPrice, category: cat || p.category });
                            }} className="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200"><Check className="w-4 h-4"/></button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"><X className="w-4 h-4"/></button>
                          </div>
                        ) : (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingId(p.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"><Edit2 className="w-3.5 h-3.5"/></button>
                            <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
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
