import { MOCK_SUBSCRIPTIONS, MOCK_CUSTOMERS, MOCK_PLANS } from '../data/mockData';

let subscriptions = [...MOCK_SUBSCRIPTIONS];
let idCounter = 9;
let subCounter = 9;

function delay(ms = 300) { return new Promise(r => setTimeout(r, ms)); }

export const subscriptionService = {
  async getAll() {
    await delay();
    return { data: subscriptions };
  },
  async getById(id) {
    await delay();
    const s = subscriptions.find(s => s.id === id);
    if (!s) throw new Error('Subscription not found');
    return { data: s };
  },
  async create(payload) {
    await delay(500);
    const customer = MOCK_CUSTOMERS.find(c => c.id === payload.customerId);
    const plan = MOCK_PLANS.find(p => p.id === payload.planId);
    const price = plan?.price || 0;
    const taxRate = plan?.taxRate || 18;
    const sNum = String(subCounter++).padStart(4, '0');
    const newSub = {
      ...payload,
      id: `s${idCounter++}`,
      subscriptionNumber: `SUB-2024-${sNum}`,
      customerName: customer?.name || '',
      customerCompany: customer?.company || '',
      planName: plan?.name || '',
      status: 'active',
      price,
      taxRate,
      totalMonthlyValue: Math.round(price * (1 + taxRate / 100)),
      currentPeriodStart: payload.startDate,
      currentPeriodEnd: null,
      renewalDate: null,
      invoiceCount: 0,
      createdAt: new Date().toISOString(),
    };
    subscriptions.push(newSub);
    return { data: newSub };
  },
  async update(id, payload) {
    await delay(400);
    const idx = subscriptions.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Subscription not found');
    subscriptions[idx] = { ...subscriptions[idx], ...payload };
    return { data: subscriptions[idx] };
  },
  async cancel(id, reason) {
    await delay(500);
    const idx = subscriptions.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Subscription not found');
    subscriptions[idx].status = 'cancelled';
    subscriptions[idx].cancelledAt = new Date().toISOString();
    subscriptions[idx].cancellationReason = reason;
    subscriptions[idx].autoRenew = false;
    return { data: subscriptions[idx] };
  },
  async pause(id) {
    await delay(400);
    const idx = subscriptions.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Subscription not found');
    subscriptions[idx].status = 'paused';
    return { data: subscriptions[idx] };
  },
  async resume(id) {
    await delay(400);
    const idx = subscriptions.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Subscription not found');
    subscriptions[idx].status = 'active';
    return { data: subscriptions[idx] };
  },
};
