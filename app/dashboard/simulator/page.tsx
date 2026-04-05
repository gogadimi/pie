'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, Package, AlertTriangle } from 'lucide-react';

interface SimulationResult {
  price: number;
  projectedVolume: number;
  projectedRevenue: number;
  projectedMargin: number;
  marketShareEstimate: number;
  profit?: number;
}

function simulatePriceChange(
  currentPrice: number,
  costPrice: number,
  currentVolume: number,
  competitorAvgPrice: number,
  priceChange: number
): SimulationResult[] {
  const results: SimulationResult[] = [];
  const elasticity = -1.5; // standard price elasticity

  for (let change = -30; change <= 30; change += 2) {
    const newPrice = currentPrice * (1 + change / 100);
    const volumeChange = change * elasticity;
    const newVolume = Math.round(currentVolume * (1 + volumeChange / 100));
    const revenue = newPrice * newVolume;
    const margin = ((newPrice - costPrice) / newPrice) * 100;
    const marketShareDiff = ((competitorAvgPrice - newPrice) / competitorAvgPrice) * 100;
    const marketShare = Math.max(5, Math.min(45, 20 + marketShareDiff));

    results.push({
      price: Math.round(newPrice * 100) / 100,
      projectedVolume: newVolume,
      projectedRevenue: Math.round(revenue),
      projectedMargin: Math.round(margin * 10) / 10,
      marketShareEstimate: Math.round(marketShare * 10) / 10,
    });
  }

  return results;
}

export default function SimulatorPage() {
  const [price, setPrice] = useState(1299);
  const [cost, setCost] = useState(950);
  const [volume, setVolume] = useState(150);
  const [competitorAvg, setCompetitorAvg] = useState(1338);
  const [currentPriceInput, setCurrentPriceInput] = useState(1299);

  const simulation = useMemo(() => {
    return simulatePriceChange(currentPriceInput, cost, volume, competitorAvg, 0);
  }, [currentPriceInput, cost, volume, competitorAvg]);

  const optimalProfit = useMemo(() => {
    return simulation.reduce((max, r) => {
      const profit = r.projectedRevenue - (cost * r.projectedVolume);
      return profit > (max.profit ?? 0) ? { ...r, profit } : max;
    }, { profit: 0, price: 0, projectedVolume: 0, projectedRevenue: 0, projectedMargin: 0, marketShareEstimate: 0 });
  }, [simulation, cost]);

  const currentScenario = useMemo(() => {
    return simulation.find(r => r.price === currentPriceInput) || simulation[Math.floor(simulation.length / 2)];
  }, [simulation, currentPriceInput]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          🧮 Price Simulator
        </h1>
        <p className="text-slate-500 mt-1">What-if analysis — test different prices and see projected outcomes</p>
      </div>

      {/* Input Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Your Price', value: currentPriceInput, set: setCurrentPriceInput, min: 500, max: 2000, step: 10, prefix: '$' },
            { label: 'Cost Price', value: cost, set: setCost, min: 100, max: 1500, step: 10, prefix: '$' },
            { label: 'Current Volume', value: volume, set: setVolume, min: 10, max: 500, step: 5, prefix: '' },
            { label: 'Competitor Avg', value: competitorAvg, set: setCompetitorAvg, min: 500, max: 2000, step: 10, prefix: '$' },
          ].map((param) => (
            <div key={param.label}>
              <label className="block text-sm font-medium text-slate-600 mb-2">{param.label}</label>
              <div className="flex items-center gap-2">
                {param.prefix && <span className="text-slate-400 text-sm">{param.prefix}</span>}
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={param.value}
                  onChange={(e) => param.set(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-sm font-mono font-medium text-slate-800 w-16 text-right">{param.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Revenue', value: `$${currentScenario?.projectedRevenue.toLocaleString() || '0'}`, icon: DollarSign },
          { label: 'Margin', value: `${currentScenario?.projectedMargin || 0}%`, icon: TrendingUp },
          { label: 'Volume', value: `${currentScenario?.projectedVolume || 0} units`, icon: Package },
          { label: 'Market Share', value: `${currentScenario?.marketShareEstimate || 0}%`, icon: AlertTriangle },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <kpi.icon className="w-4 h-4 text-indigo-500" />
              <p className="text-xs text-slate-500 font-medium">{kpi.label}</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Profit Projection by Price</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={simulation}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="price" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
            <Tooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']} />
            <Legend />
            <Line type="monotone" dataKey="projectedRevenue" stroke="#6366f1" strokeWidth={2} name="Revenue" />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <p className="text-sm font-semibold text-emerald-700">💡 AI Recommendation</p>
          <p className="text-sm text-emerald-700 mt-1">
            Optimal price: <span className="font-bold">${optimalProfit.price}</span> → 
            Max profit: <span className="font-bold">${(optimalProfit.profit ?? 0).toLocaleString()}</span>
            (revenue: ${optimalProfit.projectedRevenue.toLocaleString()}, margin: {optimalProfit.projectedMargin}%)
          </p>
        </div>
      </div>
    </div>
  );
}
