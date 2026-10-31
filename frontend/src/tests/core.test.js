import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatPercent, getInitials } from '../utils/formatters';
import { getPasswordStrength } from '../utils/validators';
import { hasPermission } from '../utils/permissions';

// ── Formatter Tests ────────────────────────────────────────────────────────────
describe('formatCurrency', () => {
  it('formats a value as INR', () => {
    const result = formatCurrency(12999);
    expect(result).toContain('12,999');
    expect(result).toContain('₹');
  });

  it('returns dash for null/undefined', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(undefined)).toBe('—');
  });

  it('formats compact values', () => {
    expect(formatCurrency(150000, true)).toBe('₹1.5L');
    expect(formatCurrency(5000000, true)).toBe('₹50.0L');
    expect(formatCurrency(15000000, true)).toBe('₹1.5Cr');
    expect(formatCurrency(5000, true)).toBe('₹5.0K');
  });
});

describe('formatPercent', () => {
  it('formats a percent correctly', () => {
    expect(formatPercent(18)).toBe('18.0%');
    expect(formatPercent(3.14159, 2)).toBe('3.14%');
  });

  it('returns dash for null', () => {
    expect(formatPercent(null)).toBe('—');
  });
});

describe('formatDate', () => {
  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns a formatted date string', () => {
    const result = formatDate('2024-10-31');
    expect(result).toContain('2024');
    expect(result).toContain('Oct');
  });
});

describe('getInitials', () => {
  it('returns initials from name', () => {
    expect(getInitials('Harshitha Reddy')).toBe('HR');
    expect(getInitials('Ravi Kumar')).toBe('RK');
  });

  it('handles single name', () => {
    expect(getInitials('Admin')).toBe('AD');
  });

  it('returns ?? for null', () => {
    expect(getInitials(null)).toBe('??');
  });
});

// ── Password Strength Tests ────────────────────────────────────────────────────
describe('getPasswordStrength', () => {
  it('returns score 0 for empty password', () => {
    expect(getPasswordStrength('').score).toBe(0);
  });

  it('returns higher score for stronger password', () => {
    const weak = getPasswordStrength('abc');
    const strong = getPasswordStrength('Admin@123');
    expect(strong.score).toBeGreaterThan(weak.score);
  });

  it('identifies a strong password', () => {
    const result = getPasswordStrength('Admin@123');
    expect(result.score).toBeGreaterThanOrEqual(4);
    expect(result.label).toBeTruthy();
  });
});

// ── Permissions Tests ──────────────────────────────────────────────────────────
describe('hasPermission', () => {
  it('admin can do everything', () => {
    expect(hasPermission('admin', 'products', 'create')).toBe(true);
    expect(hasPermission('admin', 'users', 'delete')).toBe(true);
    expect(hasPermission('admin', 'reports', 'view')).toBe(true);
  });

  it('staff cannot delete products', () => {
    expect(hasPermission('staff', 'products', 'delete')).toBe(false);
  });

  it('staff can create quotations', () => {
    expect(hasPermission('staff', 'quotations', 'create')).toBe(true);
  });

  it('customer cannot access action center', () => {
    expect(hasPermission('customer', 'actionCenter', 'view')).toBe(false);
  });

  it('returns false for unknown role', () => {
    expect(hasPermission('unknown', 'products', 'view')).toBe(false);
  });
});

// ── Mock Data Shape Tests ──────────────────────────────────────────────────────
describe('Mock Data', () => {
  it('mock users have required fields', async () => {
    const { MOCK_USERS } = await import('../data/mockData');
    expect(MOCK_USERS.length).toBeGreaterThan(0);
    MOCK_USERS.forEach(u => {
      expect(u).toHaveProperty('id');
      expect(u).toHaveProperty('email');
      expect(u).toHaveProperty('role');
      expect(['admin', 'staff', 'customer']).toContain(u.role);
    });
  });

  it('mock products have variants', async () => {
    const { MOCK_PRODUCTS } = await import('../data/mockData');
    MOCK_PRODUCTS.forEach(p => {
      expect(Array.isArray(p.variants)).toBe(true);
    });
  });

  it('mock invoices reference valid customer IDs', async () => {
    const { MOCK_INVOICES, MOCK_CUSTOMERS } = await import('../data/mockData');
    const customerIds = MOCK_CUSTOMERS.map(c => c.id);
    MOCK_INVOICES.forEach(inv => {
      expect(customerIds).toContain(inv.customerId);
    });
  });
});
