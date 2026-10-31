import { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Search, Edit2, Trash2, Users, IndianRupee,
  Layers, CheckCircle2, AlertCircle, Percent, Clock
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
import { planService } from '../services/planService';
import { productService } from '../services/productService';
import { planSchema } from '../utils/validators';
import { formatCurrency, formatBillingCycle } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';

export default function Plans() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [banner, setBanner] = useState(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deletingPlan, setDeletingPlan] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Selected product variants for dynamic variant dropdown
  const [selectedProductId, setSelectedProductId] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      productId: '',
      variantId: '',
      billingCycle: 'monthly',
      price: 4999,
      setupFee: 0,
      trialDays: 0,
      taxRate: 18,
      discountPercent: 0,
      description: '',
      status: 'active'
    }
  });

  const watchedProductId = watch('productId');

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, prodRes] = await Promise.all([
        planService.getAll(),
        productService.getAll()
      ]);
      setPlans(plansRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      setBanner({ type: 'error', message: 'Failed to load plans: ' + err.message });
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
    const firstProd = products[0];
    const firstVariant = firstProd?.variants?.[0];
    reset({
      name: '',
      productId: firstProd?.id || '',
      variantId: firstVariant?.id || '',
      billingCycle: 'monthly',
      price: firstVariant?.price || 4999,
      setupFee: 0,
      trialDays: 0,
      taxRate: 18,
      discountPercent: 0,
      description: '',
      status: 'active'
    });
    setSelectedProductId(firstProd?.id || '');
    setIsCreateOpen(true);
  };

  const openEditModal = (pl) => {
    setEditingPlan(pl);
    setValue('name', pl.name);
    setValue('productId', pl.productId);
    setValue('variantId', pl.variantId);
    setValue('billingCycle', pl.billingCycle);
    setValue('price', pl.price);
    setValue('setupFee', pl.setupFee || 0);
    setValue('trialDays', pl.trialDays || 0);
    setValue('taxRate', pl.taxRate || 18);
    setValue('discountPercent', pl.discountPercent || 0);
    setValue('description', pl.description || '');
    setValue('status', pl.status || 'active');
    setSelectedProductId(pl.productId);
  };

  const handleCreateSubmit = async (data) => {
    try {
      setActionLoading(true);
      const res = await planService.create(data);
      setPlans(prev => [...prev, res.data]);
      setIsCreateOpen(false);
      showBanner('success', `Plan "${data.name}" created successfully.`);
    } catch (err) {
      showBanner('error', 'Error creating plan: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (data) => {
    if (!editingPlan) return;
    try {
      setActionLoading(true);
      const res = await planService.update(editingPlan.id, data);
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? res.data : p));
      setEditingPlan(null);
      showBanner('success', `Plan "${data.name}" updated successfully.`);
    } catch (err) {
      showBanner('error', 'Error updating plan: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPlan) return;
    try {
      setActionLoading(true);
      await planService.delete(deletingPlan.id);
      setPlans(prev => prev.filter(p => p.id !== deletingPlan.id));
      showBanner('success', `Plan "${deletingPlan.name}" removed.`);
      setDeletingPlan(null);
    } catch (err) {
      showBanner('error', 'Error deleting plan: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const currentProduct = products.find(p => p.id === (watchedProductId || selectedProductId));
  const availableVariants = currentProduct?.variants || [];

  const filteredPlans = plans.filter(p => {
    const matchesTab = selectedTab === 'all' || p.status === selectedTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      (p.productName && p.productName.toLowerCase().includes(q));
    return matchesTab && matchesSearch;
  });

  const totalSubscribers = plans.reduce((acc, p) => acc + (p.subscriberCount || 0), 0);
  const activePlansCount = plans.filter(p => p.status === 'active').length;
  const estimatedPlanMRR = plans.reduce((acc, p) => {
    const monthlyRate = p.billingCycle === 'annual' ? p.price / 12 : p.price;
    return acc + monthlyRate * (p.subscriberCount || 0);
  }, 0);

  const columns = [
    {
      key: 'name',
      label: 'Plan Name',
      render: (_, row) => (
        <div>
          <div className="font-bold text-slate-900 leading-tight">{row.name}</div>
          <div className="text-[11px] text-slate-500 max-w-xs truncate mt-0.5">{row.description || 'No description'}</div>
        </div>
      )
    },
    {
      key: 'productName',
      label: 'Product Module',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-slate-800">{row.productName || '—'}</div>
          <div className="text-[11px] text-indigo-600 font-mono font-medium">{row.variantName || '—'}</div>
        </div>
      )
    },
    {
      key: 'billingCycle',
      label: 'Billing Cycle',
      render: (val) => (
        <span className="capitalize text-slate-700 bg-slate-100 font-semibold px-2 py-0.5 rounded-md text-xs">
          {formatBillingCycle(val)}
        </span>
      )
    },
    {
      key: 'price',
      label: 'Price (INR)',
      render: (val, row) => (
        <div>
          <span className="font-mono font-extrabold text-slate-900 text-sm">{formatCurrency(val)}</span>
          <span className="text-[10px] text-slate-400 block">/{row.billingCycle === 'annual' ? 'year' : 'month'}</span>
        </div>
      )
    },
    {
      key: 'setupFee',
      label: 'Setup Fee',
      render: (val) => (
        <span className="font-mono text-slate-600 text-xs">{val ? formatCurrency(val) : '₹0'}</span>
      )
    },
    {
      key: 'taxRate',
      label: 'GST / Tax',
      render: (val) => <span className="font-semibold text-slate-700 text-xs">{val || 18}%</span>
    },
    {
      key: 'subscriberCount',
      label: 'Subscribers',
      render: (val) => (
        <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full text-xs border border-indigo-100">
          <Users className="h-3 w-3" />
          {val || 0}
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
          {isAdmin && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(row);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                title="Edit plan"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingPlan(row);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                title="Delete plan"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans Ledger"
        subtitle="Configure pricing tiers, recurring billing cycles, setup fees, and GST tax classifications"
        breadcrumbs={['REVORA', 'Management', 'Subscription Plans']}
        actions={
          isAdmin && (
            <Button icon={Plus} onClick={openCreateModal}>
              New Plan
            </Button>
          )
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

      {/* KPI stats bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs card-elevation">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catalog Plans</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{plans.length}</span>
            <span className="text-xs text-slate-400 font-medium">active tiers</span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs card-elevation">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Billing Plans</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 font-mono">{activePlansCount}</span>
            <span className="text-xs text-slate-400 font-medium">in catalog</span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs card-elevation">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Subscribers</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-600 font-mono">{totalSubscribers}</span>
            <span className="text-xs text-slate-400 font-medium">organizations</span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs card-elevation">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Monthly Yield</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{formatCurrency(estimatedPlanMRR, true)}</span>
            <span className="text-xs text-emerald-600 font-bold">MRR yield</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-3">
        <div className="flex rounded-xl bg-slate-100 p-1 gap-1 text-xs font-bold">
          {['all', 'active', 'inactive', 'draft'].map(tab => (
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
            placeholder="Search plans by name or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-4 text-xs text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <Loading text="Loading subscription plans..." />
      ) : (
        <DataTable
          columns={columns}
          data={filteredPlans}
          pageSize={10}
          emptyComponent={
            <div className="py-12 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No subscription plans found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {searchQuery || selectedTab !== 'all'
                  ? 'Try clearing the search query or changing your status tab.'
                  : 'Create your first plan to start offering subscriptions to customers.'}
              </p>
            </div>
          }
        />
      )}

      {/* Modal: Create Plan */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Subscription Plan"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(handleCreateSubmit)} loading={actionLoading}>
              Create Plan
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Plan Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Starter Monthly, Enterprise Annual"
                {...register('name')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Product *
              </label>
              <select
                {...register('productId')}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  const prod = products.find(p => p.id === e.target.value);
                  if (prod && prod.variants.length > 0) {
                    setValue('variantId', prod.variants[0].id);
                    setValue('price', prod.variants[0].price);
                  }
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Product Variant / Tier *
              </label>
              <select
                {...register('variantId')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {availableVariants.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({formatCurrency(v.price)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Billing Cycle *
              </label>
              <select
                {...register('billingCycle')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
                <option value="quarterly">Quarterly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Price (INR) *
              </label>
              <input
                type="number"
                {...register('price')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {errors.price && <p className="mt-1 text-xs text-rose-500">{errors.price.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Setup Fee (INR)
              </label>
              <input
                type="number"
                {...register('setupFee')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Free Trial (Days)
              </label>
              <input
                type="number"
                {...register('trialDays')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                GST / Tax Rate (%)
              </label>
              <input
                type="number"
                {...register('taxRate')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Status *
              </label>
              <select
                {...register('status')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Description / Terms
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Perfect for scaling businesses managing up to 5,000 subscriptions."
              {...register('description')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Plan */}
      <Modal
        isOpen={!!editingPlan}
        onClose={() => setEditingPlan(null)}
        title={`Edit Plan — ${editingPlan?.name || ''}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingPlan(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(handleEditSubmit)} loading={actionLoading}>
              Save Plan
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Plan Name *
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Billing Cycle *
              </label>
              <select
                {...register('billingCycle')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
                <option value="quarterly">Quarterly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Price (INR) *
              </label>
              <input
                type="number"
                {...register('price')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Setup Fee (INR)
              </label>
              <input
                type="number"
                {...register('setupFee')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                {...register('taxRate')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Status *
              </label>
              <select
                {...register('status')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Description
              </label>
              <input
                type="text"
                {...register('description')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingPlan}
        onClose={() => setDeletingPlan(null)}
        onConfirm={handleDelete}
        title="Delete Subscription Plan"
        message={`Are you sure you want to delete "${deletingPlan?.name}"? Existing subscribers will retain their terms, but no new subscriptions can be created under this plan.`}
        confirmLabel="Delete Plan"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
