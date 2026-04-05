'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../layout';
import { Bell, TrendingDown, TrendingUp, PackageX, Tag, AlertTriangle } from 'lucide-react';

interface Alert {
  id: string;
  type: string;
  message: string;
  severity: string;
  isRead: boolean;
  createdAt: string | null;
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'price_drop': return <TrendingDown className="w-5 h-5 text-red-500" />;
    case 'price_increase': return <TrendingUp className="w-5 h-5 text-emerald-500" />;
    case 'out_of_stock': return <PackageX className="w-5 h-5 text-amber-500" />;
    case 'promo_detected': return <Tag className="w-5 h-5 text-purple-500" />;
    default: return <AlertTriangle className="w-5 h-5 text-slate-500" />;
  }
}

export default function AlertsPage() {
  const { orgId, refreshStats } = useDashboard();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchAlerts = useCallback(() => {
    setLoading(true);
    fetch(`/api/alerts?orgId=${orgId}&status=${filter}`)
      .then(r => r.json())
      .then(data => { if (data.success) setAlerts(data.alerts || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId, filter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const markRead = async (id: string) => {
    await fetch(`/api/alerts`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId: id }),
    });
    fetchAlerts();
    refreshStats();
  };

  const unread = alerts.filter(a => !a.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6" /> Alerts
          </h1>
          <p className="text-slate-500 mt-1">
            {unread > 0 && <span className="text-red-500 font-semibold">{unread} unread</span>} notifications
          </p>
        </div>
        <div className="flex gap-2">
          {['all', 'high', 'medium', 'low'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-slate-400 py-12">Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No alerts. Your prices are stable!</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className={`p-5 rounded-xl border transition-colors ${alert.isRead ? 'bg-white border-slate-200' : 'bg-indigo-50/50 border-indigo-200'}`}>
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg shrink-0 bg-slate-100">{getTypeIcon(alert.type)}</div>
                <div className="flex-1 min-w-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${alert.severity === 'high' ? 'bg-red-100 text-red-700' : alert.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  {!alert.isRead && <span className="w-2 h-2 bg-indigo-500 rounded-full inline-block ml-2" />}
                  <p className="text-sm font-medium text-slate-900 mt-2">{alert.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{alert.createdAt ? new Date(alert.createdAt).toLocaleString() : ''}</p>
                </div>
                {!alert.isRead && (
                  <button onClick={() => markRead(alert.id)} className="text-xs text-indigo-600 hover:underline shrink-0">Mark read</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
