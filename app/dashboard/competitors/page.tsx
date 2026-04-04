"use client";

import { useState } from "react";
import {
  Plus,
  Globe,
  Trash2,
  Check,
  X,
  Shield,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { Card, Badge, Button, EmptyState } from "@/components/ui/common";

interface Competitor {
  id: string;
  name: string;
  url: string;
  industry: string;
  status: "active" | "paused" | "error";
  lastScraped: string;
  trackedProducts: number;
  successRate: number;
}

const MOCK_COMPETITORS: Competitor[] = [
  {
    id: "comp-1",
    name: "OfficeMax.de",
    url: "https://officemax.de",
    industry: "Office Supplies",
    status: "active",
    lastScraped: "2026-04-04T18:00:00Z",
    trackedProducts: 23,
    successRate: 98.5,
  },
  {
    id: "comp-2",
    name: "Staples Europe",
    url: "https://staples.eu",
    industry: "Office Supplies",
    status: "active",
    lastScraped: "2026-04-04T16:30:00Z",
    trackedProducts: 18,
    successRate: 96.2,
  },
  {
    id: "comp-3",
    name: "TechGear.eu",
    url: "https://techgear.eu",
    industry: "Electronics",
    status: "active",
    lastScraped: "2026-04-04T20:00:00Z",
    trackedProducts: 31,
    successRate: 94.1,
  },
  {
    id: "comp-4",
    name: "DeskPro.io",
    url: "https://deskpro.io",
    industry: "Furniture",
    status: "paused",
    lastScraped: "2026-03-30T12:00:00Z",
    trackedProducts: 12,
    successRate: 88.3,
  },
  {
    id: "comp-5",
    name: "Amazon.de Marketplace",
    url: "https://amazon.de",
    industry: "Marketplace",
    status: "error",
    lastScraped: "2026-04-03T08:00:00Z",
    trackedProducts: 45,
    successRate: 62.4,
  },
];

const INDUSTRIES = [
  "Office Supplies",
  "Electronics",
  "Furniture",
  "Marketplace",
  "Fashion",
  "Other",
];

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>(MOCK_COMPETITORS);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIndustry, setNewIndustry] = useState("Electronics");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    const newComp: Competitor = {
      id: `comp-${Date.now()}`,
      name: newName.trim(),
      url: newUrl.trim(),
      industry: newIndustry,
      status: "active",
      lastScraped: "",
      trackedProducts: 0,
      successRate: 0,
    };

    setCompetitors((prev) => [newComp, ...prev]);
    setNewName("");
    setNewUrl("");
    setNewIndustry("Electronics");
    setShowAdd(false);
  };

  const handleRemove = (id: string) => {
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
  };

  const statusColors: Record<string, string> = {
    active: "success",
    paused: "warning",
    error: "danger",
  } as const;

  const statusLabels: Record<string, string> = {
    active: "Tracking",
    paused: "Paused",
    error: "Error",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Competitors</h2>
          <p className="text-sm text-slate-500 mt-1">
            Track and compare prices across your competitors.
          </p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Competitor
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-lg">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {competitors.filter((c) => c.status === "active").length}
              </p>
              <p className="text-xs text-slate-500">Active Competitors</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {competitors.reduce((s, c) => s + c.trackedProducts, 0)}
              </p>
              <p className="text-xs text-slate-500">Total Tracked URLs</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-lg">
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {competitors.length > 0
                  ? (
                      competitors.reduce((s, c) => s + c.successRate, 0) /
                      competitors.length
                    ).toFixed(1)
                  : "0"}
                %
              </p>
              <p className="text-xs text-slate-500">Avg. Success Rate</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Add competitor form */}
      {showAdd && (
        <Card>
          <form onSubmit={handleAdd} className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">
              New Competitor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Amazon.de"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://amazon.de"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Industry
                </label>
                <select
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-white"
                >
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <Button type="submit">
                <Check className="w-4 h-4 mr-1.5" />
                Add Competitor
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdd(false)}
              >
                <X className="w-4 h-4 mr-1.5" />
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Competitors list */}
      <Card>
        {competitors.length === 0 ? (
          <EmptyState
            title="No competitors yet"
            description="Add your first competitor to start tracking their prices."
            action={
              <Button onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Competitor
              </Button>
            }
          />
        ) : (
          <div>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
              <div className="col-span-3">Competitor</div>
              <div className="col-span-2">Industry</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Products</div>
              <div className="col-span-1">Success</div>
              <div className="col-span-2">Last Scraped</div>
              <div className="col-span-2">Actions</div>
            </div>

            <div className="divide-y divide-slate-50">
              {competitors.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 hover:bg-slate-50 transition-colors items-center"
                >
                  {/* Competitor name */}
                  <div className="col-span-3 flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {c.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {c.url}
                      </p>
                    </div>
                  </div>

                  {/* Industry */}
                  <div className="col-span-2">
                    <Badge variant="default">{c.industry}</Badge>
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <Badge
                      variant={
                        statusColors[c.status] as
                          | "success"
                          | "warning"
                          | "danger"
                          | "default"
                      }
                    >
                      {statusLabels[c.status]}
                    </Badge>
                  </div>

                  {/* Tracked products */}
                  <div className="col-span-1 text-sm text-slate-600 tabular-nums">
                    {c.trackedProducts}
                  </div>

                  {/* Success rate */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-[60px]">
                        <div
                          className={`h-full rounded-full transition-all ${
                            c.successRate >= 90
                              ? "bg-emerald-500"
                              : c.successRate >= 70
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${c.successRate}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-slate-500">
                        {c.successRate}%
                      </span>
                    </div>
                  </div>

                  {/* Last scraped */}
                  <div className="col-span-2 text-xs text-slate-400">
                    {c.lastScraped
                      ? new Date(c.lastScraped).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center gap-2">
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      Visit
                    </a>
                    {c.status === "error" && (
                      <Button variant="ghost" size="sm">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" />
                        Retry
                      </Button>
                    )}
                    <button
                      onClick={() => handleRemove(c.id)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                      title="Remove competitor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
