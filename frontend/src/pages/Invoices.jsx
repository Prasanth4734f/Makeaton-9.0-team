import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText, Send, CheckCircle, Eye, Printer,
  TrendingUp, AlertCircle, Clock, DollarSign,
  X, CheckCheck, CheckCircle2, Building2, User
} from 'lucide-react';

import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCurrency, formatDate, formatStatus } from '../utils/formatters';
import { invoiceService } from '../services/invoiceService';
import { MOCK_CUSTOMERS } from '../data/mockData';
import { clsx } from 'clsx';

const TABS = [
  { key: 'all', label: 'All Invoices' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
];

function getCustomerDetail(customerId) {
  return MOCK_CUSTOMERS.find((c) => c.id === customerId) || null;
}

// ── Invoice Detail Modal ─────────────────────────────────────────────────────

function InvoiceDetailModal({ invoice, onClose, onMarkPaid, onSend }) {
  const [marking, setMarking] = useState(false);
  const [sending, setSending] = useState(false);
  const customer = invoice ? getCustomerDetail(invoice.customerId) : null;

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleMarkPaidClick = async () => {
    setMarking(true);
    await onMarkPaid(invoice.id);
    setMarking(false);
  };

  const handleSendClick = async () => {
    setSending(true);
    await onSend(invoice.id);
    setSending(false);
  };

  return (
    <Modal
      isOpen={!!invoice}
      onClose={onClose}
      title={`Tax Invoice — ${invoice.invoiceNumber}`}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrint}>
            Print / Save PDF
          </Button>
          <div className="flex items-center gap-2">
            {invoice.status === 'draft' && (
              <Button size="sm" icon={Send} loading={sending} onClick={handleSendClick}>
                Dispatch Invoice
              </Button>
            )}
            {invoice.status !== 'paid' && (
              <Button
                variant="success"
                size="sm"
                icon={CheckCheck}
                loading={marking}
                onClick={handleMarkPaidClick}
              >
                Mark as Paid
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-slate-800">
        {/* Header Branding */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-extrabold text-sm">
                R
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">REVORA</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium">Subscription Revenue Intelligence Platform</p>
            <p className="text-[11px] text-slate-400">GSTIN: 27AADCR0123M1Z2 • Mumbai, Maharashtra</p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Official Tax Invoice</span>
            <p className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">{invoice.invoiceNumber}</p>
            <div className="mt-1">
              <StatusBadge status={invoice.status} />
            </div>
          </div>
        </div>

        {/* Bill To & Invoice Meta */}
        <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-xs border border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Billed To
            </span>
            <p className="font-bold text-slate-900 text-sm">{invoice.customerName}</p>
            <p className="text-slate-600 font-medium mt-0.5">{invoice.customerCompany}</p>
            {customer && (
              <>
                <p className="text-slate-500 mt-1">GSTIN: <span className="font-mono">{customer.gstin}</span></p>
                <p className="text-slate-500">{customer.city}, {customer.state}</p>
              </>
            )}
          </div>

          <div className="text-right space-y-1">
            <div>
              <span className="text-slate-400">Invoice Date: </span>
              <strong className="text-slate-800 font-mono">{formatDate(invoice.invoiceDate)}</strong>
            </div>
            <div>
              <span className="text-slate-400">Payment Due: </span>
              <strong className={clsx('font-mono font-bold', invoice.status === 'overdue' ? 'text-rose-600' : 'text-slate-800')}>
                {formatDate(invoice.dueDate)}
              </strong>
            </div>
            {invoice.paidDate && (
              <div>
                <span className="text-slate-400">Settled On: </span>
                <strong className="text-emerald-700 font-mono">{formatDate(invoice.paidDate)}</strong>
              </div>
            )}
            <div>
              <span className="text-slate-400">Billing Window: </span>
              <span className="text-slate-700 font-mono text-[11px] block">{formatDate(invoice.periodStart)} — {formatDate(invoice.periodEnd)}</span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5 text-left">Description</th>
                <th className="px-4 py-2.5 text-center">Period</th>
                <th className="px-4 py-2.5 text-right">Taxable Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  Subscription Recurring Charge — {invoice.customerCompany}
                </td>
                <td className="px-4 py-3 text-center text-slate-500 font-mono">
                  {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                  {formatCurrency(invoice.subtotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2 rounded-xl bg-slate-50 p-3.5 text-xs border border-slate-100">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-slate-900">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (18%):</span>
              <span className="font-mono font-semibold text-slate-900">{formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold text-slate-900">
              <span>Total Payable:</span>
              <span className="font-mono text-indigo-600">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [banner, setBanner] = useState(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await invoiceService.getAll();
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const showBanner = (msg) => {
    setBanner(msg);
    setTimeout(() => setBanner(null), 4000);
  };

  const handleMarkPaid = async (id) => {
    try {
      const res = await invoiceService.markPaid(id);
      setInvoices(prev => prev.map(inv => inv.id === id ? res.data : inv));
      if (selectedInvoice?.id === id) setSelectedInvoice(res.data);
      showBanner(`Invoice ${res.data.invoiceNumber} recorded as PAID.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (id) => {
    try {
      const res = await invoiceService.send(id);
      setInvoices(prev => prev.map(inv => inv.id === id ? res.data : inv));
      if (selectedInvoice?.id === id) setSelectedInvoice(res.data);
      showBanner(`Invoice ${res.data.invoiceNumber} dispatched to customer.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Financial KPI Aggregations
  const totalInvoiced = useMemo(() => invoices.reduce((s, i) => s + (i.total || 0), 0), [invoices]);
  const totalPaid = useMemo(() => invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0), [invoices]);
  const totalOutstanding = useMemo(() => invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + (i.total || 0), 0), [invoices]);
  const overdueInvoices = useMemo(() => invoices.filter(i => i.status === 'overdue'), [invoices]);
  const totalOverdue = useMemo(() => overdueInvoices.reduce((s, i) => s + (i.total || 0), 0), [overdueInvoices]);

  const filteredInvoices = useMemo(() => {
    if (activeTab === 'all') return invoices;
    return invoices.filter(i => i.status === activeTab);
  }, [invoices, activeTab]);

  const columns = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      render: (val, row) => (
        <button
          onClick={() => setSelectedInvoice(row)}
          className="font-mono font-bold text-indigo-600 hover:text-indigo-800 text-xs transition-colors cursor-pointer"
        >
          {val}
        </button>
      ),
    },
    {
      key: 'customerCompany',
      label: 'Customer / Organization',
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900 leading-tight">{val}</div>
          <div className="text-[11px] text-slate-400 font-medium">{row.customerName}</div>
        </div>
      ),
    },
    {
      key: 'periodStart',
      label: 'Billing Cycle',
      render: (_, row) => (
        <span className="text-xs text-slate-500 font-mono">
          {formatDate(row.periodStart)} – {formatDate(row.periodEnd)}
        </span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (val, row) => (
        <span className={clsx(
          'text-xs font-mono font-semibold',
          row.status === 'overdue' ? 'text-rose-600 font-bold' : 'text-slate-600'
        )}>
          {formatDate(val)}
        </span>
      ),
    },
    {
      key: 'total',
      label: 'Amount (INR)',
      render: (val, row) => (
        <div>
          <span className="font-mono font-extrabold text-slate-900 text-sm">{formatCurrency(val)}</span>
          <span className="text-[10px] text-slate-400 block font-mono">GST: {formatCurrency(row.taxAmount)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedInvoice(row)}
            title="Inspect Invoice"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          {row.status === 'draft' && (
            <button
              onClick={() => handleSend(row.id)}
              title="Send to client"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
          {row.status !== 'paid' && (
            <button
              onClick={() => handleMarkPaid(row.id)}
              title="Mark as settled / paid"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer"
            >
              <CheckCircle className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices & Billing Ledger"
        subtitle="Automated tax invoices, GST reconciliation, overdue dunning tracking, and receipt history"
        breadcrumbs={['REVORA', 'Finance', 'Invoices']}
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={fetchInvoices}
            loading={loading}
          >
            Refresh Ledger
          </Button>
        }
      />

      {/* Banner */}
      {banner && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{banner}</span>
          </div>
          <button onClick={() => setBanner(null)} className="hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Invoiced */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs card-elevation">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Invoiced</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">
            {formatCurrency(totalInvoiced)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Lifetime platform billing yield</div>
        </div>

        {/* Settled / Paid */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs card-elevation">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Collected / Paid</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 font-mono">
            {formatCurrency(totalPaid)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Reconciled bank & UPI receipts</div>
        </div>

        {/* Outstanding */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs card-elevation">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Settlement</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Dispatched awaiting payment</div>
        </div>

        {/* Overdue Card (Highlighted) */}
        <div className="rounded-2xl border border-rose-200/90 bg-rose-50/30 p-4 shadow-2xs card-elevation">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Overdue Delinquent</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600 border border-rose-200">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-rose-700 font-mono">
            {formatCurrency(totalOverdue)}
          </div>
          <div className="mt-1 text-[11px] text-rose-600 font-medium">
            {overdueInvoices.length} invoices delinquent
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex rounded-xl bg-slate-100 p-1 gap-1 text-xs font-bold">
          {TABS.map(tab => {
            const count = invoices.filter(i => tab.key === 'all' ? true : i.status === tab.key).length;
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={clsx(
                  'flex items-center gap-2 rounded-lg px-3.5 py-1.5 transition-all cursor-pointer',
                  isSelected
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 font-semibold'
                )}
              >
                <span>{tab.label}</span>
                <span className={clsx(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                  isSelected ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          Showing {filteredInvoices.length} tax invoices
        </span>
      </div>

      {/* Invoices DataTable */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredInvoices}
          pageSize={10}
          onRowClick={(row) => setSelectedInvoice(row)}
          emptyComponent={
            <div className="py-12 text-center text-xs text-slate-400">
              No invoices match the selected criteria.
            </div>
          }
        />
      )}

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onMarkPaid={handleMarkPaid}
        onSend={handleSend}
      />
    </div>
  );
}
