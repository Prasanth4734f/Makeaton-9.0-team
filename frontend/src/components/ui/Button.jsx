import { clsx } from 'clsx';

// Explicit foreground text color mapping to guarantee 100% contrast & visibility
export const VARIANT_TEXT_COLORS = {
  primary: '#ffffff',
  secondary: '#334155',
  danger: '#ffffff',
  ghost: '#475569',
  success: '#ffffff',
  warning: '#ffffff',
  outline: '#4f46e5',
  link: '#4f46e5',
};

const variants = {
  primary:
    'bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 text-white !text-white shadow-sm shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-600 focus-visible:ring-indigo-500 border border-indigo-500/40 btn-primary',
  secondary:
    'bg-white text-slate-700 !text-slate-700 border border-slate-200/80 shadow-2xs hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 focus-visible:ring-slate-300 btn-secondary',
  danger:
    'bg-gradient-to-r from-rose-600 to-rose-700 text-white !text-white shadow-sm shadow-rose-500/25 hover:from-rose-500 hover:to-rose-600 focus-visible:ring-rose-500 border border-rose-500/40 btn-danger',
  ghost:
    'text-slate-600 !text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300 btn-ghost',
  success:
    'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white !text-white shadow-sm shadow-emerald-500/25 hover:from-emerald-500 hover:to-emerald-600 focus-visible:ring-emerald-500 border border-emerald-500/40 btn-success',
  warning:
    'bg-gradient-to-r from-amber-500 to-amber-600 text-white !text-white shadow-sm shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 focus-visible:ring-amber-400 btn-warning',
  outline:
    'bg-transparent text-indigo-600 !text-indigo-600 border border-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:ring-indigo-500 btn-outline',
  link:
    'text-indigo-600 !text-indigo-600 hover:text-indigo-800 underline-offset-4 hover:underline p-0 h-auto font-medium btn-link',
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
  style = {},
  ...props
}) {
  const isDisabled = disabled || loading;
  const activeVariant = variants[variant] ? variant : 'primary';
  const textColor = VARIANT_TEXT_COLORS[activeVariant] || '#ffffff';

  // Explicit, unshakeable style rules guaranteeing visibility, opacity, and contrast
  const combinedButtonStyle = {
    color: textColor,
    WebkitTextFillColor: textColor,
    opacity: isDisabled ? 0.7 : 1,
    visibility: 'visible',
    ...style,
  };

  const spanStyle = {
    color: textColor,
    WebkitTextFillColor: textColor,
    opacity: 1,
    visibility: 'visible',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      data-variant={activeVariant}
      style={combinedButtonStyle}
      className={clsx(
        'inline-flex items-center justify-center gap-2 transition-all duration-150 ease-out cursor-pointer active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none',
        variant !== 'link' && sizes[size],
        variants[activeVariant],
        className
      )}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-0.5 h-4 w-4 shrink-0 text-current"
          style={{ color: textColor, opacity: 1, stroke: 'currentColor' }}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        Icon && !iconRight && (
          <Icon
            className="h-4 w-4 shrink-0 stroke-[2.2] text-current"
            style={{ color: textColor, opacity: 1, stroke: 'currentColor' }}
          />
        )
      )}
      <span
        style={spanStyle}
        className={clsx(
          'inline-block font-semibold select-none',
          textColor === '#ffffff' ? 'text-white !text-white' : 'text-slate-700 !text-slate-700'
        )}
      >
        {children}
      </span>
      {!loading && Icon && iconRight && (
        <Icon
          className="h-4 w-4 shrink-0 stroke-[2.2] text-current"
          style={{ color: textColor, opacity: 1, stroke: 'currentColor' }}
        />
      )}
    </button>
  );
}
