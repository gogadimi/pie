'use client';

interface ActionButton {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}

interface ActionBarProps {
  title?: string;
  count?: number;
  actions: ActionButton[];
}

/**
 * Responsive action bar that:
 * - Shows horizontal buttons on desktop
 * - Stacks vertically on mobile with larger touch targets
 */
export default function ActionBar({ title, count, actions }: ActionBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        {title && <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h1>}
        {count !== undefined && <p className="text-sm text-slate-500 mt-0.5">{count} items</p>}
      </div>
      <div className="grid grid-cols-2 sm:flex sm:gap-2">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center sm:justify-start gap-2 min-h-[44px]
              ${action.variant === 'primary'
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                : action.variant === 'secondary'
                ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50'
              }`}
          >
            {action.icon}
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
