"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
} from "lucide-react";
import { Badge, Card, Button, EmptyState } from "@/components/ui/common";

interface Product {
  id: string;
  name: string;
  sku: string;
  currentPrice: string;
  currency: string;
  category: string;
  source: string;
  status: string;
  createdAt: string;
  competitorCount: number;
  lastScraped: string;
  priceChange7d: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [formError, setFormError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Electronics");

  const fetchProducts = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setProducts(data.data ?? []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(search);
  }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(search);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Product name is required");
      return;
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sku, currentPrice: price, category }),
      });
      const data = await res.json();

      if (data.success) {
        // Reset and refetch
        setName("");
        setSku("");
        setPrice("");
        setCategory("Electronics");
        setShowAdd(false);
        fetchProducts(search);
      } else {
        setFormError(data.error ?? "Failed to create product");
      }
    } catch {
      setFormError("Network error");
    }
  };

  const categories = ["Electronics", "Furniture", "Clothing", "Uncategorized"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Products</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage and monitor your product catalog.
          </p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Product
        </Button>
      </div>

      {/* Add product modal / inline form */}
      {showAdd && (
        <Card>
          <form
            onSubmit={handleCreate}
            className="p-6"
          >
            <h3 className="font-semibold text-slate-900 mb-4">
              New Product
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Wireless Mouse"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g., MOUSE-WL-01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Price (EUR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {formError && (
              <p className="text-sm text-red-600 mt-3">{formError}</p>
            )}
            <div className="flex items-center gap-3 mt-5">
              <Button type="submit">Create Product</Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search & filters */}
      <Card>
        <div className="p-4 flex items-center gap-3 border-b border-slate-100">
          <form onSubmit={handleSearch} className="flex-1 flex items-center">
            <button
              type="submit"
              className="absolute left-3 z-10 p-0.5"
            >
              <Search className="w-4 h-4 text-slate-400" />
            </button>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder="Search products by name or SKU…"
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </form>
          <Button variant="secondary" size="sm">
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            Filter
          </Button>
        </div>

        {/* Table header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
          <div className="col-span-4">Product</div>
          <div className="col-span-1">Price</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-1">Change</div>
          <div className="col-span-1">Competitors</div>
          <div className="col-span-2">Last Updated</div>
          <div className="col-span-1"></div>
        </div>

        {/* Table rows */}
        {loading ? (
          <div className="p-5 animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-200" />
                  <div>
                    <div className="h-3.5 w-40 rounded bg-slate-200" />
                    <div className="h-3 w-20 rounded bg-slate-100 mt-1.5" />
                  </div>
                </div>
                <div className="h-4 w-12 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Try adjusting your search or add a new product."
            action={
              <Button onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Product
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/products/${p.id}`}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group items-center"
              >
                {/* Product name */}
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                    <Package className="w-4 h-4 text-slate-400 group-hover:text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-400">{p.sku}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="col-span-1 text-sm font-semibold text-slate-900 tabular-nums md:pl-0 pl-13">
                  €{Number(p.currentPrice).toFixed(2)}
                </div>

                {/* Category */}
                <div className="col-span-2">
                  <Badge variant="purple">{p.category}</Badge>
                </div>

                {/* Change */}
                <div className="col-span-1">
                  <span
                    className={`text-sm font-medium flex items-center gap-0.5 ${
                      p.priceChange7d > 0
                        ? "text-emerald-600"
                        : p.priceChange7d < 0
                          ? "text-red-600"
                          : "text-slate-400"
                    }`}
                  >
                    {p.priceChange7d > 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : p.priceChange7d < 0 ? (
                      <ArrowDownRight className="w-3 h-3" />
                    ) : null}
                    {p.priceChange7d >= 0 ? "+" : ""}
                    {p.priceChange7d.toFixed(1)}%
                  </span>
                </div>

                {/* Competitors */}
                <div className="col-span-1 text-sm text-slate-600 tabular-nums">
                  {p.competitorCount}
                </div>

                {/* Last updated */}
                <div className="col-span-2 text-xs text-slate-400">
                  {p.lastScraped
                    ? new Date(p.lastScraped).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end">
                  <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
