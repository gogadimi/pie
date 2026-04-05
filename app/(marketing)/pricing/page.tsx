'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Loader2 } from 'lucide-react';

const plans = [
  { name: 'Starter', key: 'starter', price: 49, desc: 'Small businesses getting started',
    features: ['Up to 50 competitors', '3x daily price checks', 'Basic AI recommendations', 'Email alerts', 'CSV import', '30-day history', 'Community support'] },
  { name: 'Pro', key: 'pro', price: 149, desc: 'Growing businesses',
    features: ['Unlimited competitors', '10-60 second checks', 'Full AI Agent + auto-approve', 'Slack + Email + Telegram alerts', 'Scenario Simulator', 'Unlimited history', 'Shopify + Stripe integration', 'Multi-currency (30+)', 'Priority support'], popular: true },
  { name: 'Enterprise', key: 'enterprise', price: 799, desc: 'Large retailers and brands',
    features: ['Everything in Pro', 'Real-time (seconds)', 'Full autonomy mode', 'White-label dashboard', 'Custom API integration', 'SSO + RBAC', 'Dedicated account manager', 'Custom SLA', 'On-premise option'] },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (plan: string) => {
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, email: 'demo@example.com' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(null);
  };

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900">Simple, transparent pricing</h1>
          <p className="mt-4 text-lg text-slate-500">14-day free trial. No credit card required.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative rounded-2xl p-8 ${plan.popular ? 'bg-gradient-to-b from-indigo-600 to-blue-700 text-white shadow-2xl shadow-indigo-200 scale-105' : 'bg-white border border-slate-200'}`}>
              {plan.popular && <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full">MOST POPULAR</span>}
              <h3 className={`text-xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
              <p className={`mt-2 text-sm ${plan.popular ? 'text-indigo-200' : 'text-slate-500'}`}>{plan.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className={`text-4xl font-extrabold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>€{plan.price}</span>
                <span className={`text-sm ${plan.popular ? 'text-indigo-200' : 'text-slate-500'}`}>/month</span>
              </div>
              {plan.popular || plan.key === 'starter' ? (
                <button onClick={() => handleCheckout(plan.key)} disabled={!!loading} className={`mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${plan.popular ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'} disabled:opacity-50`}>
                  {loading === plan.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Start Free Trial <ArrowRight className="w-4 h-4" /></>}
                </button>
              ) : (
                <Link href="/contact" className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all">
                  Contact Sales <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? 'text-indigo-200' : 'text-emerald-500'}`} />
                    <span className={`text-sm ${plan.popular ? 'text-indigo-100' : 'text-slate-600'}`}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {error && <div className="mt-8 max-w-md mx-auto p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">⚠️ {error}</div>}
      </div>
    </div>
  );
}
