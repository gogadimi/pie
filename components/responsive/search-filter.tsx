'use client';

import { useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface SearchFilterProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  filters?: { label: string; options: FilterOption[]; onChange: (val: string) => void; value: string }[];
}

export default function SearchFilter({ placeholder = 'Search...', value, onChange, filters }: SearchFilterProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        />
        {value && (
          <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Filter toggle */}
      {filters && filters.length > 0 && (
        <>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {showFilters ? 'Hide filters' : 'Show filters'}
          </button>

          {/* Filter options */}
          {showFilters && (
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <div key={filter.label} className="flex items-center gap-1">
                  <select
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[44px]"
                  >
                    <option value="">{filter.label}</option>
                    {filter.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
