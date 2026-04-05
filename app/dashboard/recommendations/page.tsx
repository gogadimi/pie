'use client';

import { useState } from 'react';
import { Brain, ChevronRight, ThumbsUp, ThumbsDown, Play, Sparkles } from 'lucide-react';

interface Recommendation {
  id: string;
  productName: string;
  sku: string;
  currentPrice: number;
  suggestedPrice: number;
  changePct: number;
  reason: string;
  expectedProfitChange: number;
  expectedVolumeChange: number;
  confidence: number;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  competitors: { name: string; price: number }[];
  risks: string[];
}

const mockRecs: Recommendation[] = [
  {
    id: '1', productName: 'MacBook Air M3 15"', sku: 'MBP-M3-15-256',
    currentPrice: 1299, suggestedPrice: 1229, changePct: -5.4,
    reason: 'Amazon is $100 below us with 7.7% discount. Match or risk 15% volume drop. Margin still healthy at 22.3%.',
    expectedProfitChange: -1.2, expectedVolumeChange: 12.5,
    confidence: 0.89, urgency: 'high', status: 'pending',
    competitors: [{ name: 'Amazon', price: 1199 }, { name: 'Best Buy', price: 1249 }, { name: 'Walmart', price: 1499 }],
    risks: ['Margin drops 3.2%', 'May trigger price war'],
  },
  {
    id: '2', productName: 'iPhone 16 Pro 256GB', sku: 'IP16P-256-BLK',
    currentPrice: 1099, suggestedPrice: 1049, changePct: -4.5,
    reason: 'Amazon dropped to $999. We should meet them halfway at $1049 to stay competitive without destroying margin.',
    expectedProfitChange: -0.8, expectedVolumeChange: 8.2,
    confidence: 0.76, urgency: 'high', status: 'pending',
    competitors: [{ name: 'Amazon', price: 999 }, { name: 'Best Buy', price: 1049 }, { name: 'Target', price: 1199 }],
    risks: ['Amazon may drop further', 'Margin compression'],
  },
  {
    id: '3', productName: 'Sony WH-1000XM5', sku: 'SNY-WH1000XM5-B',
    currentPrice: 279, suggestedPrice: 289, changePct: 3.6,
    reason: 'Market average is $299. We are 6.7% below. Can increase to $279 (wait it is already 279) -> $289 and still be below Best Buy and Walmart.',
    expectedProfitChange: 3.2, expectedVolumeChange: -1.5,
    confidence: 0.82, urgency: 'low', status: 'pending',
    competitors: [{ name: 'Amazon', price: 278 }, { name: 'Best Buy', price: 299 }, { name: 'Walmart', price: 349 }],
    risks: ['Amazon may react', 'Small volume loss expected'],
  },
  {
    id: '4', productName: 'AirPods Pro (2nd Gen)', sku: 'APP-AIRPODS-PRO2',
    currentPrice: 199, suggestedPrice: 189, changePct: -5.0,
    reason: 'Amazon at historical low $169. Our $199 is 17.8% above. Recommended $189 to stay closer while maintaining margin.',
    expectedProfitChange: -1.5, expectedVolumeChange: 15.3,
    confidence: 0.71, urgency: 'medium', status: 'pending',
    competitors: [{ name: 'Amazon', price: 169 }, { name: 'Costco', price: 179 }, { name: 'Best Buy', price: 199 }],
    risks: ['Amazon may go lower', 'Margin below 20% at $189'],
  },
];

function getUrgencyBadge(urgency: string) {
  const colors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[urgency]}`}>{urgency.toUpperCase()}</span>;
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: 'bg-indigo-100 text-indigo-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-slate-100 text-slate-600',
    executed: 'bg-green-100 text-green-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>{status}</span>;
}

export default function RecommendationsPage() {
  const [recs, setRecs] = useState(mockRecs);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    setRecs(prev => prev.map(r =>
      r.id === id ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r
    ));
  };

  const pending = recs.filter(r => r.status === 'pending').length;
  const pendingRevenueImpact = recs
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.expectedProfitChange, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Pricing Agent</h1>
            <p className="text-slate-500 mt-0.5">{pending} pending recommendations • Est. revenue impact: {pendingRevenueImpact > 0 ? '+' : ''}{pendingRevenueImpact.toFixed(1)}%</p>
          </div>
        </div>
        {pending > 0 && (
          <button
            onClick={() => recs.filter(r => r.status === 'pending').forEach(r => handleAction(r.id, 'approve'))}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 font-medium text-sm shadow-lg shadow-indigo-200 transition-all"
          >
            <Play className="w-4 h-4" /> Approve All
          </button>
        )}
      </div>

      {/* Recommendation Cards */}
      <div className="space-y-4">
        {recs.map((rec) => {
          const isExpanded = expandedId === rec.id;
          const isDone = rec.status !== 'pending';
          return (
            <div
              key={rec.id}
              className={`rounded-xl border overflow-hidden transition-all ${
                isDone ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Card Header */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                      <h3 className="text-base font-semibold text-slate-900">{rec.productName}</h3>
                      <span className="text-xs text-slate-400 font-mono">{rec.sku}</span>
                      {getStatusBadge(rec.status)}
                    </div>

                    {/* Price comparison */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="text-center px-4 py-2 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">Current</p>
                        <p className="text-xl font-bold text-slate-800">${rec.currentPrice}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                      <div className="text-center px-4 py-2 bg-violet-50 rounded-lg border-2 border-violet-200">
                        <p className="text-xs text-violet-600 font-medium">AI Suggests</p>
                        <p className="text-xl font-bold text-violet-700">${rec.suggestedPrice}</p>
                      </div>
                      <div className={`text-center px-3 py-2 rounded-lg text-sm font-bold ${
                        rec.changePct < 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {rec.changePct > 0 ? '↗' : '↘'} {Math.abs(rec.changePct).toFixed(1)}%
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mt-3">{rec.reason}</p>

                    <div className="flex items-center gap-4 mt-3">
                      {getUrgencyBadge(rec.urgency)}
                      <span className="text-xs text-slate-500">Confidence: {(rec.confidence * 100).toFixed(0)}%</span>
                      <span className="text-xs text-emerald-600 font-medium">
                        💰 Profit: {rec.expectedProfitChange > 0 ? '+' : ''}{rec.expectedProfitChange.toFixed(1)}%
                      </span>
                      <span className="text-xs text-indigo-600 font-medium">
                        📦 Volume: {rec.expectedVolumeChange > 0 ? '+' : ''}{rec.expectedVolumeChange.toFixed(1)}%
                      </span>
                    </div>

                    {/* Competitor mini-list */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {rec.competitors.map((c) => (
                        <span key={c.name} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 text-xs text-slate-600">
                          {c.name}: <span className="font-medium">${c.price}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {rec.status === 'pending' && (
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleAction(rec.id, 'approve')}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(rec.id, 'reject')}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
                    >
                      <ThumbsDown className="w-4 h-4" /> Reject
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                      className="ml-auto text-sm text-slate-500 hover:text-slate-700"
                    >
                      {isExpanded ? 'Hide risks' : 'Show risks'} →
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded: Risks */}
              {isExpanded && (
                <div className="px-5 pb-5 bg-slate-50/70 border-t border-slate-100">
                  <p className="text-sm font-semibold text-slate-700 mb-2">⚠️ Risks</p>
                  <ul className="space-y-1">
                    {rec.risks.map((risk, i) => (
                      <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                        <span>•</span> {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
