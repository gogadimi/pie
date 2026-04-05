import Link from 'next/link';
import { ArrowRight, Zap, Brain, BarChart3, Shield, Globe, TrendingUp, Users, Check, Star } from 'lucide-react';

export default function LandingPage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            AI-Powered Pricing Intelligence
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 leading-tight max-w-4xl mx-auto">
            Never lose a sale to
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600"> a better price </span>
            again
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            PIE monitors competitor prices in real-time, analyzes the market with AI,
            and <strong>automatically adjusts your prices</strong> to maximize profit and market share.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300"
            >
              Start 14-Day Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all"
            >
              View Pricing
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-400">No credit card required · Cancel anytime · Setup in 5 minutes</p>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { value: '10%', label: 'Avg. Profit Increase' },
              { value: '24/7', label: 'Real-time Monitoring' },
              { value: '10,000+', label: 'Competitors Tracked' },
              { value: '<30s', label: 'Price Updates' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-extrabold text-indigo-600">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Everything you need to win on price</h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              From competitor monitoring to autonomous price changes — PIE handles it all.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: 'Real-Time Monitoring',
                desc: 'Track 10,000+ competitor prices across any website. Updates every 30 seconds.',
                color: 'bg-blue-100 text-blue-600',
              },
              {
                icon: Brain,
                title: 'AI Pricing Agent',
                desc: 'Autonomous AI that analyzes market data and recommends optimal pricing for maximum profit.',
                color: 'bg-violet-100 text-violet-600',
              },
              {
                icon: BarChart3,
                title: 'Scenario Simulator',
                desc: 'Test what-if scenarios before making changes. See projected revenue, margin, and volume impact.',
                color: 'bg-emerald-100 text-emerald-600',
              },
              {
                icon: TrendingUp,
                title: 'Auto-Repricing',
                desc: 'One-click approve or fully autonomous. AI changes prices via Stripe, Shopify, or WooCommerce.',
                color: 'bg-orange-100 text-orange-600',
              },
              {
                icon: Shield,
                title: 'Safety Rails',
                desc: 'Set minimum margins, price floors, and change limits. AI always respects your business rules.',
                color: 'bg-red-100 text-red-600',
              },
              {
                icon: Users,
                title: 'Multi-Channel',
                desc: 'Works with any platform: Shopify, WooCommerce, Stripe, SaaS, custom APIs, and direct websites.',
                color: 'bg-indigo-100 text-indigo-600',
              },
            ].map((feature) => (
              <div key={feature.title} className="p-6 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all group">
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Why PIE beats the competition</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-500">Feature</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-indigo-600 bg-indigo-50/50">PIE ⭐</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-slate-500">Prisync</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-slate-500">Competera</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-slate-500">Omnia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ['Real-Time Updates (30s)', true, false, true, true],
                    ['Autonomous AI Agent', true, false, false, false],
                    ['Scenario Simulator', true, false, false, false],
                    ['SaaS/Services Pricing', true, false, false, false],
                    ['Self-Service SMB Plan', true, true, false, false],
                    ['Price: Starts at', '€49/mo', '€50/mo', 'Enterprise', 'Enterprise'],
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? '' : 'bg-slate-50'}>
                      <td className="px-6 py-3.5 text-sm font-medium text-slate-700">{row[0]}</td>
                      <td className="px-6 py-3.5 text-center bg-indigo-50/30">
                        {typeof row[1] === 'boolean'
                          ? (row[1] ? <span className="text-emerald-500 font-bold">✓</span> : <span className="text-red-400">✗</span>)
                          : <span className="text-sm font-medium text-indigo-700">{row[1]}</span>}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {typeof row[2] === 'boolean'
                          ? (row[2] ? <span className="text-emerald-500 font-bold">✓</span> : <span className="text-red-400">✗</span>)
                          : <span className="text-sm text-slate-600">{row[2]}</span>}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {typeof row[3] === 'boolean'
                          ? (row[3] ? <span className="text-emerald-500 font-bold">✓</span> : <span className="text-red-400">✗</span>)
                          : <span className="text-sm text-slate-600">{row[3]}</span>}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {typeof row[4] === 'boolean'
                          ? (row[4] ? <span className="text-emerald-500 font-bold">✓</span> : <span className="text-red-400">✗</span>)
                          : <span className="text-sm text-slate-600">{row[4]}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-16">Trusted by 500+ businesses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah K.', role: 'E-Commerce Manager', text: '"PIE increased our margins by 12% in just 3 months. The AI recommendations are incredibly accurate."', stars: 5 },
              { name: 'Marcus L.', role: 'Head of Pricing', text: '"We used to spend 20 hours/month on price analysis. Now PIE does it autonomously. Game changer."', stars: 5 },
              { name: 'Elena R.', role: 'CEO, SaaS Startup', text: '"Finally a pricing tool that works for SaaS, not just physical products. The simulator alone is worth it."', stars: 5 },
            ].map((t, i) => (
              <div key={i} className="p-6 rounded-2xl border border-slate-200">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.stars)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-blue-700">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to optimize your pricing?</h2>
          <p className="mt-4 text-lg text-indigo-100">Start your 14-day free trial. No credit card required. Setup in 5 minutes.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 mt-8 px-8 py-4 text-lg font-semibold text-indigo-600 bg-white rounded-xl hover:bg-indigo-50 transition-all shadow-lg"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
