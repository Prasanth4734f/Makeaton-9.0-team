import { MOCK_INVOICES } from '../data/mockData';

let invoices = [...MOCK_INVOICES];
let idCounter = 11;
let invCounter = 11;

function delay(ms = 300) { return new Promise(r => setTimeout(r, ms)); }

export const invoiceService = {
  async getAll() {
    await delay();
    return { data: invoices };
  },
  async getById(id) {
    await delay();
    const inv = invoices.find(i => i.id === id);
    if (!inv) throw new Error('Invoice not found');
    return { data: inv };
  },
  async create(payload) {
    await delay(500);
    const num = String(invCounter++).padStart(4, '0');
    const newInv = {
      ...payload,
      id: `inv${idCounter++}`,
      invoiceNumber: `INV-2024-${num}`,
      status: 'draft',
      paidDate: null,
      invoiceDate: new Date().toISOString().split('T')[0],
    };
    invoices.push(newInv);
    return { data: newInv };
  },
  async update(id, payload) {
    await delay(400);
    const idx = invoices.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Invoice not found');
    invoices[idx] = { ...invoices[idx], ...payload };
    return { data: invoices[idx] };
  },
  async send(id) {
    await delay(500);
    const idx = invoices.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Invoice not found');
    invoices[idx].status = 'sent';
    return { data: invoices[idx] };
  },
  async markPaid(id) {
    await delay(400);
    const idx = invoices.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Invoice not found');
    invoices[idx].status = 'paid';
    invoices[idx].paidDate = new Date().toISOString().split('T')[0];
    return { data: invoices[idx] };
  },
  async delete(id) {
    await delay(400);
    invoices = invoices.filter(i => i.id !== id);
    return { data: { success: true } };
  },
};
