// ─── Currency & Number Formatters ─────────────────────────────────────────────

/**
 * Format a number as Indian Rupees (INR) with en-IN locale.
 * @param {number} amount
 * @param {boolean} compact – use 'K', 'L', 'Cr' shorthand
 */
export function formatCurrency(amount, compact = false) {
  if (amount === null || amount === undefined) return '—';
  if (compact) {
    if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`;
    if (amount >= 100_000)    return `₹${(amount / 100_000).toFixed(1)}L`;
    if (amount >= 1_000)      return `₹${(amount / 1_000).toFixed(1)}K`;
    return `₹${amount}`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a percentage value.
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return '—';
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Format a date string to "DD MMM YYYY".
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date-time string to "DD MMM YYYY, HH:MM".
 */
export function formatDateTime(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Return relative time (e.g. "3 days ago", "in 5 days").
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '—';
  const diff = new Date(dateString) - new Date();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 0) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

/**
 * Format billing cycle for display.
 */
export function formatBillingCycle(cycle) {
  const map = { monthly: 'Monthly', annual: 'Annual', quarterly: 'Quarterly', weekly: 'Weekly' };
  return map[cycle] || cycle;
}

/**
 * Format subscription status for display.
 */
export function formatStatus(status) {
  const map = {
    active: 'Active',
    inactive: 'Inactive',
    past_due: 'Past Due',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
    trialing: 'Trialing',
    paused: 'Paused',
    draft: 'Draft',
    sent: 'Sent',
    accepted: 'Accepted',
    rejected: 'Rejected',
    expired: 'Expired',
    paid: 'Paid',
    failed: 'Failed',
    pending: 'Pending',
    at_risk: 'At Risk',
    churned: 'Churned',
    success: 'Success',
    snoozed: 'Snoozed',
    open: 'Open',
    resolved: 'Resolved',
  };
  return map[status] || status;
}

/**
 * Truncate text to a max length.
 */
export function truncate(text, maxLength = 60) {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

/**
 * Get initials from a name.
 */
export function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
