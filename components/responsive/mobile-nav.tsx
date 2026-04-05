'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Users2, BarChart3, Sparkles } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/dashboard/products', icon: Package, label: 'Products' },
  { href: '/dashboard/competitors', icon: Users2, label: 'Competitors' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/recommendations', icon: Sparkles, label: 'AI Agent' },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom">
      <div className="flex h-16">
        {navItems.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] transition-colors relative ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
              <item.icon className="w-5 h-5"/>
              <span className="text-[10px] font-medium">{item.label}</span>
              {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-600 rounded-full"/>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
