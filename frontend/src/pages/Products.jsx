import { useState, useEffect } from 'react';
import {
  Package, Plus, Search, Edit2, Trash2, ChevronDown, ChevronUp,
  Tag, CheckCircle2, Layers, AlertCircle, Sparkles, Check, CheckCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
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
  const [expandedCards, setExpandedCards] = useState({ p1: true });
  const [banner, setBanner] = useState(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      status: 'active'
    }
  });

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
    reset({ name: '', description: '', category: '', status: 'active' });
    setIsCreateOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setValue('name', p.name);
    setValue('description', p.description || '');
    setValue('category', p.category || '');
    setValue('status', p.status || 'active');
  };

  const handleCreateSubmit = async (data) => {
    try {
      setActionLoading(true);
      const res = await productService.create(data);
      setProducts(prev => [...prev, res.data]);
      setIsCreateOpen(false);
      showBanner('success', `Product "${data.name}" created successfully.`);
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
      const res = await productService.update(editingProduct.id, data);
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
    return (
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  const activeCount = products.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Products & Modular Catalog"
        subtitle={`${activeCount} commercial subscription platforms, core editions, and revenue intelligence add-ons`}
        breadcrumbs={['REVORA', 'Management', 'Products']}
        actions={
          isAdmin && (
            <Button icon={Plus} onClick={openCreateModal}>
              New Product
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

      {/* Search and stats bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter catalog products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 shadow-2xs placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>Showing <strong className="text-slate-800">{filteredProducts.length}</strong> of {products.length} products</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Loading text="Loading products catalog..." />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description={
            searchQuery
              ? `No products match "${searchQuery}". Try a different search term.`
              : 'Get started by creating your first subscription product or module.'
          }
          action={
            isAdmin && (
              <Button icon={Plus} onClick={openCreateModal}>
                Create Product
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map(product => {
            const isExpanded = !!expandedCards[product.id];
            const variantCount = product.variants ? product.variants.length : 0;

            return (
              <div
                key={product.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:shadow-lg hover:border-slate-300 card-hover overflow-hidden"
              >
                {/* Top Subtle Gradient Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-500" />

                <div>
                  {/* Top card bar */}
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

                  {/* Description */}
                  <p className="mt-3.5 text-xs leading-relaxed text-slate-500 line-clamp-2">
                    {product.description || 'Enterprise subscription service module.'}
                  </p>

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

                    {/* Variant details list */}
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
                                <StatusBadge status={v.status} className="scale-90 origin-right" />
                              </div>
                              {v.features && v.features.length > 0 && (
                                <ul className="mt-2 space-y-1 text-[11px] text-slate-600 border-t border-slate-100 pt-1.5">
                                  {v.features.map((feat, fi) => (
                                    <li key={fi} className="flex items-center gap-1.5 truncate">
                                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                      <span className="truncate">{feat}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer actions */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                  <span>SKU Root: <code className="font-mono text-slate-600">{product.id}</code></span>
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

      {/* Modal: Create Product */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Subscription Product"
        size="md"
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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Detailed description of features and business scope..."
              {...register('description')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Product */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title={`Edit Product — ${editingProduct?.name || ''}`}
        size="md"
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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              {...register('description')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </form>
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
