'use client';

import { useLocale } from 'next-intl';
import { Languages } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchLocale = (newLocale: string) => {
    // Set locale cookie (Next.js middleware will pick it up)
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${365 * 24 * 60 * 60}`;
    setOpen(false);
    window.location.reload();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md hover:bg-slate-700/50 min-h-[36px] text-slate-400 hover:text-slate-200 transition-colors"
        aria-label="Switch language"
      >
        <Languages className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{locale.toUpperCase()}</span>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden min-w-[140px] z-50">
          {[
            { code: 'en', label: '🇬🇧 English' },
            { code: 'mk', label: '🇲🇰 Македонски' },
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => switchLocale(l.code)}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-slate-700 ${
                l.code === locale ? 'bg-indigo-600/30 text-indigo-300 font-medium' : 'text-slate-300'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
