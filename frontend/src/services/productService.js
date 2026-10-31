import { MOCK_PRODUCTS } from '../data/mockData';

let products = [...MOCK_PRODUCTS];
let idCounter = 6;

function delay(ms = 300) { return new Promise(r => setTimeout(r, ms)); }

export const productService = {
  async getAll() {
    await delay();
    return { data: products };
  },
  async getById(id) {
    await delay();
    const p = products.find(p => p.id === id);
    if (!p) throw new Error('Product not found');
    return { data: p };
  },
  async create(payload) {
    await delay(500);
    const newProduct = {
      ...payload,
      id: `p${idCounter++}`,
      variants: [],
      createdAt: new Date().toISOString(),
    };
    products.push(newProduct);
    return { data: newProduct };
  },
  async update(id, payload) {
    await delay(400);
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Product not found');
    products[idx] = { ...products[idx], ...payload };
    return { data: products[idx] };
  },
  async delete(id) {
    await delay(400);
    products = products.filter(p => p.id !== id);
    return { data: { success: true } };
  },
};
