import { MOCK_PAYMENTS } from '../data/mockData';

let payments = [...MOCK_PAYMENTS];
let idCounter = 9;
let payCounter = 9;

function delay(ms = 300) { return new Promise(r => setTimeout(r, ms)); }

export const paymentService = {
  async getAll() {
    await delay();
    return { data: payments };
  },
  async getById(id) {
    await delay();
    const p = payments.find(p => p.id === id);
    if (!p) throw new Error('Payment not found');
    return { data: p };
  },
  async create(payload) {
    await delay(700);
    const num = String(payCounter++).padStart(4, '0');
    const newPay = {
      ...payload,
      id: `pay${idCounter++}`,
      paymentNumber: `PAY-2024-${num}`,
      status: 'success',
      paidAt: new Date().toISOString(),
    };
    payments.push(newPay);
    return { data: newPay };
  },
  async retry(id) {
    await delay(800);
    const idx = payments.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Payment not found');
    const retried = {
      ...payments[idx],
      id: `pay${idCounter++}`,
      paymentNumber: `PAY-2024-${String(payCounter++).padStart(4, '0')}`,
      status: 'success',
      paidAt: new Date().toISOString(),
    };
    payments.push(retried);
    return { data: retried };
  },
};
