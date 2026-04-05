'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Column { key: string; label: string; align?: 'left' | 'right' | 'center'; }

interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  onRowClick?: (row: Record<string, any>) => void;
}

export function ResponsiveDataTable({ columns, data, emptyState, isLoading, onRowClick }: DataTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) return <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-200 rounded"/>)}</div>;
  if (data.length === 0) return emptyState || <p className="text-center py-12 text-slate-500">No data</p>;

  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-slate-200 bg-slate-50">
            {columns.map(col => <th key={col.key} className={`px-5 py-3 text-xs font-semibold text-slate-500 uppercase ${col.align === 'right' ? 'text-right' : 'text-left'}`}>{col.label}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <tr key={row.id || i} className="hover:bg-slate-50 cursor-pointer" onClick={() => onRowClick?.(row)}>
                {columns.map(col => <td key={col.key} className={`px-5 py-3 text-sm ${col.align === 'right' ? 'text-right' : ''}`}>{row[col.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-2 md:hidden">
        {data.map((row, i) => {
          const id = String(row.id || i);
          const isExp = expanded === id;
          return (
            <div key={id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button className="w-full text-left px-4 py-3 min-h-[56px] flex items-center justify-between" onClick={() => setExpanded(isExp ? null : id)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{row[columns[0]?.key]}</p>
                  {columns[1] && <p className="text-xs text-slate-500 mt-0.5 truncate">{row[columns[1].key]}</p>}
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${isExp ? 'rotate-180' : ''}`}/>
              </button>
              {isExp && (
                <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
                  {columns.slice(2).map(col => (
                    <div key={col.key} className="flex justify-between py-1.5 text-sm">
                      <span className="text-xs text-slate-500 uppercase">{col.label}</span>
                      <span className="font-medium">{row[col.key]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
