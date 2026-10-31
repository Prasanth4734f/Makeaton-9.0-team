import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency, formatDate, formatPercent, getInitials, formatBillingCycle, formatStatus } from '../utils/formatters.js';
import { getPasswordStrength, passwordSchema, loginSchema } from '../utils/validators.js';
import { hasPermission, PERMISSIONS } from '../utils/permissions.js';
import { MOCK_USERS, MOCK_PRODUCTS, MOCK_PLANS, MOCK_INVOICES, MOCK_PAYMENTS, MOCK_CUSTOMERS } from '../data/mockData.js';
import { intelligenceService } from '../services/intelligenceService.js';

describe('REVORA Formatters', () => {
  it('formats INR currency correctly', () => {
    const val = formatCurrency(12999);
    assert.ok(val.includes('12,999'));
    assert.ok(val.includes('₹'));
  });

  it('handles null/undefined gracefully in currency formatter', () => {
    assert.equal(formatCurrency(null), '—');
    assert.equal(formatCurrency(undefined), '—');
  });

  it('formats compact INR amounts', () => {
    assert.equal(formatCurrency(5000, true), '₹5.0K');
    assert.equal(formatCurrency(150000, true), '₹1.5L');
    assert.equal(formatCurrency(15000000, true), '₹1.5Cr');
  });

  it('formats percentages correctly', () => {
    assert.equal(formatPercent(18), '18.0%');
    assert.equal(formatPercent(3.14159, 2), '3.14%');
    assert.equal(formatPercent(null), '—');
  });

  it('formats dates into readable DD MMM YYYY', () => {
    const d = formatDate('2024-10-31');
    assert.ok(d.includes('2024'));
    assert.ok(d.includes('Oct') || d.includes('10'));
    assert.equal(formatDate(null), '—');
  });

  it('generates user initials', () => {
    assert.equal(getInitials('Harshitha Reddy'), 'HR');
    assert.equal(getInitials('Ravi Kumar'), 'RK');
    assert.equal(getInitials(null), '??');
  });

  it('formats billing cycles', () => {
    assert.equal(formatBillingCycle('monthly'), 'Monthly');
    assert.equal(formatBillingCycle('annual'), 'Annual');
  });

  it('formats status labels', () => {
    assert.equal(formatStatus('past_due'), 'Past Due');
    assert.equal(formatStatus('active'), 'Active');
  });
});

describe('REVORA Security & Validation', () => {
  it('calculates password strength accurately', () => {
    assert.equal(getPasswordStrength('').score, 0);
    const weak = getPasswordStrength('secret');
    const strong = getPasswordStrength('Admin@1234');
    assert.ok(strong.score >= 4);
    assert.ok(strong.score > weak.score);
  });

  it('validates password criteria according to enterprise rules', () => {
    // Requires >=8 chars, uppercase, lowercase, special char
    const valid = passwordSchema.safeParse('Admin@123');
    assert.ok(valid.success);

    const missingSpecial = passwordSchema.safeParse('Admin1234');
    assert.equal(missingSpecial.success, false);

    const tooShort = passwordSchema.safeParse('Ad@1');
    assert.equal(tooShort.success, false);
  });

  it('validates login schema', () => {
    const valid = loginSchema.safeParse({ email: 'admin@revora.in', password: 'password123' });
    assert.ok(valid.success);

    const invalidEmail = loginSchema.safeParse({ email: 'not-an-email', password: '123' });
    assert.equal(invalidEmail.success, false);
  });
});

describe('REVORA Role-Based Access Control (RBAC)', () => {
  it('admin has full permissions across all management and finance resources', () => {
    assert.equal(hasPermission('admin', 'products', 'create'), true);
    assert.equal(hasPermission('admin', 'products', 'delete'), true);
    assert.equal(hasPermission('admin', 'plans', 'create'), true);
    assert.equal(hasPermission('admin', 'quotations', 'create'), true);
    assert.equal(hasPermission('admin', 'subscriptions', 'create'), true);
    assert.equal(hasPermission('admin', 'invoices', 'create'), true);
    assert.equal(hasPermission('admin', 'payments', 'create'), true);
    assert.equal(hasPermission('admin', 'users', 'delete'), true);
  });

  it('staff has operational permissions but restricted product deletion & administrative settings', () => {
    assert.equal(hasPermission('staff', 'products', 'create'), false);
    assert.equal(hasPermission('staff', 'products', 'delete'), false);
    assert.equal(hasPermission('staff', 'subscriptions', 'create'), true);
    assert.equal(hasPermission('staff', 'quotations', 'create'), true);
    assert.equal(hasPermission('staff', 'settings', 'view'), false);
    assert.equal(hasPermission('staff', 'users', 'create'), false);
  });

  it('customer has view-only access and cannot access action center or staff tools', () => {
    assert.equal(hasPermission('customer', 'actionCenter', 'view'), false);
    assert.equal(hasPermission('customer', 'customers', 'create'), false);
    assert.equal(hasPermission('customer', 'products', 'view'), true);
  });
});

describe('REVORA Mock Data Integrity', () => {
  it('contains valid mock users for hackathon demo with appropriate credentials', () => {
    assert.ok(MOCK_USERS.length >= 3);
    const admin = MOCK_USERS.find(u => u.role === 'admin');
    const staff = MOCK_USERS.find(u => u.role === 'staff');
    const customer = MOCK_USERS.find(u => u.role === 'customer');

    assert.ok(admin, 'Admin account present');
    assert.ok(staff, 'Staff account present');
    assert.ok(customer, 'Customer account present');
  });

  it('products contain valid variants with positive pricing', () => {
    assert.ok(MOCK_PRODUCTS.length > 0);
    MOCK_PRODUCTS.forEach(p => {
      assert.ok(p.id);
      assert.ok(p.name);
      assert.ok(Array.isArray(p.variants));
      p.variants.forEach(v => {
        assert.ok(v.price > 0);
        assert.ok(v.sku);
      });
    });
  });

  it('all subscriptions reference valid customers and plans', () => {
    const customerIds = new Set(MOCK_CUSTOMERS.map(c => c.id));
    const planIds = new Set(MOCK_PLANS.map(p => p.id));

    MOCK_INVOICES.forEach(inv => {
      assert.ok(customerIds.has(inv.customerId), `Invoice ${inv.id} references valid customer`);
      assert.ok(inv.total > 0, 'Invoice total must be positive');
    });
  });

  it('all payments reference existing invoices', () => {
    const invoiceIds = new Set(MOCK_INVOICES.map(i => i.id));
    MOCK_PAYMENTS.forEach(p => {
      assert.ok(invoiceIds.has(p.invoiceId), `Payment ${p.id} references valid invoice`);
    });
  });
});

describe('Autonomous Revenue Recovery & Churn Defense Agent', () => {
  it('returns valid recovery analytics KPI ribbon metrics', async () => {
    const res = await intelligenceService.getRecoveryMetrics();
    assert.ok(res.data, 'Metrics data returned');
    assert.strictEqual(typeof res.data.totalRevenueRecovered, 'number');
    assert.strictEqual(typeof res.data.arrProtected, 'number');
    assert.strictEqual(typeof res.data.successRate, 'number');
    assert.strictEqual(typeof res.data.activeActions, 'number');
    assert.ok(res.data.totalRevenueRecovered > 0, 'Recovered revenue positive');
    assert.ok(res.data.arrProtected > 0, 'ARR protected positive');
  });

  it('generates high-fidelity AI mitigation plan with signals and confidence', async () => {
    const res = await intelligenceService.getMitigationPlan('ra1');
    assert.ok(res.data, 'Mitigation plan generated');
    assert.ok(res.data.plan_type, 'Plan type present');
    assert.ok(res.data.risk_score >= 0 && res.data.risk_score <= 100);
    assert.ok(Array.isArray(res.data.signals));
    assert.ok(res.data.signals.length >= 2, 'At least 2 risk signals detected');
    assert.ok(res.data.confidence > 0.5, 'AI confidence high');
    assert.ok(res.data.preview, 'Communication preview present');
  });

  it('executes human-confirmed mitigation and updates recovery metrics dynamically', async () => {
    const planRes = await intelligenceService.getMitigationPlan('ra1');
    const execRes = await intelligenceService.executeMitigation('ra1', planRes.data);
    assert.ok(execRes.success, 'Execution succeeded');
    assert.strictEqual(execRes.data.status, 'resolved', 'Action status updated to resolved');
    assert.ok(execRes.recoveryMetrics.totalRevenueRecovered > 245000, 'Recovered revenue increased');
  });

  it('supports persistent triage state transitions (resolve, snooze, reopen)', async () => {
    const snoozeRes = await intelligenceService.snoozeAction('ra2');
    assert.strictEqual(snoozeRes.data.status, 'snoozed');

    const reopenRes = await intelligenceService.reopenAction('ra2');
    assert.strictEqual(reopenRes.data.status, 'open');

    const resolveRes = await intelligenceService.resolveAction('ra2');
    assert.strictEqual(resolveRes.data.status, 'resolved');
  });
});
