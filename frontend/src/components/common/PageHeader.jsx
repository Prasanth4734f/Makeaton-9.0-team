import { ChevronRight, Home } from 'lucide-react';
import { clsx } from 'clsx';

export function PageHeader({ title, subtitle = null, actions = null, breadcrumbs = null }) {
  return (
    <div className="mb-8">
      {breadcrumbs && (
        <nav className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <span className="flex items-center gap-1 hover:text-slate-600 transition-colors cursor-pointer">
            <Home className="h-3 w-3" />
          </span>
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-slate-300" />
              <span
                className={clsx(
                  i === breadcrumbs.length - 1
                    ? 'text-indigo-600 font-semibold'
                    : 'hover:text-slate-600 transition-colors cursor-pointer'
                )}
              >
                {b}
              </span>
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-xs font-medium text-slate-500 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
