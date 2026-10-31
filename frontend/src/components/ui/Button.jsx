import { clsx } from 'clsx';

const variants = {
  primary:
    'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-600 focus-visible:ring-indigo-500 border border-indigo-500/40',
  secondary:
    'bg-white text-slate-700 border border-slate-200/80 shadow-2xs hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 focus-visible:ring-slate-300',
  danger:
    'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-sm shadow-rose-500/25 hover:from-rose-500 hover:to-rose-600 focus-visible:ring-rose-500 border border-rose-500/40',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300',
  success:
    'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-sm shadow-emerald-500/25 hover:from-emerald-500 hover:to-emerald-600 focus-visible:ring-emerald-500 border border-emerald-500/40',
  warning:
    'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 focus-visible:ring-amber-400',
  link:
    'text-indigo-600 hover:text-indigo-800 underline-offset-4 hover:underline p-0 h-auto font-medium',
};

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-lg font-medium',
  sm: 'px-3 py-1.5 text-xs rounded-xl font-semibold',
  md: 'px-4 py-2 text-sm rounded-xl font-semibold',
  lg: 'px-5 py-2.5 text-base rounded-2xl font-semibold',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon = null,
  iconRight = false,
  className = '',
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2 transition-all duration-150 ease-out cursor-pointer active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none',
        variant !== 'link' && sizes[size],
        variants[variant],
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        Icon && !iconRight && <Icon className="h-4 w-4 shrink-0 stroke-[2.2]" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconRight && <Icon className="h-4 w-4 shrink-0 stroke-[2.2]" />}
    </button>
  );
}
