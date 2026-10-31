import { clsx } from 'clsx';

const STATUS_MAP = {
  // Subscriptions & general
  active:    { label: 'Active',     dot: 'bg-emerald-500',  classes: 'bg-emerald-100/90 text-emerald-800 ring-emerald-600/30 font-bold' },
  inactive:  { label: 'Inactive',   dot: 'bg-slate-400',    classes: 'bg-slate-100 text-slate-700 ring-slate-300 font-semibold' },
  trialing:  { label: 'Trialing',   dot: 'bg-blue-500',     classes: 'bg-blue-100 text-blue-800 ring-blue-500/30 font-bold' },
  paused:    { label: 'Paused',     dot: 'bg-amber-500',    classes: 'bg-amber-100 text-amber-900 ring-amber-500/30 font-bold' },
  past_due:  { label: 'Past Due',   dot: 'bg-orange-500',   classes: 'bg-orange-100 text-orange-900 ring-orange-500/30 font-bold' },
  overdue:   { label: 'Overdue',    dot: 'bg-rose-500',     classes: 'bg-rose-100 text-rose-900 ring-rose-500/30 font-bold' },
  cancelled: { label: 'Cancelled',  dot: 'bg-slate-400',    classes: 'bg-slate-100 text-slate-600 ring-slate-300 font-semibold' },
  churned:   { label: 'Churned',    dot: 'bg-rose-600',     classes: 'bg-rose-100 text-rose-900 ring-rose-600/30 font-bold' },
  at_risk:   { label: 'At Risk',    dot: 'bg-amber-500 animate-pulse', classes: 'bg-amber-100 text-amber-900 ring-amber-500/40 font-bold' },
  // Invoices & Quotes
  draft:    { label: 'Draft',       dot: 'bg-slate-400',    classes: 'bg-slate-100 text-slate-700 ring-slate-300 font-semibold' },
  sent:     { label: 'Sent',        dot: 'bg-sky-500',      classes: 'bg-sky-100 text-sky-800 ring-sky-500/30 font-bold' },
  paid:     { label: 'Paid',        dot: 'bg-emerald-500',  classes: 'bg-emerald-100/90 text-emerald-800 ring-emerald-600/30 font-bold' },
  accepted: { label: 'Accepted',    dot: 'bg-emerald-500',  classes: 'bg-emerald-100/90 text-emerald-800 ring-emerald-600/30 font-bold' },
  rejected: { label: 'Rejected',    dot: 'bg-rose-500',     classes: 'bg-rose-100 text-rose-900 ring-rose-500/30 font-bold' },
  expired:  { label: 'Expired',     dot: 'bg-slate-400',    classes: 'bg-slate-100 text-slate-600 ring-slate-300 font-semibold' },
  // Payments
  success:  { label: 'Success',     dot: 'bg-emerald-500',  classes: 'bg-emerald-100/90 text-emerald-800 ring-emerald-600/30 font-bold' },
  failed:   { label: 'Failed',      dot: 'bg-rose-500',     classes: 'bg-rose-100 text-rose-900 ring-rose-500/30 font-bold' },
  pending:  { label: 'Pending',     dot: 'bg-amber-500',    classes: 'bg-amber-100 text-amber-900 ring-amber-500/30 font-bold' },
  // Actions
  open:     { label: 'Open Action', dot: 'bg-blue-500 animate-pulse', classes: 'bg-blue-100 text-blue-800 ring-blue-500/30 font-bold' },
  snoozed:  { label: 'Snoozed',     dot: 'bg-amber-400',    classes: 'bg-amber-100 text-amber-900 ring-amber-400/30 font-bold' },
  resolved: { label: 'Resolved',    dot: 'bg-emerald-500',  classes: 'bg-emerald-100 text-emerald-800 ring-emerald-500/30 font-bold' },
};

const PRIORITY_MAP = {
  critical: { label: 'Critical Risk', dot: 'bg-rose-500 animate-ping', classes: 'bg-rose-100 text-rose-900 ring-rose-600/40 font-bold' },
  high:     { label: 'High Priority', dot: 'bg-orange-500',            classes: 'bg-orange-100 text-orange-900 ring-orange-500/40 font-bold' },
  medium:   { label: 'Medium',        dot: 'bg-amber-500',             classes: 'bg-amber-100 text-amber-900 ring-amber-500/30 font-bold' },
  low:      { label: 'Low',           dot: 'bg-slate-400',             classes: 'bg-slate-100 text-slate-700 ring-slate-300 font-semibold' },
};

export function StatusBadge({ status, type = 'status', className = '', showDot = true }) {
  const map = type === 'priority' ? PRIORITY_MAP : STATUS_MAP;
  const config = map[status] || {
    label: status,
    dot: 'bg-slate-400',
    classes: 'bg-slate-100 text-slate-600 ring-slate-200'
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight ring-1 ring-inset backdrop-blur-xs transition-colors',
        config.classes,
        className
      )}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className={clsx('absolute inline-flex h-full w-full rounded-full opacity-75', config.dot)} />
          <span className={clsx('relative inline-flex h-1.5 w-1.5 rounded-full', config.dot.replace(' animate-pulse', '').replace(' animate-ping', ''))} />
        </span>
      )}
      {config.label}
    </span>
  );
}
