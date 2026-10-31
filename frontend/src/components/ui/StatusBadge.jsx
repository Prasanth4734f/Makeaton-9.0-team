import { clsx } from 'clsx';

const STATUS_MAP = {
  // Subscriptions & general
  active:    { label: 'Active',     dot: 'bg-emerald-500',  classes: 'bg-emerald-50/80 text-emerald-700 ring-emerald-500/20' },
  inactive:  { label: 'Inactive',   dot: 'bg-slate-400',    classes: 'bg-slate-100 text-slate-600 ring-slate-400/20' },
  trialing:  { label: 'Trialing',   dot: 'bg-blue-500',     classes: 'bg-blue-50/80 text-blue-700 ring-blue-500/20' },
  paused:    { label: 'Paused',     dot: 'bg-amber-500',    classes: 'bg-amber-50/80 text-amber-700 ring-amber-500/20' },
  past_due:  { label: 'Past Due',   dot: 'bg-orange-500',   classes: 'bg-orange-50/80 text-orange-700 ring-orange-500/25' },
  overdue:   { label: 'Overdue',    dot: 'bg-rose-500',     classes: 'bg-rose-50/80 text-rose-700 ring-rose-500/25' },
  cancelled: { label: 'Cancelled',  dot: 'bg-slate-400',    classes: 'bg-slate-100 text-slate-500 ring-slate-400/20' },
  churned:   { label: 'Churned',    dot: 'bg-rose-600',     classes: 'bg-rose-50 text-rose-700 ring-rose-500/25' },
  at_risk:   { label: 'At Risk',    dot: 'bg-amber-500 animate-pulse', classes: 'bg-amber-50/90 text-amber-800 ring-amber-500/30' },
  // Invoices & Quotes
  draft:    { label: 'Draft',       dot: 'bg-slate-400',    classes: 'bg-slate-100 text-slate-600 ring-slate-300' },
  sent:     { label: 'Sent',        dot: 'bg-indigo-500',   classes: 'bg-indigo-50/80 text-indigo-700 ring-indigo-500/25' },
  paid:     { label: 'Paid',        dot: 'bg-emerald-500',  classes: 'bg-emerald-50/80 text-emerald-700 ring-emerald-500/25' },
  accepted: { label: 'Accepted',    dot: 'bg-emerald-500',  classes: 'bg-emerald-50/80 text-emerald-700 ring-emerald-500/25' },
  rejected: { label: 'Rejected',    dot: 'bg-rose-500',     classes: 'bg-rose-50/80 text-rose-700 ring-rose-500/25' },
  expired:  { label: 'Expired',     dot: 'bg-slate-400',    classes: 'bg-slate-100 text-slate-500 ring-slate-300' },
  // Payments
  success:  { label: 'Success',     dot: 'bg-emerald-500',  classes: 'bg-emerald-50/90 text-emerald-700 ring-emerald-500/25' },
  failed:   { label: 'Failed',      dot: 'bg-rose-500',     classes: 'bg-rose-50/90 text-rose-700 ring-rose-500/25' },
  pending:  { label: 'Pending',     dot: 'bg-amber-500',    classes: 'bg-amber-50/80 text-amber-700 ring-amber-500/25' },
  // Actions
  open:     { label: 'Open Action', dot: 'bg-blue-500 animate-pulse', classes: 'bg-blue-50 text-blue-700 ring-blue-500/25' },
  snoozed:  { label: 'Snoozed',     dot: 'bg-amber-400',    classes: 'bg-amber-50 text-amber-700 ring-amber-400/25' },
  resolved: { label: 'Resolved',    dot: 'bg-emerald-500',  classes: 'bg-emerald-50 text-emerald-700 ring-emerald-500/25' },
};

const PRIORITY_MAP = {
  critical: { label: 'Critical Risk', dot: 'bg-rose-500 animate-ping', classes: 'bg-rose-50 text-rose-700 ring-rose-500/30' },
  high:     { label: 'High Priority', dot: 'bg-orange-500',            classes: 'bg-orange-50 text-orange-700 ring-orange-500/30' },
  medium:   { label: 'Medium',        dot: 'bg-amber-500',             classes: 'bg-amber-50 text-amber-700 ring-amber-500/25' },
  low:      { label: 'Low',           dot: 'bg-slate-400',             classes: 'bg-slate-100 text-slate-600 ring-slate-300' },
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
