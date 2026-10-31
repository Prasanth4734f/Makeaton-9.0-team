import { MOCK_REVENUE_ACTIONS } from '../data/mockData';

let actions = [...MOCK_REVENUE_ACTIONS];

function delay(ms = 300) { return new Promise(r => setTimeout(r, ms)); }

export const intelligenceService = {
  async getActions() {
    await delay();
    return { data: actions };
  },
  async resolveAction(id) {
    await delay(500);
    const idx = actions.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Action not found');
    actions[idx].status = 'resolved';
    return { data: actions[idx] };
  },
  async snoozeAction(id) {
    await delay(400);
    const idx = actions.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Action not found');
    actions[idx].status = 'snoozed';
    return { data: actions[idx] };
  },
  async reopenAction(id) {
    await delay(400);
    const idx = actions.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Action not found');
    actions[idx].status = 'open';
    return { data: actions[idx] };
  },
};
