"use client";

import {
  UserButton,
  OrganizationSwitcher,
  useUser,
} from "@clerk/nextjs";
import { Bell, Search } from "lucide-react";
import { useState } from "react";

export default function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-lg px-6 h-16 flex items-center gap-4">
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-slate-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-slate-500 truncate">{subtitle}</p>
        )}
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center relative">
        <Search className="absolute left-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search anything…"
          className="w-64 pl-9 pr-4 py-2 bg-slate-100 border-0 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notifications placeholder */}
        <button
          className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block" />

        {/* Org switcher */}
        <div className="hidden lg:block">
          <OrganizationSwitcher
            appearance={{
              elements: {
                rootBox: "flex items-center",
                organizationSwitcherTrigger:
                  "border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition",
              },
            }}
          />
        </div>

        {/* User button */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
            },
          }}
        />
      </div>
    </header>
  );
}
