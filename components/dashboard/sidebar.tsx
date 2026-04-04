"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users2,
  Map,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react";

import { useState } from "react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Products",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    label: "Competitors",
    href: "/dashboard/competitors",
    icon: Users2,
  },
  {
    label: "Price Map",
    href: "/dashboard/price-map",
    icon: Map,
  },
  {
    label: "Alerts",
    href: "/dashboard/alerts",
    icon: Bell,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        relative flex flex-col bg-slate-900 text-slate-200
        transition-[width,transform] duration-200 ease-in-out
        ${collapsed ? "w-[68px]" : "w-[260px]"}
        border-r border-slate-800/60
      `}
    >
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800/60 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">P</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-semibold text-white text-sm truncate">PIE</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              Pricing Engine
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 hover:bg-slate-800 rounded-md shrink-0 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative
                    ${
                      active
                        ? "bg-indigo-600/15 text-indigo-400"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }
                    ${collapsed ? "justify-center" : ""}
                  `}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon
                    className={`w-[18px] h-[18px] shrink-0 ${active ? "text-indigo-400" : "text-slate-400"}`}
                  />
                  {!collapsed && item.label}
                  {/* Active indicator bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-500 rounded-r-full" />
                  )}
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
              <span className="text-indigo-400 text-xs font-semibold">U</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-medium text-white truncate">
                demo@pie.app
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                Starter plan
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
