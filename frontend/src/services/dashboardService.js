import { MOCK_DASHBOARD_STATS, MOCK_MRR_DATA, MOCK_REVENUE_BY_PRODUCT, MOCK_SUBSCRIPTIONS, MOCK_INVOICES, MOCK_PAYMENTS, MOCK_CUSTOMERS } from '../data/mockData';

function delay(ms = 300) { return new Promise(r => setTimeout(r, ms)); }

export const dashboardService = {
  async getStats() {
    await delay();
    return { data: MOCK_DASHBOARD_STATS };
  },
  async getMrrData() {
    await delay();
    return { data: MOCK_MRR_DATA };
  },
  async getRevenueByProduct() {
    await delay();
    return { data: MOCK_REVENUE_BY_PRODUCT };
  },
  async getRecentActivity() {
    await delay();
    const recentInvoices = MOCK_INVOICES.slice(0, 5).map(inv => ({
      id: inv.id,
      type: 'invoice',
      title: `Invoice ${inv.invoiceNumber}`,
      subtitle: inv.customerName,
      amount: inv.total,
      status: inv.status,
      date: inv.invoiceDate,
    }));
    const recentPayments = MOCK_PAYMENTS.filter(p => p.status === 'success').slice(0, 5).map(pay => ({
      id: pay.id,
      type: 'payment',
      title: `Payment ${pay.paymentNumber}`,
      subtitle: pay.customerName,
      amount: pay.amount,
      status: pay.status,
      date: pay.paidAt,
    }));
    const combined = [...recentInvoices, ...recentPayments]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);
    return { data: combined };
  },
};
