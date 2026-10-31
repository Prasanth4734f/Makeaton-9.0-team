import { MOCK_PLANS, MOCK_PRODUCTS } from '../data/mockData';

let plans = [...MOCK_PLANS];
let idCounter = 7;

function delay(ms = 300) { return new Promise(r => setTimeout(r, ms)); }

export const planService = {
  async getAll() {
    await delay();
    return { data: plans };
  },
  async getById(id) {
    await delay();
    const p = plans.find(p => p.id === id);
    if (!p) throw new Error('Plan not found');
    return { data: p };
  },
  async create(payload) {
    await delay(500);
    const product = MOCK_PRODUCTS.find(p => p.id === payload.productId);
    const variant = product?.variants.find(v => v.id === payload.variantId);
    const newPlan = {
      ...payload,
      id: `pl${idCounter++}`,
      productName: product?.name || '',
      variantName: variant?.name || '',
      subscriberCount: 0,
      createdAt: new Date().toISOString(),
    };
    plans.push(newPlan);
    return { data: newPlan };
  },
  async update(id, payload) {
    await delay(400);
    const idx = plans.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Plan not found');
    plans[idx] = { ...plans[idx], ...payload };
    return { data: plans[idx] };
  },
  async delete(id) {
    await delay(400);
    plans = plans.filter(p => p.id !== id);
    return { data: { success: true } };
  },
};
