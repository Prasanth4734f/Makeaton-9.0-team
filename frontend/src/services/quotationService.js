import { MOCK_QUOTATIONS } from '../data/mockData';
import { MOCK_CUSTOMERS, MOCK_PLANS } from '../data/mockData';

let quotations = [...MOCK_QUOTATIONS];
let idCounter = 5;
let quoteCounter = 5;

function delay(ms = 300) { return new Promise(r => setTimeout(r, ms)); }

export const quotationService = {
  async getAll() {
    await delay();
    return { data: quotations };
  },
  async getById(id) {
    await delay();
    const q = quotations.find(q => q.id === id);
    if (!q) throw new Error('Quotation not found');
    return { data: q };
  },
  async create(payload) {
    await delay(500);
    const customer = MOCK_CUSTOMERS.find(c => c.id === payload.customerId);
    const plan = MOCK_PLANS.find(p => p.id === payload.planId);
    const subtotal = plan?.price || 0;
    const discountAmount = Math.round(subtotal * (payload.discountPercent / 100));
    const taxableAmount = subtotal - discountAmount;
    const taxRate = plan?.taxRate || 18;
    const taxAmount = Math.round(taxableAmount * (taxRate / 100));
    const total = taxableAmount + taxAmount;
    const qNum = String(quoteCounter++).padStart(4, '0');
    const newQ = {
      ...payload,
      id: `q${idCounter++}`,
      quoteNumber: `QUO-2024-${qNum}`,
      customerName: customer?.name || '',
      customerCompany: customer?.company || '',
      planName: plan?.name || '',
      items: [{ description: plan?.name || '', quantity: 1, unitPrice: subtotal, amount: subtotal }],
      subtotal,
      discountAmount,
      taxRate,
      taxAmount,
      total,
      status: 'draft',
      createdAt: new Date().toISOString(),
      acceptedAt: null,
    };
    quotations.push(newQ);
    return { data: newQ };
  },
  async update(id, payload) {
    await delay(400);
    const idx = quotations.findIndex(q => q.id === id);
    if (idx === -1) throw new Error('Quotation not found');
    quotations[idx] = { ...quotations[idx], ...payload };
    return { data: quotations[idx] };
  },
  async send(id) {
    await delay(600);
    const idx = quotations.findIndex(q => q.id === id);
    if (idx === -1) throw new Error('Quotation not found');
    quotations[idx].status = 'sent';
    return { data: quotations[idx] };
  },
  async accept(id) {
    await delay(400);
    const idx = quotations.findIndex(q => q.id === id);
    if (idx === -1) throw new Error('Quotation not found');
    quotations[idx].status = 'accepted';
    quotations[idx].acceptedAt = new Date().toISOString();
    return { data: quotations[idx] };
  },
  async delete(id) {
    await delay(400);
    quotations = quotations.filter(q => q.id !== id);
    return { data: { success: true } };
  },
};
