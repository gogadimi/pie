'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../layout';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AnalyticsPage() {
  const { stats } = useDashboard();
  
  // Mock data until we have historical APIs
  const priceHistory = [
    { date: 'Apr 1', ours: 1299, amazon: 1249, bestbuy: 1299 },
    { date: 'Apr 2', ours: 1299, amazon: 1279, bestbuy: 1299 },
    { date: 'Apr 3', ours: 1299, amazon: 1199, bestbuy: 1249 },
    { date: 'Apr 4', ours: 1299, amazon: 1199, bestbuy: 1249 },
    { date: 'Apr 5', ours: 1299, amazon: 1199, bestbuy: 1249 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">📈 Analytics</h1>
        <p className="text-slate-500 mt-1">Price trends, margins, and market insights</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Products Tracked', value: stats?.totalProducts || 0 },
          { label: 'Competitors', value: stats?.totalCompetitors || 0 },
          { label: 'Active Jobs', value: stats?.activeJobs || 0 },
          { label: 'Unread Alerts', value: stats?.unreadAlerts || 0 },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Price History */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Price History — Sample Product</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={priceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{fontSize: 12}} />
              <YAxis tick={{fontSize: 12}} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ours" stroke="#4f46e5" strokeWidth={2} name="Our Price" />
              <Line type="monotone" dataKey="amazon" stroke="#f59e0b" strokeWidth={2} name="Amazon" />
              <Line type="monotone" dataKey="bestbuy" stroke="#10b981" strokeWidth={2} name="Best Buy" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Market Position */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Market Position</h2>
          <div className="space-y-4">
            {[
              { label: '🟢 Below Market', pct: 45, color: 'bg-emerald-500' },
              { label: '🟡 At Market', pct: 25, color: 'bg-amber-500' },
              { label: '🟠 Above Market', pct: 20, color: 'bg-orange-400' },
              { label: '🔴 Premium', pct: 10, color: 'bg-red-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-medium text-slate-800">{item.pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className={`${item.color} h-2.5 rounded-full transition-all duration-500`} style={{width: `${item.pct}%`}} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">AI Insights</h2>
          <div className="space-y-3">
            {[
              { icon: '📉', text: 'Amazon is consistently 3-7% below your prices on electronics', impact: 'high' },
              { icon: '📈', text: 'Market average increased 2.3% this week — room to raise prices', impact: 'medium' },
              { icon: '⚡', text: 'Best Buy flash sale ends in 6h — temporary opportunity', impact: 'medium' },
            ].map((insight, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                <span className="text-lg">{insight.icon}</span>
                <div>
                  <p className="text-sm text-slate-700">{insight.text}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${insight.impact === 'high' ? 'bg-red-100 text-red-700' : insight.impact === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {insight.impact} priority
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
