'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, Package, Calendar, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';

export default function SubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [upgradeModal, setUpgradeModal] = useState(false);

  useEffect(() => {
    // Fetch subscription status
    fetch('/api/subscriptions')
      .then(r => r.json())
      .then(data => {
        setSubscription(data.subscription || { plan: 'free', status: 'inactive' });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const plans = [
    { key: 'starter', name: 'Starter', price: '€49', features: '50 competitors, 3x/day checks' },
    { key: 'pro', name: 'Pro', price: '€149', features: 'Unlimited, 10s checks, Full AI' },
    { key: 'enterprise', name: 'Enterprise', price: '€799', features: 'Custom, Real-time, SLA' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">💳 Subscription</h1>
        <p className="text-slate-500 mt-1">Manage your plan and billing</p>
      </div>

      {loading ? (
        <div className="animate-pulse bg-white rounded-xl border border-slate-200 p-8">
          <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
          <div className="h-4 w-32 bg-slate-100 rounded" />
        </div>
      ) : (
        <>
          {/* Current Plan */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {subscription?.plan === 'pro' ? '🟢 Pro Plan' :
                    subscription?.plan === 'enterprise' ? '🟣 Enterprise' : '⚪ Free Trial'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {subscription?.status === 'active' ? 'Active' : 'No active subscription'}
                  {subscription?.nextBillingDate && ` · Next billing: ${subscription.nextBillingDate}`}
                </p>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">
                {subscription?.status === 'active' ? 'Manage Billing' : 'Subscribe'}
              </button>
            </div>

            {/* Usage Stats */}
            <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Scrapes Used</p>
                <p className="text-xl font-bold text-slate-900 mt-1">1,247 <span className="text-xs text-slate-400 font-normal">/ 3,000</span></p>
                <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '42%' }} />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Competitors</p>
                <p className="text-xl font-bold text-slate-900 mt-1">12 <span className="text-xs text-slate-400 font-normal">/ 50</span></p>
                <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '24%' }} />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Products</p>
                <p className="text-xl font-bold text-slate-900 mt-1">24 <span className="text-xs text-slate-400 font-normal">/ 500</span></p>
                <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '5%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Options */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map(plan => (
                <div key={plan.key} className={`rounded-xl border p-5 transition-all hover:shadow-md ${
                  subscription?.plan === plan.key ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                    {subscription?.plan === plan.key && <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">Current</span>}
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{plan.price}<span className="text-sm font-normal text-slate-500">/mo</span></p>
                  <p className="text-xs text-slate-500 mt-1">{plan.features}</p>
                  {subscription?.plan !== plan.key && (
                    <Link href={`/pricing?plan=${plan.key}`} className="mt-4 block text-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                      Upgrade →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Billing History */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Billing History</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Description</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-6 py-3 text-sm text-slate-700">Apr 1, 2026</td>
                  <td className="px-6 py-3 text-sm text-slate-700">Pro Plan — Monthly</td>
                  <td className="px-6 py-3 text-sm text-right font-medium text-slate-900">€149.00</td>
                  <td className="px-6 py-3 text-center"><span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">Paid</span></td>
                  <td className="px-6 py-3"><Link href="#" className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3"/> Invoice</Link></td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-sm text-slate-700">Mar 1, 2026</td>
                  <td className="px-6 py-3 text-sm text-slate-700">Starter Plan — Monthly</td>
                  <td className="px-6 py-3 text-sm text-right font-medium text-slate-900">€49.00</td>
                  <td className="px-6 py-3 text-center"><span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">Paid</span></td>
                  <td className="px-6 py-3"><Link href="#" className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3"/> Invoice</Link></td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
