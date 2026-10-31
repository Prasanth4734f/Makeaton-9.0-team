import { useState, useEffect } from 'react';
import {
  CreditCard, Plus, Search, Eye, Pause, Play, XCircle,
  Calendar, CheckCircle2, AlertCircle, RefreshCw, User, ShieldAlert
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Loading } from '../components/ui/Loading';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { subscriptionService } from '../services/subscriptionService';
import { planService } from '../services/planService';
import { subscriptionSchema } from '../utils/validators';
import { formatCurrency, formatDate, formatStatus } from '../utils/formatters';
import { MOCK_CUSTOMERS } from '../data/mockData';
import { clsx } from 'clsx';

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [banner, setBanner] = useState(null);

  // Modals & Action States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null); // Detail modal
  const [cancellingSub, setCancellingSub] = useState(null);
  const [cancelReason, setCancelReason] = useState('Budget constraints');
  const [actionLoading, setActionLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      customerId: MOCK_CUSTOMERS[0]?.id || '',
      planId: '',
      startDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'UPI',
      autoRenew: true
    }
  });

  const watchedPlanId = watch('planId');

  const loadData = async () => {
    try {
      setLoading(true);
      const [subsRes, plansRes] = await Promise.all([
        subscriptionService.getAll(),
        planService.getAll()
      ]);
      setSubscriptions(subsRes.data || []);
      setPlans(plansRes.data || []);
    } catch (err) {
      setBanner({ type: 'error', message: 'Failed to load subscriptions: ' + err.message });
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

  const openCreateModal = () => {
    reset({
      customerId: MOCK_CUSTOMERS[0]?.id || '',
      planId: plans[0]?.id || '',
      startDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'UPI',
      autoRenew: true
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (data) => {
    try {
      setActionLoading(true);
      const res = await subscriptionService.create(data);
      setSubscriptions(prev => [res.data, ...prev]);
      setIsCreateOpen(false);
      showBanner('success', `Subscription ${res.data.subscriptionNumber} activated.`);
    } catch (err) {
      showBanner('error', 'Error creating subscription: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePause = async (sub) => {
    try {
      setActionLoading(true);
      if (sub.status === 'paused') {
        const res = await subscriptionService.resume(sub.id);
        setSubscriptions(prev => prev.map(s => s.id === sub.id ? res.data : s));
        showBanner('success', `Subscription ${sub.subscriptionNumber} resumed.`);
      } else {
        const res = await subscriptionService.pause(sub.id);
        setSubscriptions(prev => prev.map(s => s.id === sub.id ? res.data : s));
        showBanner('success', `Subscription ${sub.subscriptionNumber} paused.`);
      }
    } catch (err) {
      showBanner('error', 'Error toggling subscription: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingSub) return;
    try {
      setActionLoading(true);
      const res = await subscriptionService.cancel(cancellingSub.id, cancelReason);
      setSubscriptions(prev => prev.map(s => s.id === cancellingSub.id ? res.data : s));
      showBanner('success', `Subscription ${cancellingSub.subscriptionNumber} cancelled.`);
      setCancellingSub(null);
      if (selectedSub?.id === cancellingSub.id) {
        setSelectedSub(res.data);
      }
    } catch (err) {
      showBanner('error', 'Error cancelling subscription: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter subscriptions
  const filteredSubs = subscriptions.filter(s => {
    const matchesTab = selectedTab === 'all' || s.status === selectedTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.subscriptionNumber.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      s.customerCompany.toLowerCase().includes(q) ||
      s.planName.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  // Calculate live preview in modal
  const selectedPlanObj = plans.find(p => p.id === watchedPlanId) || plans[0];
  const calculatedTax = selectedPlanObj ? Math.round(selectedPlanObj.price * ((selectedPlanObj.taxRate || 18) / 100)) : 0;
  const calculatedTotal = selectedPlanObj ? selectedPlanObj.price + calculatedTax : 0;

  // Stats
  const activeCount = subscriptions.filter(s => s.status === 'active').length;
  const pastDueCount = subscriptions.filter(s => s.status === 'past_due').length;
  const overdueCount = subscriptions.filter(s => s.status === 'overdue').length;
  const cancelledCount = subscriptions.filter(s => s.status === 'cancelled').length;

  const columns = [
    {
      key: 'subscriptionNumber',
      label: 'Subscription #',
      render: (val, row) => (
        <button
          onClick={() => setSelectedSub(row)}
          className="font-mono font-semibold text-indigo-600 hover:text-indigo-800 transition-colors text-xs"
        >
          {val}
        </button>
      )
    },
    {
      key: 'customerName',
      label: 'Subscriber',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.customerName}</div>
          <div className="text-xs text-slate-400">{row.customerCompany}</div>
        </div>
      )
    },
    {
      key: 'planName',
      label: 'Plan',
      render: (val) => <span className="font-medium text-slate-800">{val}</span>
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (val) => <span className="text-slate-600 text-xs">{formatDate(val)}</span>
    },
    {
      key: 'renewalDate',
      label: 'Next Renewal',
      render: (val) => (
        <span className="text-xs font-medium text-slate-700">
          {val ? formatDate(val) : '—'}
        </span>
      )
    },
    {
      key: 'totalMonthlyValue',
      label: 'Value (INR)',
      render: (val) => <span className="font-bold text-slate-900">{formatCurrency(val)}</span>
    },
    {
      key: 'paymentMethod',
      label: 'Method',
      render: (val) => (
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 font-medium">
          {val || 'UPI'}
        </span>
      )
    },
    {
      key: 'autoRenew',
      label: 'Auto-Renew',
      render: (val) => (
        <span
          className={clsx(
            'rounded-full px-2 py-0.5 text-[11px] font-semibold',
            val ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          )}
        >
          {val ? 'Enabled' : 'Off'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedSub(row)}
            title="View details"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          {row.status === 'active' && (
            <button
              onClick={() => handleTogglePause(row)}
              title="Pause subscription"
              className="rounded-lg p-1 text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
            >
              <Pause className="h-3.5 w-3.5" />
            </button>
          )}
          {row.status === 'paused' && (
            <button
              onClick={() => handleTogglePause(row)}
              title="Resume subscription"
              className="rounded-lg p-1 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
            >
              <Play className="h-3.5 w-3.5" />
            </button>
          )}
          {row.status !== 'cancelled' && (
            <button
              onClick={() => setCancellingSub(row)}
              title="Cancel subscription"
              className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions Lifecycle"
        subtitle={`${activeCount} active recurring subscriptions generating predictable cashflow across client accounts`}
        breadcrumbs={['REVORA', 'Management', 'Subscriptions']}
        actions={
          <Button icon={Plus} onClick={openCreateModal}>
            New Subscription
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

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs card-elevation">
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active Recurring</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 font-mono">{activeCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium">Recurring normally</div>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs card-elevation">
          <div className="text-xs font-bold text-orange-700 uppercase tracking-wider">Past Due Invoices</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 font-mono">{pastDueCount}</div>
          <div className="text-[11px] text-orange-600 font-medium">Within grace period</div>
        </div>
        <div className="rounded-2xl border border-rose-200/90 bg-rose-50/20 p-4 shadow-2xs card-elevation">
          <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">Overdue Risk</div>
          <div className="mt-1 text-2xl font-extrabold text-rose-700 font-mono">{overdueCount}</div>
          <div className="text-[11px] text-rose-600 font-medium">Attention required</div>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs card-elevation">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cancelled Historic</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-700 font-mono">{cancelledCount}</div>
          <div className="text-[11px] text-slate-400 font-medium">Churned subscriptions</div>
        </div>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-3">
        <div className="flex flex-wrap rounded-xl bg-slate-100 p-1 gap-1 text-xs font-bold">
          {['all', 'active', 'past_due', 'overdue', 'cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={clsx(
                'rounded-lg px-3 py-1.5 transition-all cursor-pointer capitalize',
                selectedTab === tab
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-semibold'
              )}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-4 text-xs text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loading text="Loading active subscriptions..." />
      ) : (
        <DataTable
          columns={columns}
          data={filteredSubs}
          pageSize={10}
          onRowClick={(row) => setSelectedSub(row)}
          emptyComponent={
            <div className="py-12 text-center">
              <CreditCard className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-700">No subscriptions found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {searchQuery || selectedTab !== 'all'
                  ? 'Try clearing the search query or changing your status tab.'
                  : 'Create a new subscription to start tracking recurring customer billing.'}
              </p>
            </div>
          }
        />
      )}

      {/* Modal: Create Subscription */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Subscription"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(handleCreateSubmit)} loading={actionLoading}>
              Activate Subscription
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Customer / Subscriber *
            </label>
            <select
              {...register('customerId')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {MOCK_CUSTOMERS.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.company} ({c.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Subscription Plan *
            </label>
            <select
              {...register('planId')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCurrency(p.price)}/{p.billingCycle}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Payment Method *
              </label>
              <select
                {...register('paymentMethod')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="UPI">UPI AutoPay</option>
                <option value="Credit Card">Credit / Debit Card</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="NEFT">NEFT Direct Debit</option>
                <option value="Cheque">Corporate Cheque</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="autoRenew"
              {...register('autoRenew')}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="autoRenew" className="text-xs font-medium text-slate-700">
              Enable automatic renewals and recurring billing invoices
            </label>
          </div>

          {/* Pricing Preview */}
          {selectedPlanObj && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Base Plan Price:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(selectedPlanObj.price)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST ({selectedPlanObj.taxRate || 18}%):</span>
                <span>{formatCurrency(calculatedTax)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 text-sm font-bold text-slate-900">
                <span>Recurring Invoice Value:</span>
                <span className="text-indigo-600">{formatCurrency(calculatedTotal)}</span>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Modal: View Subscription Details */}
      <Modal
        isOpen={!!selectedSub}
        onClose={() => setSelectedSub(null)}
        title={`Subscription Details — ${selectedSub?.subscriptionNumber || ''}`}
        size="lg"
        footer={
          <div className="flex w-full items-center justify-between">
            <div>
              {selectedSub && selectedSub.status !== 'cancelled' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    const subToCancel = selectedSub;
                    setSelectedSub(null);
                    setCancellingSub(subToCancel);
                  }}
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
            <Button variant="secondary" onClick={() => setSelectedSub(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedSub && (
          <div className="space-y-6">
            {/* Header banner */}
            <div className="flex items-start justify-between rounded-xl bg-slate-50 p-4 border border-slate-200/60">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subscription</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{selectedSub.subscriptionNumber}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Created on {formatDate(selectedSub.createdAt)}
                </div>
              </div>
              <StatusBadge status={selectedSub.status} className="text-xs px-3 py-1" />
            </div>

            {/* Two column grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  <User className="h-4 w-4 text-slate-500" /> Subscriber
                </div>
                <div className="font-semibold text-slate-900">{selectedSub.customerName}</div>
                <div className="text-xs text-slate-600">{selectedSub.customerCompany}</div>
                <div className="text-xs text-slate-400 mt-2">Customer ID: {selectedSub.customerId}</div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  <CreditCard className="h-4 w-4 text-slate-500" /> Plan & Billing
                </div>
                <div className="font-semibold text-slate-900">{selectedSub.planName}</div>
                <div className="text-xs text-slate-600 mt-1">
                  Monthly Value: <strong className="text-indigo-600">{formatCurrency(selectedSub.totalMonthlyValue)}</strong>
                </div>
                <div className="text-xs text-slate-400 mt-2">Method: {selectedSub.paymentMethod}</div>
              </div>
            </div>

            {/* Lifecycle / Period table */}
            <div className="rounded-xl border border-slate-200 p-4 text-xs space-y-2">
              <div className="font-bold text-slate-700 uppercase tracking-wider">Subscription Lifecycle</div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block">Start Date:</span>
                  <span className="font-semibold text-slate-800">{formatDate(selectedSub.startDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Period Window:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(selectedSub.currentPeriodStart)} — {formatDate(selectedSub.currentPeriodEnd) || 'Active'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Next Renewal:</span>
                  <span className="font-semibold text-indigo-600">
                    {selectedSub.renewalDate ? formatDate(selectedSub.renewalDate) : 'Not Scheduled'}
                  </span>
                </div>
              </div>
              {selectedSub.status === 'cancelled' && (
                <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800 border border-rose-200">
                  <strong>Cancellation Reason:</strong> {selectedSub.cancellationReason || 'User requested cancellation'} (on {formatDate(selectedSub.cancelledAt)})
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Reason Modal */}
      <Modal
        isOpen={!!cancellingSub}
        onClose={() => setCancellingSub(null)}
        title="Cancel Subscription"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancellingSub(null)} disabled={actionLoading}>
              Keep Active
            </Button>
            <Button variant="danger" onClick={handleConfirmCancel} loading={actionLoading}>
              Confirm Cancellation
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-red-50 p-3 text-xs text-red-800 border border-red-200">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Confirm terminating subscription {cancellingSub?.subscriptionNumber}?</p>
              <p className="mt-0.5 text-red-700">
                This will halt automated recurring billing for {cancellingSub?.customerCompany}.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Reason for Cancellation *
            </label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Budget constraints">Budget constraints</option>
              <option value="Missing key features">Missing key features</option>
              <option value="Switching to alternative provider">Switching to alternative provider</option>
              <option value="Business closing or restructuring">Business closing or restructuring</option>
              <option value="Non-payment / Involuntary churn">Non-payment / Involuntary churn</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
