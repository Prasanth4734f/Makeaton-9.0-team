import { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Send, CheckCircle, Trash2, Eye, FileText, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { clsx } from 'clsx';

import { DataTable } from '../components/common/DataTable';
import { PageHeader } from '../components/common/PageHeader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';

import { formatCurrency, formatDate } from '../utils/formatters';
import { quotationSchema } from '../utils/validators';
import { quotationService } from '../services/quotationService';
import { MOCK_CUSTOMERS, MOCK_PLANS } from '../data/mockData';

// ─── Filter tabs ───────────────────────────────────────────────────────────────
const TABS = [
  { key: 'all',      label: 'All' },
  { key: 'draft',    label: 'Draft' },
  { key: 'sent',     label: 'Sent' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'expired',  label: 'Expired' },
];

// ─── Label helper ──────────────────────────────────────────────────────────────
const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400';
const labelClass = 'block text-xs font-medium text-slate-600 mb-1';
const errorClass = 'mt-1 text-xs text-red-500';

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex items-center gap-4 shadow-2xs card-elevation">
      <div className={clsx('rounded-xl p-3 shrink-0', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── Reactive calculated summary used in create form ──────────────────────────
function QuotationSummary({ customerId, planId, discountPercent }) {
  const plan = useMemo(() => MOCK_PLANS.find(p => p.id === planId), [planId]);
  if (!plan) return null;

  const subtotal = plan.price;
  const discountAmt = Math.round(subtotal * (Number(discountPercent) || 0) / 100);
  const taxable = subtotal - discountAmt;
  const taxAmt = Math.round(taxable * (plan.taxRate / 100));
  const total = taxable + taxAmt;

  return (
    <div className="mt-4 rounded-xl bg-indigo-50 border border-indigo-100 p-4 space-y-2 text-sm">
      <p className="font-semibold text-indigo-800 mb-3">Calculated Summary</p>
      <div className="flex justify-between text-slate-700">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      {discountAmt > 0 && (
        <div className="flex justify-between text-red-600">
          <span>Discount ({discountPercent}%)</span>
          <span>− {formatCurrency(discountAmt)}</span>
        </div>
      )}
      <div className="flex justify-between text-slate-700">
        <span>GST ({plan.taxRate}%)</span>
        <span>{formatCurrency(taxAmt)}</span>
      </div>
      <div className="flex justify-between font-bold text-indigo-900 border-t border-indigo-200 pt-2 mt-2">
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

// ─── Create Quotation Modal ────────────────────────────────────────────────────
function CreateQuotationModal({ isOpen, onClose, onCreated }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      customerId: '',
      planId: '',
      discountPercent: 0,
      validUntil: '',
      notes: '',
    },
  });

  const watchedPlanId = watch('planId');
  const watchedCustomerId = watch('customerId');
  const watchedDiscount = watch('discountPercent');

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError('');
      const res = await quotationService.create(data);
      onCreated(res.data);
      reset();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create quotation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setError('');
    onClose();
  };

  // Tomorrow as default min for valid until
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Quotation"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>Cancel</Button>
          <Button type="button" onClick={handleSubmit(onSubmit)} loading={submitting}>
            Create Quotation
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Customer */}
        <div>
          <label className={labelClass}>Customer *</label>
          <select {...register('customerId')} className={inputClass}>
            <option value="">Select a customer…</option>
            {MOCK_CUSTOMERS.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.company}
              </option>
            ))}
          </select>
          {errors.customerId && <p className={errorClass}>{errors.customerId.message}</p>}
        </div>

        {/* Plan */}
        <div>
          <label className={labelClass}>Plan *</label>
          <select {...register('planId')} className={inputClass}>
            <option value="">Select a plan…</option>
            {MOCK_PLANS.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatCurrency(p.price)} / {p.billingCycle}
              </option>
            ))}
          </select>
          {errors.planId && <p className={errorClass}>{errors.planId.message}</p>}
        </div>

        {/* Discount + Valid Until */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Discount % (0–100)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              {...register('discountPercent')}
              className={inputClass}
              placeholder="0"
            />
            {errors.discountPercent && <p className={errorClass}>{errors.discountPercent.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Valid Until *</label>
            <input
              type="date"
              min={minDate}
              {...register('validUntil')}
              className={inputClass}
            />
            {errors.validUntil && <p className={errorClass}>{errors.validUntil.message}</p>}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            rows={3}
            {...register('notes')}
            className={inputClass}
            placeholder="Additional notes for the customer…"
          />
        </div>

        {/* Reactive summary */}
        <QuotationSummary
          customerId={watchedCustomerId}
          planId={watchedPlanId}
          discountPercent={watchedDiscount}
        />
      </div>
    </Modal>
  );
}

// ─── Quotation Detail Modal ────────────────────────────────────────────────────
function QuotationDetailModal({ quotation, isOpen, onClose, onSend, onAccept, onDelete }) {
  const [actionLoading, setActionLoading] = useState('');

  if (!quotation) return null;

  const handleSend = async () => {
    setActionLoading('send');
    await onSend(quotation.id);
    setActionLoading('');
  };

  const handleAccept = async () => {
    setActionLoading('accept');
    await onAccept(quotation.id);
    setActionLoading('');
  };

  const handleDelete = async () => {
    setActionLoading('delete');
    await onDelete(quotation.id);
    setActionLoading('');
    onClose();
  };

  const customer = MOCK_CUSTOMERS.find(c => c.id === quotation.customerId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Quotation ${quotation.quoteNumber}`}
      size="xl"
      footer={
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 flex gap-2">
            {quotation.status === 'draft' && (
              <Button
                variant="primary"
                icon={Send}
                onClick={handleSend}
                loading={actionLoading === 'send'}
              >
                Send to Customer
              </Button>
            )}
            {quotation.status === 'sent' && (
              <Button
                variant="success"
                icon={CheckCircle}
                onClick={handleAccept}
                loading={actionLoading === 'accept'}
              >
                Mark Accepted
              </Button>
            )}
            {(quotation.status === 'draft') && (
              <Button
                variant="danger"
                icon={Trash2}
                onClick={handleDelete}
                loading={actionLoading === 'delete'}
              >
                Delete
              </Button>
            )}
          </div>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Quote Number</p>
            <p className="text-xl font-bold text-slate-900">{quotation.quoteNumber}</p>
          </div>
          <StatusBadge status={quotation.status} />
        </div>

        {/* Customer info card */}
        <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Customer Information</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-400 text-xs">Name</p>
              <p className="font-medium text-slate-800">{quotation.customerName}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Company</p>
              <p className="font-medium text-slate-800">{quotation.customerCompany}</p>
            </div>
            {customer && (
              <>
                <div>
                  <p className="text-slate-400 text-xs">Email</p>
                  <p className="font-medium text-slate-800">{customer.email}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">GSTIN</p>
                  <p className="font-medium text-slate-800 font-mono">{customer.gstin}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Location</p>
                  <p className="font-medium text-slate-800">{customer.city}, {customer.state}</p>
                </div>
              </>
            )}
            <div>
              <p className="text-slate-400 text-xs">Valid Until</p>
              <p className="font-medium text-slate-800">{formatDate(quotation.validUntil)}</p>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Plan</p>
          <p className="text-sm font-medium text-slate-800">{quotation.planName}</p>
        </div>

        {/* Line items table */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Line Items</p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Description</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Qty</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Unit Price</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {(quotation.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800 text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals breakdown */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{formatCurrency(quotation.subtotal)}</span>
          </div>
          {quotation.discountAmount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Discount ({quotation.discountPercent}%)</span>
              <span>− {formatCurrency(quotation.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>GST ({quotation.taxRate}%)</span>
            <span>{formatCurrency(quotation.taxAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 border-t border-slate-300 pt-2 mt-2 text-base">
            <span>Total</span>
            <span>{formatCurrency(quotation.total)}</span>
          </div>
        </div>

        {/* Notes */}
        {quotation.notes && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-slate-600 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
              {quotation.notes}
            </p>
          </div>
        )}

        {/* Accepted at */}
        {quotation.acceptedAt && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-4 py-3 border border-emerald-100">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Accepted on {formatDate(quotation.acceptedAt)}
          </div>
        )}

        {/* Created */}
        <p className="text-xs text-slate-400">Created on {formatDate(quotation.createdAt)}</p>
      </div>
    </Modal>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [toast, setToast] = useState('');

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Action loading per-row
  const [rowLoading, setRowLoading] = useState({});

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await quotationService.getAll();
        setQuotations(res.data);
      } catch {
        setError('Failed to load quotations. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // ── Filtered data ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (activeTab === 'all') return quotations;
    return quotations.filter(q => q.status === activeTab);
  }, [quotations, activeTab]);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const accepted = quotations.filter(q => q.status === 'accepted');
    const pending = quotations.filter(q => q.status === 'sent');
    const pendingValue = pending.reduce((s, q) => s + (q.total || 0), 0);
    const convRate = quotations.length
      ? Math.round((accepted.length / quotations.length) * 100)
      : 0;
    return { total: quotations.length, accepted: accepted.length, pendingValue, convRate };
  }, [quotations]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleSend = async (id) => {
    setRowLoading(prev => ({ ...prev, [id]: 'send' }));
    try {
      const res = await quotationService.send(id);
      setQuotations(prev => prev.map(q => q.id === id ? res.data : q));
      if (selectedQuotation?.id === id) setSelectedQuotation(res.data);
      showToast('Quotation sent to customer.');
    } catch {
      showToast('Failed to send quotation.');
    } finally {
      setRowLoading(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleAccept = async (id) => {
    setRowLoading(prev => ({ ...prev, [id]: 'accept' }));
    try {
      const res = await quotationService.accept(id);
      setQuotations(prev => prev.map(q => q.id === id ? res.data : q));
      if (selectedQuotation?.id === id) setSelectedQuotation(res.data);
      showToast('Quotation marked as accepted.');
    } catch {
      showToast('Failed to accept quotation.');
    } finally {
      setRowLoading(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    try {
      await quotationService.delete(confirmDelete);
      setQuotations(prev => prev.filter(q => q.id !== confirmDelete));
      setConfirmDelete(null);
      if (selectedQuotation?.id === confirmDelete) {
        setShowDetailModal(false);
        setSelectedQuotation(null);
      }
      showToast('Quotation deleted.');
    } catch {
      showToast('Failed to delete quotation.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreated = (newQ) => {
    setQuotations(prev => [newQ, ...prev]);
    showToast(`Quotation ${newQ.quoteNumber} created.`);
  };

  // ── Table columns ────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'quoteNumber',
      label: 'Quote #',
      width: 160,
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-indigo-700">{val}</span>
      ),
    },
    {
      key: 'customerName',
      label: 'Customer',
      render: (val, row) => (
        <div>
          <p className="font-medium text-slate-800">{val}</p>
          <p className="text-xs text-slate-400">{row.customerCompany}</p>
        </div>
      ),
    },
    {
      key: 'planName',
      label: 'Plan',
      render: (val) => <span className="text-sm text-slate-700">{val}</span>,
    },
    {
      key: 'validUntil',
      label: 'Valid Until',
      render: (val) => <span className="text-sm text-slate-600">{formatDate(val)}</span>,
    },
    {
      key: 'subtotal',
      label: 'Subtotal',
      render: (val) => <span className="text-sm text-slate-700">{formatCurrency(val)}</span>,
    },
    {
      key: 'discountAmount',
      label: 'Discount',
      render: (val) => (
        <span className={clsx('text-sm', val > 0 ? 'text-red-600' : 'text-slate-400')}>
          {val > 0 ? `− ${formatCurrency(val)}` : '—'}
        </span>
      ),
    },
    {
      key: 'taxAmount',
      label: 'Tax',
      render: (val) => <span className="text-sm text-slate-700">{formatCurrency(val)}</span>,
    },
    {
      key: 'total',
      label: 'Total (INR)',
      render: (val) => <span className="text-sm font-semibold text-slate-900">{formatCurrency(val)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'id',
      label: 'Actions',
      cellClassName: 'text-right',
      render: (id, row) => (
        <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
          <button
            title="View Details"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            onClick={() => { setSelectedQuotation(row); setShowDetailModal(true); }}
          >
            <Eye className="h-4 w-4" />
          </button>
          {row.status === 'draft' && (
            <button
              title="Send"
              disabled={rowLoading[id] === 'send'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
              onClick={() => handleSend(id)}
            >
              <Send className="h-4 w-4" />
            </button>
          )}
          {row.status === 'sent' && (
            <button
              title="Accept"
              disabled={rowLoading[id] === 'accept'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
              onClick={() => handleAccept(id)}
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          {row.status === 'draft' && (
            <button
              title="Delete"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              onClick={() => setConfirmDelete(id)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Quotations"
        subtitle={`${quotations.length} quotation${quotations.length !== 1 ? 's' : ''} total`}
        actions={
          <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
            New Quotation
          </Button>
        }
      />

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Quotations"
          value={stats.total}
          icon={FileText}
          color="bg-indigo-100 text-indigo-600"
        />
        <StatCard
          label="Accepted"
          value={stats.accepted}
          icon={CheckCircle}
          color="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          label="Pending Value"
          value={formatCurrency(stats.pendingValue)}
          icon={DollarSign}
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          label="Conversion Rate"
          value={`${stats.convRate}%`}
          icon={TrendingUp}
          color="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {tab.label}
            <span className={clsx(
              'ml-1.5 rounded-full px-1.5 py-0.5 text-xs',
              activeTab === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
            )}>
              {tab.key === 'all' ? quotations.length : quotations.filter(q => q.status === tab.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          onRowClick={(row) => { setSelectedQuotation(row); setShowDetailModal(true); }}
          rowKey="id"
          emptyComponent={
            <EmptyState
              icon={FileText}
              title="No quotations found"
              description={
                activeTab === 'all'
                  ? 'Create your first quotation to get started.'
                  : `No ${activeTab} quotations found.`
              }
            />
          }
        />
      </div>

      {/* Create Modal */}
      <CreateQuotationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreated}
      />

      {/* Detail Modal */}
      <QuotationDetailModal
        quotation={selectedQuotation}
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedQuotation(null); }}
        onSend={handleSend}
        onAccept={handleAccept}
        onDelete={(id) => setConfirmDelete(id)}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Quotation"
        message="Are you sure you want to permanently delete this quotation? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
