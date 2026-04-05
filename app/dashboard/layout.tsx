'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Users2, Map, Bell, Settings,
  ChevronLeft, ChevronRight, BarChart3, Globe, Brain, TrendingUp,
  Menu, X,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/dashboard/products', icon: Package },
  { label: 'Competitors', href: '/dashboard/competitors', icon: Users2 },
  { label: 'Price Map', href: '/dashboard/price-map', icon: Map },
  { label: 'Scraping', href: '/dashboard/scraping', icon: Globe },
  { label: 'AI Agent', href: '/dashboard/recommendations', icon: Brain },
  { label: 'Simulator', href: '/dashboard/simulator', icon: BarChart3 },
  { label: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp },
  { label: 'Alerts', href: '/dashboard/alerts', icon: Bell },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface Stats {
  totalProducts: number;
  totalCompetitors: number;
  priceUpdatesLast7d: number;
  activeJobs: number;
  unreadAlerts: number;
  pendingRecommendations: number;
}

interface DashboardContextType {
  orgId: string;
  stats: Stats | null;
  refreshStats: () => void;
}

export const DashboardContext = createContext<DashboardContextType>({
  orgId: 'demo-org',
  stats: null,
  refreshStats: () => {},
});

export function useDashboard() {
  return useContext(DashboardContext);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [orgId] = useState('demo-org');
  const [stats, setStats] = useState<Stats | null>(null);

  const fetchStats = () => {
    fetch(`/api/dashboard/stats?orgId=${orgId}`)
      .then(r => r.json())
      .then(data => { if (data.success) setStats(data.stats); })
      .catch(() => {});
  };

  useEffect(() => { fetchStats(); }, [orgId]);

  return (
    <DashboardContext.Provider value={{ orgId, stats, refreshStats: fetchStats }}>
      <div className="min-h-screen bg-slate-50 flex">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen
          flex flex-col bg-slate-900 text-slate-200
          transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'}
          w-[260px]
          border-r border-slate-800/60
        `}>
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800/60 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold text-white text-sm truncate">PIE</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Pricing Engine</span>
              </div>
            )}
            <button onClick={() => setMobileOpen(false)} className="lg:hidden ml-auto p-1.5 hover:bg-slate-800 rounded-md">
              <X className="w-4 h-4" />
            </button>
            <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:block ml-auto p-1.5 hover:bg-slate-800 rounded-md shrink-0">
              {collapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronLeft className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative
                        ${active ? 'bg-indigo-600/15 text-indigo-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                        ${collapsed ? 'justify-center' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                      {!collapsed && item.label}
                      {item.label === 'Alerts' && (stats?.unreadAlerts || 0) > 0 && !collapsed && (
                        <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                          {(stats?.unreadAlerts || 0) > 9 ? '9+' : stats?.unreadAlerts || 0}
                        </span>
                      )}
                      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-500 rounded-r-full" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          {!collapsed && (
            <div className="px-4 pb-4 border-t border-slate-800/60 pt-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center shrink-0">
                  <span className="text-indigo-400 text-xs font-semibold">D</span>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-medium text-white truncate">Demo Org</span>
                  <span className="text-[10px] text-slate-400 truncate">Starter plan</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <header className="lg:hidden flex items-center gap-3 h-16 px-4 border-b bg-white border-slate-200">
            <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span className="font-semibold text-slate-900">PIE</span>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
