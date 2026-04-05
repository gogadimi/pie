'use client';

import { useState } from 'react';
import { Bell, TrendingDown, TrendingUp, AlertTriangle, PackageX, Tag } from 'lucide-react';

interface Alert {
  id: string;
  type: 'price_drop' | 'price_increase' | 'out_of_stock' | 'promo_detected' | 'new_competitor';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  productName: string;
  competitorName: string;
  timestamp: string;
  isRead: boolean;
  impact: string;
}

const mockAlerts: Alert[] = [
  {
    id: '1', type: 'price_drop', severity: 'high',
    message: 'Amazon dropped price by 7.7% ($100 savings)',
    productName: 'MacBook Air M3 15"', competitorName: 'Amazon',
    timestamp: '2026-04-05 10:05', isRead: false, impact: '~$45K potential revenue loss/month',
  },
  {
    id: '2', type: 'promo_detected', severity: 'medium',
    message: 'Best Buy started a 30% flash sale on headphones',
    productName: 'Sony WH-1000XM5', competitorName: 'Best Buy',
    timestamp: '2026-04-05 09:30', isRead: false, impact: '~$12K potential revenue loss/month',
  },
  {
    id: '3', type: 'price_increase', severity: 'low',
    message: 'Target increased price by 15% ($200 above our price)',
    productName: 'iPhone 16 Pro 256GB', competitorName: 'Target',
    timestamp: '2026-04-04 14:00', isRead: true, impact: 'Opportunity to increase our price',
  },
  {
    id: '4', type: 'out_of_stock', severity: 'medium',
    message: 'Walmart is out of stock — less competition',
    productName: 'MacBook Air M3 15"', competitorName: 'Walmart',
    timestamp: '2026-04-04 15:00', isRead: true, impact: 'Opportunity to capture more market share',
  },
  {
    id: '5', type: 'price_drop', severity: 'critical',
    message: 'Amazon dropped AirPods Pro to historical low ($169)',
    productName: 'AirPods Pro (2nd Gen)', competitorName: 'Amazon',
    timestamp: '2026-04-05 10:15', isRead: false, impact: '~$24K potential revenue loss/month',
  },
];

function getTypeIcon(type: string) {
  switch (type) {
    case 'price_drop': return <TrendingDown className="w-5 h-5 text-red-500" />;
    case 'price_increase': return <TrendingUp className="w-5 h-5 text-emerald-500" />;
    case 'out_of_stock': return <PackageX className="w-5 h-5 text-amber-500" />;
    case 'promo_detected': return <Tag className="w-5 h-5 text-purple-500" />;
    default: return <AlertTriangle className="w-5 h-5 text-slate-500" />;
  }
}

function getSeverityBadge(severity: string) {
  const colors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[severity]}`}>{severity.toUpperCase()}</span>;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);
  const unread = alerts.filter(a => !a.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6" /> Alerts
          </h1>
          <p className="text-slate-500 mt-1">
            {unread > 0 && <span className="text-red-500 font-semibold">{unread} unread</span>} notifications from competitor monitoring
          </p>
        </div>
        <div className="flex gap-2">
          {['all', 'critical', 'high', 'medium', 'low'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((alert) => (
          <div
            key={alert.id}
            className={`p-5 rounded-xl border transition-colors ${
              alert.isRead
                ? 'bg-white border-slate-200'
                : 'bg-indigo-50/50 border-indigo-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg shrink-0 ${
                alert.severity === 'critical' ? 'bg-red-100' :
                alert.severity === 'high' ? 'bg-orange-100' :
                alert.severity === 'medium' ? 'bg-amber-100' : 'bg-slate-100'
              }`}>
                {getTypeIcon(alert.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getSeverityBadge(alert.severity)}
                  {!alert.isRead && <span className="w-2 h-2 bg-indigo-500 rounded-full" />}
                </div>
                <p className="text-sm font-medium text-slate-900 mt-2">{alert.message}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-500">📦 {alert.productName}</span>
                  <span className="text-xs text-slate-500">🏪 {alert.competitorName}</span>
                  <span className="text-xs text-slate-400">🕒 {alert.timestamp}</span>
                </div>
                <p className="text-xs text-indigo-600 mt-2 font-medium">💰 Impact: {alert.impact}</p>
              </div>
              {!alert.isRead && (
                <button
                  onClick={() => {
                    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, isRead: true } : a));
                  }}
                  className="text-xs text-indigo-600 hover:underline shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
