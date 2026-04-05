'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../layout';
import { Plus, Trash2, ExternalLink, Search } from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  url: string | null;
  industry: string | null;
  isActive: boolean | null;
  createdAt: string | null;
}

export default function CompetitorsPage() {
  const { orgId, refreshStats } = useDashboard();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newComp, setNewComp] = useState({ name: '', url: '', industry: '' });

  const fetchCompetitors = useCallback(() => {
    setLoading(true);
    fetch(`/api/competitors?orgId=${orgId}`)
      .then(r => r.json())
      .then(data => { if (data.success) setCompetitors(data.competitors || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { fetchCompetitors(); }, [fetchCompetitors]);

  const handleAdd = async () => {
    if (!newComp.name) return;
    try {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newComp, organizationId: orgId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCompetitors();
        refreshStats();
        setShowAdd(false);
        setNewComp({ name: '', url: '', industry: '' });
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this competitor?')) return;
    try {
      await fetch(`/api/competitors/${id}`, { method: 'DELETE' });
      fetchCompetitors();
      refreshStats();
    } catch (e) { console.error(e); }
  };

  const filtered = competitors.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.industry || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Competitors</h1>
          <p className="text-slate-500 mt-1">{competitors.length} competitors tracked</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Competitor
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search competitors..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Add Competitor</h2>
            <div className="space-y-3">
              <input className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Competitor name *" value={newComp.name} onChange={e => setNewComp({...newComp, name: e.target.value})} />
              <input className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Website URL" value={newComp.url} onChange={e => setNewComp({...newComp, url: e.target.value})} />
              <input className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Industry" value={newComp.industry} onChange={e => setNewComp({...newComp, industry: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={handleAdd} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <p className="text-center text-slate-400 py-12">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500 mb-3">No competitors found.</p>
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Add your first competitor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((comp) => (
            <div key={comp.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 truncate">{comp.name}</h3>
                  {comp.url && (
                    <a href={comp.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-1">
                      {comp.url} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {comp.industry && <p className="text-xs text-slate-400 mt-1">{comp.industry}</p>}
                </div>
                <button onClick={() => handleDelete(comp.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors shrink-0 ml-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${comp.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {comp.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-slate-400">
                  {comp.createdAt ? new Date(comp.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
