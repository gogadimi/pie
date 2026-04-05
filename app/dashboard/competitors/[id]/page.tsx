'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function CompetitorDetailPage() {
  const pathname = usePathname();
  const compId = pathname?.split('/').pop() || '';
  const [loading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from API
  }, [compId]);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Loading...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/competitors" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-slate-500"/></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Competitor Details</h1>
          <p className="text-sm text-slate-500 mt-1">Tracking products and price history</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-500">Competitor data will be loaded here</p>
        <p className="text-xs text-slate-400 mt-2">ID: {compId}</p>
      </div>
    </div>
  );
}
