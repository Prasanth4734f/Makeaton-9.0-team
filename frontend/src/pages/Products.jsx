import { useState, useEffect } from 'react';
import {
  Package, Plus, Search, Edit2, Trash2, ChevronDown, ChevronUp,
  Tag, CheckCircle2, Layers, AlertCircle, Sparkles, Check,
  LayoutGrid, Table as TableIcon, Eye, DollarSign, ArrowUpRight,
  Filter, HelpCircle, X
} from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Loading } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { productService } from '../services/productService';
import { productSchema } from '../utils/validators';
import { formatCurrency, formatBillingCycle } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [expandedCards, setExpandedCards] = useState({ p1: true });
  const [banner, setBanner] = useState(null);

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Variant manager state inside create/edit
  const [formVariants, setFormVariants] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      type: 'Subscription',
      category: '',
      sales_price: 0,
      cost_price: 0,
      description: '',
      status: 'active'
    }
  });

  const watchedSalesPrice = watch('sales_price') || 0;
  const watchedCostPrice = watch('cost_price') || 0;
  const computedMargin = watchedSalesPrice > 0
    ? (((watchedSalesPrice - watchedCostPrice) / watchedSalesPrice) * 100).toFixed(1)
    : 0;

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getAll();
      setProducts(res.data || []);
    } catch (err) {
      setBanner({ type: 'error', message: 'Failed to load products: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 4000);
  };

  const openCreateModal = () => {
    reset({
      name: '',
      type: 'Subscription',
      category: '',
      sales_price: 4999,
      cost_price: 1500,
      description: '',
      status: 'active'
    });
    setFormVariants([
      { id: 'new-v1', name: 'Starter Edition', sku: 'RC-STR', additional_price: 0, billingCycle: 'monthly', features: ['Core access', 'Email support'] },
      { id: 'new-v2', name: 'Odoo Connector Edition', sku: 'RC-ODO', additional_price: 560, billingCycle: 'monthly', features: ['Odoo XML-RPC sync', 'GL posting'] },
    ]);
    setIsCreateOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setValue('name', p.name);
    setValue('type', p.type || 'Subscription');
    setValue('category', p.category || '');
    setValue('sales_price', p.sales_price || p.variants?.[0]?.price || 0);
    setValue('cost_price', p.cost_price || Math.round((p.sales_price || p.variants?.[0]?.price || 0) * 0.3));
    setValue('description', p.description || '');
    setValue('status', p.status || 'active');
    setFormVariants(p.variants ? JSON.parse(JSON.stringify(p.variants)) : []);
  };

  const handleAddVariantRow = () => {
    const nextNum = formVariants.length + 1;
    setFormVariants(prev => [
      ...prev,
      {
        id: `v-custom-${Date.now()}`,
        name: `Tier ${nextNum}`,
        sku: `VAR-${nextNum}`,
        additional_price: 0,
        billingCycle: 'monthly',
        features: ['Standard feature set']
      }
    ]);
  };

  const handleRemoveVariantRow = (index) => {
    setFormVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleVariantFieldChange = (index, field, value) => {
    setFormVariants(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleCreateSubmit = async (data) => {
    try {
      setActionLoading(true);
      const payload = {
        ...data,
        variants: formVariants.map(v => ({
          ...v,
          price: Number(data.sales_price) + Number(v.additional_price || 0)
        }))
      };
      const res = await productService.create(payload);
      setProducts(prev => [...prev, res.data]);
      setIsCreateOpen(false);
      showBanner('success', `Product "${data.name}" with ${formVariants.length} variants created successfully.`);
    } catch (err) {
      showBanner('error', 'Error creating product: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (data) => {
    if (!editingProduct) return;
    try {
      setActionLoading(true);
      const payload = {
        ...data,
        variants: formVariants.map(v => ({
          ...v,
          price: Number(data.sales_price) + Number(v.additional_price || 0)
        }))
      };
      const res = await productService.update(editingProduct.id, payload);
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? res.data : p));
      setEditingProduct(null);
      showBanner('success', `Product "${data.name}" updated successfully.`);
    } catch (err) {
      showBanner('error', 'Error updating product: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      setActionLoading(true);
      await productService.delete(deletingProduct.id);
      setProducts(prev => prev.filter(p => p.id !== deletingProduct.id));
      showBanner('success', `Product "${deletingProduct.name}" deleted.`);
      setDeletingProduct(null);
    } catch (err) {
      showBanner('error', 'Error deleting product: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.type && p.type.toLowerCase().includes(q)) ||
      (p.variants && p.variants.some(v => v.name.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q)));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesType = typeFilter === 'all' || (p.type || 'Subscription').toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesType;
  });

  const activeCount = products.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Modular Catalog"
        subtitle={`${activeCount} active subscription products, commercial editions, and revenue intelligence add-ons`}
        breadcrumbs={['REVORA', 'Management', 'Products']}
        actions={
          isAdmin && (
            <Button icon={Plus} onClick={openCreateModal}>
              Add Product
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

      {/* Search, Filter & View Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by product name, variant, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 shadow-2xs placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="draft">Draft Only</option>
            <option value="archived">Archived</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Product Types</option>
            <option value="subscription">Subscription</option>
            <option value="software">Software</option>
            <option value="service">Service</option>
          </select>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              onClick={() => setViewMode('table')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>
          <span className="text-xs text-slate-400 pl-1 font-medium">
            {filteredProducts.length} items
          </span>
        </div>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <Loading text="Loading products catalog..." />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description={
            searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'No products match your current search or filter criteria.'
              : 'Get started by creating your first subscription product or module.'
          }
          action={
            isAdmin && (
              <Button icon={Plus} onClick={openCreateModal}>
                Add Product
              </Button>
            )
          }
        />
      ) : viewMode === 'table' ? (
        /* ── ENTERPRISE TABLE VIEW ── */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th scope="col" className="py-3.5 px-5">Product Name & Category</th>
                  <th scope="col" className="py-3.5 px-4">Type</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Sales Price</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Cost Price</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Margin</th>
                  <th scope="col" className="py-3.5 px-4">Variants / Add-ons</th>
                  <th scope="col" className="py-3.5 px-4">Status</th>
                  <th scope="col" className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const salesPrice = p.sales_price || p.variants?.[0]?.price || 0;
                  const costPrice = p.cost_price || Math.round(salesPrice * 0.3);
                  const marginPct = salesPrice > 0 ? (((salesPrice - costPrice) / salesPrice) * 100).toFixed(0) : 0;
                  const variantCount = p.variants ? p.variants.length : 0;
                  const odooVariant = p.variants?.find(v => v.name.toLowerCase().includes('odoo') || (v.additional_price === 560));

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Category */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{p.name}</span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                              <Tag className="h-3 w-3 text-slate-400" />
                              {p.category || 'General'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Product Type */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {p.type || 'Subscription'}
                        </span>
                      </td>

                      {/* Sales Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(salesPrice)}
                        <span className="text-[10px] text-slate-400 font-normal block">/mo base</span>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {formatCurrency(costPrice)}
                      </td>

                      {/* Margin */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                          <ArrowUpRight className="h-3 w-3" />
                          {marginPct}%
                        </span>
                      </td>

                      {/* Variants & Add-ons */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <Layers className="h-3 w-3 text-indigo-500" />
                            {variantCount} configured
                          </span>
                          {odooVariant && (
                            <span className="text-[10px] text-indigo-600 font-medium">
                              • Odoo variant adds ₹560
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingProduct(p)}
                            title="View details & variants"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => openEditModal(p)}
                                title="Edit product"
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeletingProduct(p)}
                                title="Delete product"
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── GRID / CARD VIEW ── */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map(product => {
            const isExpanded = !!expandedCards[product.id];
            const variantCount = product.variants ? product.variants.length : 0;
            const salesPrice = product.sales_price || product.variants?.[0]?.price || 0;
            const costPrice = product.cost_price || Math.round(salesPrice * 0.3);

            return (
              <div
                key={product.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:shadow-lg hover:border-slate-300 card-hover overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-500" />

                <div>
                  <div className="flex items-start justify-between gap-2 mt-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 leading-snug tracking-tight text-sm">
                          {product.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 mt-0.5">
                          <Tag className="h-3 w-3" />
                          {product.category || 'General'}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={product.status} />
                  </div>

                  <p className="mt-3.5 text-xs leading-relaxed text-slate-500 line-clamp-2">
                    {product.description || 'Enterprise subscription service module.'}
                  </p>

                  <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Sales Price</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(salesPrice)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Cost Price</span>
                      <span className="font-mono text-slate-600">{formatCurrency(costPrice)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Type</span>
                      <span className="font-medium text-slate-700">{product.type || 'Subscription'}</span>
                    </div>
                  </div>

                  {/* Variants Accordion */}
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => toggleExpand(product.id)}
                      className="flex w-full items-center justify-between text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-indigo-500" />
                        {variantCount} Pricing {variantCount === 1 ? 'Tier' : 'Tiers'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-2 rounded-xl bg-slate-50/80 p-2.5 border border-slate-100">
                        {variantCount === 0 ? (
                          <p className="text-[11px] text-slate-400 text-center py-1">
                            No pricing tiers configured.
                          </p>
                        ) : (
                          product.variants.map(v => (
                            <div
                              key={v.id}
                              className="rounded-xl border border-slate-200/70 bg-white p-2.5 text-xs shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">{v.name}</span>
                                <span className="font-mono font-extrabold text-indigo-600">
                                  {formatCurrency(v.price)}
                                  <span className="text-[10px] font-normal text-slate-400">
                                    /{v.billingCycle === 'annual' ? 'yr' : 'mo'}
                                  </span>
                                </span>
                              </div>
                              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                                <code className="font-mono text-slate-500">{v.sku}</code>
                                {v.additional_price > 0 && (
                                  <span className="font-medium text-amber-600">
                                    +₹{v.additional_price} add-on
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                  <button
                    onClick={() => setViewingProduct(product)}
                    className="font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="h-3 w-3" /> View Specs
                  </button>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(product)}
                        title="Edit product"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingProduct(product)}
                        title="Delete product"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: CREATE PRODUCT ── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Subscription Product"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(handleCreateSubmit)} loading={actionLoading}>
              Create Product
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                placeholder="e.g. REVORA Core, Enterprise Analytics"
                {...register('name')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Product Type *
              </label>
              <select
                {...register('type')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Subscription">Subscription</option>
                <option value="Software">Software</option>
                <option value="Service">Service</option>
                <option value="Add-on">Add-on</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Sales Price (₹) *
              </label>
              <input
                type="number"
                step="1"
                placeholder="4999"
                {...register('sales_price')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Cost Price (₹) *
              </label>
              <input
                type="number"
                step="1"
                placeholder="1500"
                {...register('cost_price')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Gross Margin
              </label>
              <div className="flex h-[38px] items-center rounded-xl bg-slate-50 px-3 border border-slate-200 text-xs font-bold text-emerald-600">
                {computedMargin}% Profit
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Category *
              </label>
              <input
                type="text"
                placeholder="e.g. SaaS Platform, Analytics, Automation"
                {...register('category')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {errors.category && <p className="mt-1 text-xs text-rose-500">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Status *
              </label>
              <select
                {...register('status')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="active">Active (Available for billing)</option>
                <option value="draft">Draft (Internal planning)</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Detailed description of features and business scope..."
              {...register('description')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Dynamic Variants Section */}
          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                Product Variants & Add-ons
              </label>
              <button
                type="button"
                onClick={handleAddVariantRow}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add Variant
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {formVariants.map((v, idx) => (
                <div key={v.id || idx} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 border border-slate-200/80 text-xs">
                  <input
                    type="text"
                    placeholder="Variant Name (e.g. Odoo Connector Edition)"
                    value={v.name}
                    onChange={(e) => handleVariantFieldChange(idx, 'name', e.target.value)}
                    className="flex-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="SKU"
                    value={v.sku}
                    onChange={(e) => handleVariantFieldChange(idx, 'sku', e.target.value)}
                    className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono"
                  />
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-slate-400 text-[10px]">+₹</span>
                    <input
                      type="number"
                      placeholder="Add-on ₹ (e.g. 560)"
                      value={v.additional_price}
                      onChange={(e) => handleVariantFieldChange(idx, 'additional_price', Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariantRow(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              * Example: "Odoo variant adds ₹560" to the base subscription price.
            </p>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: EDIT PRODUCT ── */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title={`Edit Product — ${editingProduct?.name || ''}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingProduct(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(handleEditSubmit)} loading={actionLoading}>
              Save Changes
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Product Name *
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
                Product Type *
              </label>
              <select
                {...register('type')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Subscription">Subscription</option>
                <option value="Software">Software</option>
                <option value="Service">Service</option>
                <option value="Add-on">Add-on</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Sales Price (₹)
              </label>
              <input
                type="number"
                {...register('sales_price')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Cost Price (₹)
              </label>
              <input
                type="number"
                {...register('cost_price')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Margin
              </label>
              <div className="flex h-[38px] items-center rounded-xl bg-slate-50 px-3 border border-slate-200 text-xs font-bold text-emerald-600">
                {computedMargin}% Profit
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Category *
              </label>
              <input
                type="text"
                {...register('category')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {errors.category && <p className="mt-1 text-xs text-rose-500">{errors.category.message}</p>}
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
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              {...register('description')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Edit Variants */}
          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                Product Variants & Pricing
              </label>
              <button
                type="button"
                onClick={handleAddVariantRow}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add Variant
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {formVariants.map((v, idx) => (
                <div key={v.id || idx} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 border border-slate-200/80 text-xs">
                  <input
                    type="text"
                    value={v.name}
                    onChange={(e) => handleVariantFieldChange(idx, 'name', e.target.value)}
                    className="flex-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                  />
                  <input
                    type="text"
                    value={v.sku}
                    onChange={(e) => handleVariantFieldChange(idx, 'sku', e.target.value)}
                    className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono"
                  />
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-slate-400 text-[10px]">+₹</span>
                    <input
                      type="number"
                      value={v.additional_price || 0}
                      onChange={(e) => handleVariantFieldChange(idx, 'additional_price', Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariantRow(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: VIEW PRODUCT DETAILS ── */}
      <Modal
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        title={viewingProduct ? `${viewingProduct.name} — Overview & Variants` : ''}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setViewingProduct(null)}>
            Close
          </Button>
        }
      >
        {viewingProduct && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-200/80">
              <div>
                <span className="text-xs font-semibold text-indigo-600 block">{viewingProduct.category}</span>
                <h4 className="text-base font-bold text-slate-900">{viewingProduct.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{viewingProduct.description}</p>
              </div>
              <StatusBadge status={viewingProduct.status} />
            </div>

            {/* Financial metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 p-3 bg-white">
                <span className="text-[11px] font-medium text-slate-400 block">Base Sales Price</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {formatCurrency(viewingProduct.sales_price || viewingProduct.variants?.[0]?.price || 0)}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 bg-white">
                <span className="text-[11px] font-medium text-slate-400 block">Estimated Cost</span>
                <span className="text-base font-mono text-slate-600">
                  {formatCurrency(viewingProduct.cost_price || Math.round((viewingProduct.sales_price || viewingProduct.variants?.[0]?.price || 0) * 0.3))}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 bg-emerald-50/50 border-emerald-200/60">
                <span className="text-[11px] font-medium text-emerald-700 block">Product Type</span>
                <span className="text-sm font-bold text-emerald-800">
                  {viewingProduct.type || 'Subscription'}
                </span>
              </div>
            </div>

            {/* Variants table */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                Configured Variants ({viewingProduct.variants?.length || 0})
              </h5>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Variant</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3">Add-on Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingProduct.variants?.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{v.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{v.sku}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-600">
                          {formatCurrency(v.price)}
                        </td>
                        <td className="py-2.5 px-3">
                          {v.additional_price > 0 ? (
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              +₹{v.additional_price}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Included</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deletingProduct?.name}"? Any attached subscription plans and historical quotations will be affected.`}
        confirmLabel="Delete Product"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
