import { useState, useEffect } from 'react';
import {
  DollarSign, Plus, Search, Eye, RefreshCw, CheckCircle2,
  AlertCircle, ArrowDownRight, CreditCard, Receipt, FileText
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Loading } from '../components/ui/Loading';
import { paymentService } from '../services/paymentService';
import { invoiceService } from '../services/invoiceService';
import { paymentSchema } from '../utils/validators';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { clsx } from 'clsx';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [banner, setBanner] = useState(null);

  // Modals & action states
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [retryingId, setRetryingId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: '',
      amount: 0,
      method: 'UPI',
      referenceNumber: '',
      notes: ''
    }
  });

  const watchedInvoiceId = watch('invoiceId');

  const loadData = async () => {
    try {
      setLoading(true);
      const [payRes, invRes] = await Promise.all([
        paymentService.getAll(),
        invoiceService.getAll()
      ]);
      setPayments(payRes.data || []);
      setInvoices(invRes.data || []);
    } catch (err) {
      setBanner({ type: 'error', message: 'Failed to load payments: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 4000);
  };

  // When invoice selection changes in record payment modal, prefill amount
  useEffect(() => {
    if (watchedInvoiceId) {
      const inv = invoices.find(i => i.id === watchedInvoiceId);
      if (inv) {
        setValue('amount', inv.total);
      }
    }
  }, [watchedInvoiceId, invoices, setValue]);

  const openRecordModal = () => {
    const unpaidInvs = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
    const firstInv = unpaidInvs[0] || invoices[0];
    reset({
      invoiceId: firstInv?.id || '',
      amount: firstInv?.total || 0,
      method: 'UPI',
      referenceNumber: `REF-${Date.now().toString().slice(-6)}`,
      notes: 'Customer direct settlement'
    });
    setIsRecordOpen(true);
  };

  const handleRecordSubmit = async (data) => {
    try {
      setActionLoading(true);
      const inv = invoices.find(i => i.id === data.invoiceId);
      const payload = {
        ...data,
        customerId: inv?.customerId || 'c1',
        customerName: inv?.customerName || 'Customer',
        customerCompany: inv?.customerCompany || 'Company',
      };
      const res = await paymentService.create(payload);
      setPayments(prev => [res.data, ...prev]);
      // Also mark invoice as paid in our local state if found
      if (inv) {
        await invoiceService.markPaid(inv.id);
        setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'paid' } : i));
      }
      setIsRecordOpen(false);
      showBanner('success', `Payment ${res.data.paymentNumber} recorded successfully.`);
    } catch (err) {
      showBanner('error', 'Error recording payment: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryPayment = async (pay) => {
    try {
      setRetryingId(pay.id);
      const res = await paymentService.retry(pay.id);
      setPayments(prev => [res.data, ...prev]);
      showBanner('success', `Payment retry successful! New payment ${res.data.paymentNumber} processed.`);
    } catch (err) {
      showBanner('error', 'Payment retry failed: ' + err.message);
    } finally {
      setRetryingId(null);
    }
  };

  // KPIs
  const totalCollected = payments
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const successCount = payments.filter(p => p.status === 'success').length;
  const failedPayments = payments.filter(p => p.status === 'failed');
  const failedAmount = failedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Filter
  const filteredPayments = payments.filter(p => {
    const matchesTab = selectedTab === 'all' || p.status === selectedTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.paymentNumber.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      p.customerCompany.toLowerCase().includes(q) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q));
    return matchesTab && matchesSearch;
  });

  const columns = [
    {
      key: 'paymentNumber',
      label: 'Payment #',
      render: (val, row) => (
        <button
          onClick={() => setSelectedPayment(row)}
          className="font-mono font-semibold text-indigo-600 hover:text-indigo-800 transition-colors text-xs"
        >
          {val}
        </button>
      )
    },
    {
      key: 'customerName',
      label: 'Customer',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.customerName}</div>
          <div className="text-xs text-slate-400">{row.customerCompany}</div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount (INR)',
      render: (val) => <span className="font-bold text-slate-900">{formatCurrency(val)}</span>
    },
    {
      key: 'method',
      label: 'Method',
      render: (val) => (
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {val}
        </span>
      )
    },
    {
      key: 'referenceNumber',
      label: 'Reference #',
      render: (val) => (
        <span className="font-mono text-xs text-slate-500">{val || '—'}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'paidAt',
      label: 'Date & Time',
      render: (val) => <span className="text-xs text-slate-500">{val ? formatDateTime(val) : '—'}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedPayment(row)}
            title="View receipt"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          {row.status === 'failed' && (
            <button
              onClick={() => handleRetryPayment(row)}
              disabled={retryingId === row.id}
              title="Retry payment"
              className="rounded-lg p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              <RefreshCw className={clsx('h-3.5 w-3.5', retryingId === row.id && 'animate-spin text-indigo-600')} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Gateway Settlements"
        subtitle="Track incoming client settlements, auto-pay reconciliation, and failed payment dunning retries"
        breadcrumbs={['REVORA', 'Finance', 'Payments']}
        actions={
          <Button icon={Plus} onClick={openRecordModal}>
            Record Payment
          </Button>
        }
      />

      {/* Banner */}
      {banner && (
        <div
          className={clsx(
            'flex items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold shadow-sm transition-all',
            banner.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          )}
        >
          <div className="flex items-center gap-2">
            {banner.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            <span>{banner.message}</span>
          </div>
          <button onClick={() => setBanner(null)} className="hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs card-elevation">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collected</div>
          <div className="mt-1 text-2xl font-extrabold text-emerald-600 font-mono">{formatCurrency(totalCollected)}</div>
          <div className="text-[11px] text-slate-400 font-medium">Net successful receipts</div>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs card-elevation">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Successful Transactions</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 font-mono">{successCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium">100% verified settlement</div>
        </div>
        <div className="rounded-2xl border border-rose-200/90 bg-rose-50/25 p-4 shadow-2xs card-elevation">
          <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">Failed Transactions</div>
          <div className="mt-1 text-2xl font-extrabold text-rose-700 font-mono">{failedPayments.length}</div>
          <div className="text-[11px] text-rose-600 font-medium">Auto-retry required</div>
        </div>
        <div className="rounded-2xl border border-rose-200/90 bg-rose-50/25 p-4 shadow-2xs card-elevation">
          <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">Failed Value at Risk</div>
          <div className="mt-1 text-2xl font-extrabold text-rose-700 font-mono">{formatCurrency(failedAmount)}</div>
          <div className="text-[11px] text-rose-600 font-medium">Pending recovery</div>
        </div>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-3">
        <div className="flex rounded-xl bg-slate-100 p-1 gap-1 text-xs font-bold">
          {['all', 'success', 'failed'].map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={clsx(
                'rounded-lg px-3.5 py-1.5 transition-all cursor-pointer capitalize',
                selectedTab === tab
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-semibold'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-4 text-xs text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loading text="Loading payment transactions..." />
      ) : (
        <DataTable
          columns={columns}
          data={filteredPayments}
          pageSize={10}
          onRowClick={(row) => setSelectedPayment(row)}
          emptyComponent={
            <div className="py-12 text-center">
              <DollarSign className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-700">No payment records found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {searchQuery || selectedTab !== 'all'
                  ? 'Try clearing the search query or changing your status tab.'
                  : 'Record payments as customers settle outstanding subscription invoices.'}
              </p>
            </div>
          }
        />
      )}

      {/* Modal: Record Payment */}
      <Modal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        title="Record Customer Payment"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsRecordOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(handleRecordSubmit)} loading={actionLoading}>
              Confirm Payment
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Select Invoice *
            </label>
            <select
              {...register('invoiceId')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {invoices.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.customerCompany} ({formatCurrency(inv.total)}) [{inv.status.toUpperCase()}]
                </option>
              ))}
            </select>
            {errors.invoiceId && <p className="mt-1 text-xs text-red-500">{errors.invoiceId.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Amount Received (INR) *
              </label>
              <input
                type="number"
                {...register('amount')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Payment Method *
              </label>
              <select
                {...register('method')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="NEFT">NEFT Direct</option>
                <option value="Cheque">Corporate Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Transaction / Reference Number
            </label>
            <input
              type="text"
              placeholder="e.g. UPI2024100801234, NEFT-HDFC-991"
              {...register('referenceNumber')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Internal Notes
            </label>
            <textarea
              rows={2}
              placeholder="Bank branch or remarks..."
              {...register('notes')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </form>
      </Modal>

      {/* Modal: View Receipt */}
      <Modal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title="Transaction Receipt"
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setSelectedPayment(null)}>
            Close
          </Button>
        }
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="text-center rounded-2xl bg-slate-50 p-6 border border-slate-200/60">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
                <Receipt className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(selectedPayment.amount)}</div>
              <div className="mt-1">
                <StatusBadge status={selectedPayment.status} />
              </div>
              <div className="text-xs text-slate-400 mt-2">
                Receipt #{selectedPayment.paymentNumber}
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Customer</span>
                <span className="font-semibold text-slate-800">{selectedPayment.customerName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Company</span>
                <span className="font-semibold text-slate-800">{selectedPayment.customerCompany}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-semibold text-slate-800">{selectedPayment.method}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Reference / UTR</span>
                <span className="font-mono text-slate-700">{selectedPayment.referenceNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Processed At</span>
                <span className="text-slate-800">{selectedPayment.paidAt ? formatDateTime(selectedPayment.paidAt) : 'Pending'}</span>
              </div>
              {selectedPayment.notes && (
                <div className="py-1.5">
                  <span className="text-slate-500 block mb-1">Notes:</span>
                  <p className="rounded-lg bg-slate-50 p-2 text-slate-700">{selectedPayment.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
