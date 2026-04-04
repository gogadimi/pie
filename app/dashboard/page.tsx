"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { StatCard, Card, Badge } from "@/components/ui/common";

interface Product {
  id: string;
  name: string;
  currentPrice: string;
  priceChange7d: number;
  lastScraped: string;
  competitorCount: number;
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/products?status=active")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.data.slice(0, 4) ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
        <p className="text-sm text-slate-500 mt-1">
          Track your pricing performance and competitor landscape.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tracked Products"
          value="24"
          change="3 new"
          icon={<Package className="w-5 h-5" />}
          changeType="positive"
        />
        <StatCard
          title="Avg. Margin"
          value="52.4%"
          change="2.1%"
          icon={<TrendingUp className="w-5 h-5" />}
          changeType="positive"
        />
        <StatCard
          title="Price Changes (7d)"
          value="7"
          change="3 below market"
          icon={<TrendingDown className="w-5 h-5" />}
          changeType="negative"
        />
        <StatCard
          title="Revenue Impact"
          value="€12,450"
          change="8.3%"
          icon={<DollarSign className="w-5 h-5" />}
          changeType="positive"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent price changes */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">
              Tracked Products
            </h3>
            <Link
              href="/dashboard/products"
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="p-5 animate-pulse space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-200" />
                    <div>
                      <div className="h-3.5 w-48 rounded bg-slate-200" />
                      <div className="h-3 w-16 rounded bg-slate-100 mt-1.5" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-3.5 w-14 rounded bg-slate-200" />
                    <div className="h-3.5 w-12 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No products found. Add your first product to get started.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {products.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/products/${p.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 group-hover:from-indigo-50 group-hover:to-indigo-100 transition-colors">
                      <Package className="w-4 h-4 text-slate-500 group-hover:text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {p.competitorCount} competitors &middot;
                        Last updated{" "}
                        {p.lastScraped
                          ? new Date(p.lastScraped).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 ml-3">
                    <span className="text-sm font-semibold text-slate-900 tabular-nums">
                      €{p.currentPrice}
                    </span>
                    <Badge
                      variant={
                        p.priceChange7d > 0
                          ? "success"
                          : p.priceChange7d < 0
                            ? "danger"
                            : "default"
                      }
                    >
                      <span className="inline-flex items-center gap-0.5">
                        {p.priceChange7d > 0 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : p.priceChange7d < 0 ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : null}
                        {p.priceChange7d >= 0
                          ? "+"
                          : ""}
                        {p.priceChange7d.toFixed(1)}%
                      </span>
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Alerts + Quick Actions */}
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Recent Alerts</h3>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="px-5 py-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Competitor price drop detected
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Acme Corp lowered{" "}
                  <span className="font-medium text-slate-700">
                    Wireless Keyboard
                  </span>{" "}
                  by 12%
                </p>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  2 hours ago
                </p>
              </div>
            </div>
            <div className="px-5 py-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Out of stock alert
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="font-medium text-slate-700">
                    Standing Desk
                  </span>{" "}
                  is no longer available at DeskPro
                </p>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  5 hours ago
                </p>
              </div>
            </div>
            <div className="px-5 py-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Price recommendation
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  AI suggests raising{" "}
                  <span className="font-medium text-slate-700">
                    USB-C Dock
                  </span>{" "}
                  by 6.5%
                </p>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  1 day ago
                </p>
              </div>
            </div>
            <div className="px-5 py-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                <Package className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  New competitor detected
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Added{" "}
                  <span className="font-medium text-slate-700">
                    TechGear.eu
                  </span>{" "}
                  to tracking list
                </p>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  2 days ago
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick stats bar */}
      <Card>
        <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-5 divide-x divide-slate-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">47</p>
            <p className="text-xs text-slate-500 mt-0.5">Total Competitors</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">1,240</p>
            <p className="text-xs text-slate-500 mt-0.5">Prices Scraped</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">98.2%</p>
            <p className="text-xs text-slate-500 mt-0.5">Scrape Success</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">€3,200</p>
            <p className="text-xs text-slate-500 mt-0.5">Est. Monthly Savings</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">99.7%</p>
            <p className="text-xs text-slate-500 mt-0.5">Uptime</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
