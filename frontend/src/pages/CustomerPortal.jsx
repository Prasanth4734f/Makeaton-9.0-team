import { useState } from 'react';
import {
  CreditCard, Receipt, DollarSign, Download, CheckCircle2,
  Calendar, ShieldCheck, ArrowUpRight, Clock, Sparkles, Building2,
  ExternalLink, ChevronRight, Check
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDate } from '../utils/formatters';
import { MOCK_SUBSCRIPTIONS, MOCK_INVOICES, MOCK_PAYMENTS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';

export default function CustomerPortal() {
  const { user } = useAuth();
  const [downloadBanner, setDownloadBanner] = useState(null);

  // Filter records belonging to Priya Sharma / TechWave Solutions (c1)
  const customerId = 'c1';
  const customerSubs = MOCK_SUBSCRIPTIONS.filter(s => s.customerId === customerId);
  const customerInvoices = MOCK_INVOICES.filter(i => i.customerId === customerId);
  const customerPayments = MOCK_PAYMENTS.filter(p => p.customerId === customerId);

  const activeSub = customerSubs.find(s => s.status === 'active') || customerSubs[0];

  const totalPaid = customerPayments
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleDownloadInvoice = (invNum) => {
    setDownloadBanner(`Tax Invoice ${invNum} downloaded as PDF (simulated).`);
    setTimeout(() => setDownloadBanner(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Customer Welcoming Hero Card ──────────────────────────────────── */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/50 p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600/10 px-3 py-1 text-xs font-bold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Customer Self-Service Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back, {user?.name?.split(' ')[0] || 'Priya'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Organization: <strong className="text-slate-900">TechWave Solutions</strong> (GSTIN: 27AADCP0456A1Z9)
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs text-left sm:text-right shrink-0">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Billed & Settled
            </span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {formatCurrency(totalPaid)}
            </span>
            <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">
              ✓ Account in Good Standing
            </span>
          </div>
        </div>
      </div>

      {/* Download toast */}
      {downloadBanner && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-sm animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{downloadBanner}</span>
        </div>
      )}

      {/* ── Active Subscription Showcase ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Your Active Subscription Plans
          </h2>
          <span className="text-xs font-medium text-slate-400">
            {customerSubs.length} Active Plan
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {customerSubs.map(sub => (
            <div
              key={sub.id}
              className="rounded-2xl border border-indigo-200/80 bg-white p-6 shadow-2xs card-elevation relative overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-blue-500" />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{sub.planName}</h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">{sub.subscriptionNumber}</p>
                  </div>
                </div>
                <StatusBadge status={sub.status} />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Recurring Monthly Fee:</span>
                  <span className="font-mono font-extrabold text-slate-900 text-sm">{formatCurrency(sub.totalMonthlyValue)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Next Billing Renewal:</span>
                  <span className="font-semibold text-indigo-600 font-mono text-sm">{formatDate(sub.renewalDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Payment Protocol:</span>
                  <span className="font-bold text-slate-700">{sub.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Automatic Renewals:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="h-3 w-3 stroke-[3]" /> Enabled
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Invoices & Settlement History Split ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Available Tax Invoices */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Receipt className="h-4 w-4 text-indigo-600" />
                Available GST Tax Invoices
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Official compliance invoices for accounting</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {customerInvoices.length} Issued
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {customerInvoices.map(inv => (
              <div key={inv.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    Billing Period: {formatDate(inv.periodStart)} — {formatDate(inv.periodEnd)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900">{formatCurrency(inv.total)}</div>
                    <StatusBadge status={inv.status} className="scale-90 origin-right" />
                  </div>
                  <button
                    onClick={() => handleDownloadInvoice(inv.invoiceNumber)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-2xs cursor-pointer"
                    title="Download GST PDF"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Receipts & Settlements
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Verified payment gateway transactions</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {customerPayments.length} Receipts
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {customerPayments.map(p => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-slate-900">{p.paymentNumber}</div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    Method: {p.method} • Ref: <span className="font-mono text-slate-600">{p.referenceNumber || 'N/A'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-600">{formatCurrency(p.amount)}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{formatDate(p.paidAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
