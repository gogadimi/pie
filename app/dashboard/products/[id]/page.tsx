"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Shield,
  Clock,
} from "lucide-react";
import { Card, Badge } from "@/components/ui/common";

// Mock product detail data
const MOCK_PRODUCT = {
  id: "a1b2c3d4",
  name: "Ergonomic Office Chair Pro",
  sku: "CHAIR-PRO-001",
  currentPrice: 459.99,
  costPrice: 220.0,
  currency: "EUR",
  category: "Furniture",
  source: "shopify",
  status: "active",
  createdAt: "2025-11-12T08:30:00Z",
  description:
    "Premium ergonomic office chair with lumbar support, adjustable armrests, and breathable mesh back.",
  competitorPrices: [
    {
      id: "c1",
      competitor: "OfficeMax.de",
      price: 499.0,
      originalPrice: 549.0,
      inStock: true,
      lastChecked: "2026-04-04T18:00:00Z",
      url: "https://officemax.de/chair",
      priceDifference: "+8.5%",
      positive: false,
    },
    {
      id: "c2",
      competitor: "Staples.com",
      price: 439.99,
      originalPrice: 439.99,
      inStock: true,
      lastChecked: "2026-04-04T16:00:00Z",
      url: "https://staples.com/ergonomic-chair",
      priceDifference: "-4.3%",
      positive: true,
    },
    {
      id: "c3",
      competitor: "IKEA.com",
      price: 399.0,
      originalPrice: 449.0,
      inStock: false,
      lastChecked: "2026-04-04T14:30:00Z",
      url: "https://ikea.com/chair",
      priceDifference: "-13.2%",
      positive: true,
    },
    {
      id: "c4",
      competitor: "Amazon.de",
      price: 479.0,
      originalPrice: 479.0,
      inStock: true,
      lastChecked: "2026-04-04T20:00:00Z",
      url: "https://amazon.de/chair",
      priceDifference: "+4.1%",
      positive: false,
    },
  ],
  priceHistory: [
    { date: "2025-11", price: 499.99 },
    { date: "2025-12", price: 479.99 },
    { date: "2026-01", price: 479.99 },
    { date: "2026-02", price: 469.99 },
    { date: "2026-03", price: 459.99 },
    { date: "2026-04", price: 459.99 },
  ],
  aiRecommendation: {
    suggestedPrice: 489.99,
    reason:
      "Market analysis shows 2 out of 4 competitors are priced above €460. Our product has higher ratings and features. A modest price increase of 6.5% is recommended to improve margins without losing competitiveness.",
    confidence: 0.87,
    expectedProfitChange: "+€1,240/mo",
    riskLevel: "Low",
  },
};

export default function ProductDetailPage() {
  const params = useParams();
  const product = MOCK_PRODUCT; // In real app: fetch by params.id
  const [activeTab, setActiveTab] = useState<"competitors" | "history" | "recommendations">("competitors");

  const margin =
    product.costPrice > 0
      ? (((product.currentPrice - product.costPrice) / product.currentPrice) * 100).toFixed(1)
      : "—";

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Title */}
      <div>
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Products
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-indigo-500" />
          </div>
          {product.name}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          SKU: {product.sku} &middot;{" "}
          <Badge variant="purple">{product.category}</Badge> &middot;{" "}
          <Badge variant={product.status === "active" ? "success" : "default"}>
            {product.status}
          </Badge>
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">Current Price</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              €{product.currentPrice.toFixed(2)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">Cost Price</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              €{product.costPrice.toFixed(2)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">Margin</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{margin}%</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">Profit</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              €{(product.currentPrice - product.costPrice).toFixed(2)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4 flex items-center gap-2">
            <div>
              <p className="text-xs font-medium text-slate-500">Source</p>
              <p className="text-sm font-semibold text-slate-900 mt-1 capitalize">
                {product.source}
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-slate-200 px-6">
          <div className="flex gap-0">
            {(
              [
                { key: "competitors", label: "Competitor Prices", icon: Shield },
                { key: "history", label: "Price History", icon: BarChart3 },
                {
                  key: "recommendations",
                  label: "AI Recommendations",
                  icon: TrendingUp,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "competitors" && (
            <div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                    <th className="pb-3 font-medium">Competitor</th>
                    <th className="pb-3 font-medium">Price</th>
                    <th className="pb-3 font-medium">Original</th>
                    <th className="pb-3 font-medium">Diff</th>
                    <th className="pb-3 font-medium">Stock</th>
                    <th className="pb-3 font-medium">Last Checked</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {product.competitorPrices.map((cp) => (
                    <tr key={cp.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-medium text-slate-900">
                        {cp.competitor}
                      </td>
                      <td className="py-3 font-semibold tabular-nums">
                        €{cp.price.toFixed(2)}
                      </td>
                      <td className="py-3 text-slate-500 line-through tabular-nums">
                        €{cp.originalPrice.toFixed(2)}
                      </td>
                      <td className="py-3">
                        <Badge variant={cp.positive ? "success" : "danger"}>
                          {cp.priceDifference}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {cp.inStock ? (
                          <Badge variant="success">In Stock</Badge>
                        ) : (
                          <Badge variant="danger">Out of Stock</Badge>
                        )}
                      </td>
                      <td className="py-3 text-xs text-slate-400">
                        {new Date(cp.lastChecked).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 text-right">
                        <a
                          href={cp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-indigo-600 transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-2">
              {product.priceHistory.map((pt) => {
                const maxPrice = Math.max(...product.priceHistory.map((d) => d.price));
                const minPrice = Math.min(...product.priceHistory.map((d) => d.price));
                const range = maxPrice - minPrice || 1;
                const pct = ((pt.price - minPrice) / range) * 100;

                return (
                  <div key={pt.date} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-600 w-16">
                      {pt.date}
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 tabular-nums w-20 text-right">
                      €{pt.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 w-4">
                      <Clock className="w-3.5 h-3.5" />
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "recommendations" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* AI Recommendation card */}
                <div className="flex-1 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        Price Recommendation
                      </p>
                      <p className="text-xs text-slate-500">
                        AI Confidence:{" "}
                        {(product.aiRecommendation.confidence * 100).toFixed(0)}
                        %
                      </p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-3xl font-bold text-indigo-600">
                      €{product.aiRecommendation.suggestedPrice.toFixed(2)}
                    </span>
                    <span className="text-sm text-slate-500">
                      (Current: €
                      {product.currentPrice.toFixed(2)})
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {product.aiRecommendation.reason}
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-xs text-slate-500">Expected Profit</p>
                      <p className="text-lg font-bold text-emerald-600">
                        {product.aiRecommendation.expectedProfitChange}
                      </p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-xs text-slate-500">Risk Level</p>
                      <p className="text-lg font-bold text-slate-900">
                        {product.aiRecommendation.riskLevel}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
