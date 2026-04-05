'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../layout';
import { Brain, ThumbsUp, ThumbsDown, Play, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

interface Recommendation {
  id: string;
  productId: string;
  productName: string;
  productSku: string | null;
  currentPrice: string | null;
  suggestedPrice: string | null;
  reason: string | null;
  expectedProfitChange: string | null;
  expectedVolumeChange: string | null;
  confidenceScore: string | null;
  status: string;
  createdAt: string | null;
}

export default function RecommendationsPage() {
  const { orgId, refreshStats } = useDashboard();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  const fetchRecs = useCallback(() => {
    setLoading(true);
    fetch(`/api/recommendations?orgId=${orgId}`)
      .then(r => r.json())
      .then(data => { if (data.success) setRecs(data.recommendations || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { fetchRecs(); }, [fetchRecs]);

  const handleGenerate = async (productId: string) => {
    setGenerating(productId);
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, orgId }),
      });
      const data = await res.json();
      if (data.success) fetchRecs();
    } catch (e) { console.error(e); }
    setGenerating(null);
  };

  const pending = recs.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Pricing Agent</h1>
            <p className="text-slate-500 mt-0.5">{pending} pending recommendations</p>
          </div>
        </div>
        <button
          onClick={fetchRecs}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-center text-slate-400 py-12">Loading AI recommendations...</p>
      ) : recs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Brain className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-2">No recommendations yet.</p>
          <p className="text-sm text-slate-400">Select a product and click "Generate AI Recommendation" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recs.map(rec => {
            const cp = rec.currentPrice ? parseFloat(rec.currentPrice) : 0;
            const sp = rec.suggestedPrice ? parseFloat(rec.suggestedPrice) : 0;
            const changePct = cp > 0 ? ((sp - cp) / cp * 100).toFixed(1) : '0';
            const isDone = rec.status !== 'pending';

            return (
              <div key={rec.id} className={`rounded-xl border overflow-hidden transition-all ${isDone ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-violet-500" />
                        <h3 className="text-base font-semibold text-slate-900">{rec.productName}</h3>
                        {rec.productSku && <span className="text-xs text-slate-400 font-mono">{rec.productSku}</span>}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rec.status === 'pending' ? 'bg-indigo-100 text-indigo-700' : rec.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {rec.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <div className="text-center px-4 py-2 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-500">Current</p>
                          <p className="text-xl font-bold text-slate-800">€{cp.toFixed(2)}</p>
                        </div>
                        <span className="text-slate-400">→</span>
                        <div className="text-center px-4 py-2 bg-violet-50 rounded-lg border-2 border-violet-200">
                          <p className="text-xs text-violet-600 font-medium">AI Suggests</p>
                          <p className="text-xl font-bold text-violet-700">€{sp.toFixed(2)}</p>
                        </div>
                        <div className={`text-center px-3 py-2 rounded-lg text-sm font-bold ${parseFloat(changePct) < 0 ? 'bg-red-50 text-red-600' : parseFloat(changePct) > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                          {parseFloat(changePct) > 0 ? '↗' : parseFloat(changePct) < 0 ? '↘' : '→'} {Math.abs(parseFloat(changePct)).toFixed(1)}%
                        </div>
                      </div>

                      {rec.reason && <p className="text-sm text-slate-600 mt-3">{rec.reason}</p>}

                      <div className="flex items-center gap-4 mt-3">
                        {rec.confidenceScore && <span className="text-xs text-slate-500">Confidence: {(parseFloat(rec.confidenceScore) * 100).toFixed(0)}%</span>}
                        {rec.expectedProfitChange && <span className="text-xs text-emerald-600 font-medium">💰 Profit: {parseFloat(rec.expectedProfitChange) > 0 ? '+' : ''}{parseFloat(rec.expectedProfitChange).toFixed(1)}%</span>}
                        {rec.expectedVolumeChange && <span className="text-xs text-indigo-600 font-medium">📦 Volume: {parseFloat(rec.expectedVolumeChange) > 0 ? '+' : ''}{parseFloat(rec.expectedVolumeChange).toFixed(1)}%</span>}
                      </div>
                    </div>
                  </div>

                  {rec.status === 'pending' && (
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                      <button className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
                        <ThumbsUp className="w-4 h-4" /> Approve
                      </button>
                      <button className="inline-flex items-center gap-2 px-5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">
                        <ThumbsDown className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
