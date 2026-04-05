'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Calendar, TrendingUp, AlertCircle, Plus, ExternalLink, Download } from 'lucide-react';

interface Subscription {
  id: string;
  plan: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: string;
  nextBillingDate: string;
  amount: string;
  currency: string;
  cancelAtPeriodEnd: boolean;
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    fetch('/api/subscriptions')
      .then(r => r.json())
      .then(data => {
        setSubscription(data.subscription || { plan: 'free', status: 'inactive' });
        setInvoices(data.invoices || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleManageBilling = async () => {
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error('Failed to open billing portal', e);
    }
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error('Failed to upgrade', e);
    }
  };

  const plans = [
    { key: 'starter', name: 'Starter', price: '€49', features: '50 competitors, 3x/day checks', color: 'bg-blue-50 border-blue-200' },
    { key: 'pro', name: 'Pro', price: '€149', features: 'Unlimited, 10s checks, Full AI', color: 'bg-indigo-50 border-indigo-200' },
    { key: 'enterprise', name: 'Enterprise', price: '€799', features: 'Custom, Real-time, SLA', color: 'bg-violet-50 border-violet-200' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6" /> Billing & Subscription
        </h1>
        <p className="text-slate-500 mt-1">Manage your plan, billing details, and invoices</p>
      </div>

      {loading ? (
        <div className="animate-pulse bg-white rounded-xl border border-slate-200 p-8 space-y-4">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-32 bg-slate-100 rounded" />
        </div>
      ) : (
        <>
          {/* Current Plan Status */}
          <div className={`rounded-xl border p-6 ${subscription?.status === 'active' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">
                    {subscription?.plan === 'pro' ? '🟢 Pro Plan' : subscription?.plan === 'enterprise' ? '🟣 Enterprise' : '⚪ Free Trial'}
                  </h2>
                  {subscription?.cancelAtPeriodEnd && (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">Cancels at period end</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {subscription?.status === 'active' ? 'Active' : subscription?.status === 'trialing' ? 'Trial' : 'No active subscription'}
                  {subscription?.nextBillingDate && ` · Next billing: ${subscription.nextBillingDate}`}
                  {subscription?.amount && ` · ${subscription.currency} ${subscription.amount}/mo`}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleManageBilling} disabled={!subscription} className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50">
                  Manage Billing
                </button>
                {subscription?.plan !== 'pro' && (
                  <button onClick={handleUpgrade} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                    Upgrade to Pro
                  </button>
                )}
              </div>
            </div>

            {/* Usage Bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-200/60">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Scrapes Used</p>
                <p className="text-xl font-bold text-slate-900 mt-1">1,247 <span className="text-xs text-slate-400 font-normal">/ 10,000</span></p>
                <div className="mt-2 w-full bg-slate-200/60 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '12%' }} />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Competitors</p>
                <p className="text-xl font-bold text-slate-900 mt-1">12 <span className="text-xs text-slate-400 font-normal">/ 50</span></p>
                <div className="mt-2 w-full bg-slate-200/60 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '24%' }} />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Products</p>
                <p className="text-xl font-bold text-slate-900 mt-1">24 <span className="text-xs text-slate-400 font-normal">/ 500</span></p>
                <div className="mt-2 w-full bg-slate-200/60 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '5%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Options */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map(plan => (
                <div key={plan.key} className={`rounded-xl border p-5 transition-all hover:shadow-md ${plan.color} ${subscription?.plan === plan.key ? 'ring-2 ring-indigo-500' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                    {subscription?.plan === plan.key && <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">Current</span>}
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{plan.price}<span className="text-sm font-normal text-slate-500">/mo</span></p>
                  <p className="text-xs text-slate-600 mt-1">{plan.features}</p>
                  {subscription?.plan !== plan.key && (
                    <button onClick={() => handleUpgrade()} className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                      Upgrade →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Billing History */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Billing History</h2>
              <button className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"><Download className="w-3 h-3"/> Export</button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Description</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-6 py-3.5 text-sm text-slate-700">Apr 1, 2026</td>
                  <td className="px-6 py-3.5 text-sm text-slate-700">Pro Plan — Monthly</td>
                  <td className="px-6 py-3.5 text-sm text-right font-medium text-slate-900">€149.00</td>
                  <td className="px-6 py-3.5 text-center"><span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">Paid</span></td>
                  <td className="px-6 py-3.5"><button className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3"/> Invoice</button></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-6 py-3.5 text-sm text-slate-700">Mar 1, 2026</td>
                  <td className="px-6 py-3.5 text-sm text-slate-700">Starter Plan — Monthly</td>
                  <td className="px-6 py-3.5 text-sm text-right font-medium text-slate-900">€49.00</td>
                  <td className="px-6 py-3.5 text-center"><span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">Paid</span></td>
                  <td className="px-6 py-3.5"><button className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3"/> Invoice</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
