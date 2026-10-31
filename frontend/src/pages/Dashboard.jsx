import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard, Users,
  AlertCircle, ArrowUpRight, ArrowDownRight, RefreshCw,
  Zap, ArrowRight, ShieldCheck, Sparkles, Receipt, CheckCircle2,
  Calendar, Layers, Clock, FileText, ChevronRight, AlertTriangle, Plus
} from 'lucide-react';

import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/formatters';
import { dashboardService } from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';
import { MOCK_REVENUE_ACTIONS, MOCK_SUBSCRIPTIONS, MOCK_INVOICES } from '../data/mockData';
import { clsx } from 'clsx';

// ── Custom Tooltips ────────────────────────────────────────────────────────────

function MrrTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-lg backdrop-blur-md text-slate-900 min-w-[190px]">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-600 font-medium capitalize">{entry.name}:</span>
          </div>
          <span className="font-mono font-bold text-slate-900">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-md text-slate-900">
      <p className="text-[11px] font-semibold text-slate-500">{name}</p>
      <p className="mt-0.5 text-sm font-bold text-slate-900 font-mono">{formatCurrency(value)}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [mrrData, setMrrData] = useState([]);
  const [productRevenue, setProductRevenue] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartView, setChartView] = useState('mrr'); // 'mrr' | 'newMrr'

  const loadAll = async () => {
    try {
      const [s, m, pr, ra] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getMrrData(),
        dashboardService.getRevenueByProduct(),
        dashboardService.getRecentActivity(),
      ]);
      setStats(s.data);
      setMrrData(m.data);
      setProductRevenue(pr.data);
      setRecentActivity(ra.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  if (loading) return <Loading text="Loading revenue intelligence metrics..." />;

  // Filter Upcoming Renewals from active subscriptions with a renewal date
  const upcomingRenewals = MOCK_SUBSCRIPTIONS
    .filter(s => s.status === 'active' && s.renewalDate)
    .slice(0, 4);

  // Top Open Action Center Alerts
  const openActions = MOCK_REVENUE_ACTIONS.filter(a => a.status === 'open');

  // Important Invoices (unpaid or highest value)
  const importantInvoices = MOCK_INVOICES.slice(0, 5);

  const totalProductYield = productRevenue.reduce((acc, p) => acc + p.value, 0);

  // Total Outstanding Amount (sent + overdue invoices)
  const totalOutstanding = MOCK_INVOICES
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((acc, i) => acc + i.total, 0);

  return (
    <div className="space-y-6">
      {/* ── ROW 1: Hero / Welcome Section ─────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Revenue Intelligence Engine Active
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back, {user?.name?.split(' ')[0] || 'Harshitha'} 👋
            </h1>

            <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
              Your revenue intelligence system is actively monitoring subscriptions, automated billing cycles, upcoming renewals, and potential revenue churn risks.
            </p>
          </div>

          {/* Quick Action Area */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
            <Link
              to="/subscriptions"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>New Subscription</span>
            </Link>

            <Link
              to="/quotations"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span>Draft Quote</span>
            </Link>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh ledger metrics"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
            >
              <RefreshCw className={clsx('h-3.5 w-3.5', refreshing && 'animate-spin text-indigo-600')} />
            </button>
          </div>
        </div>
      </div>

      {/* ── ROW 2: Four Core KPI Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Active Subscriptions */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs card-elevation">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Active Subscriptions
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
              {stats?.activeSubscriptions?.value || 6}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3" />
                +{stats?.activeSubscriptions?.change || 20}%
              </span>
              <span className="text-[11px] text-slate-400 font-medium">vs prior month</span>
            </div>
          </div>

          {/* Mini Progress / Sub indicator */}
          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Customer Retention</span>
            <span className="font-bold text-slate-700">96.8%</span>
          </div>
        </div>

        {/* KPI 2: Monthly Recurring Revenue (MRR) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs card-elevation">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Monthly Recurring (MRR)
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
              {formatCurrency(stats?.mrr?.value || 418500)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3" />
                +{stats?.mrr?.change || 8.2}%
              </span>
              <span className="text-[11px] text-slate-400 font-medium">expansion</span>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Annual Run-Rate (ARR)</span>
            <span className="font-bold text-indigo-600 font-mono">
              {formatCurrency((stats?.mrr?.value || 418500) * 12, true)}
            </span>
          </div>
        </div>

        {/* KPI 3: Outstanding Amount */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs card-elevation">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Outstanding Receivables
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100/80">
              <Receipt className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
              {formatCurrency(totalOutstanding)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-0.5 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                <Clock className="h-3 w-3" />
                3 Unsettled
              </span>
              <span className="text-[11px] text-slate-400 font-medium">pending settlement</span>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Collection Ratio</span>
            <span className="font-bold text-slate-700 font-mono">{stats?.collectionRate?.value || 85.4}%</span>
          </div>
        </div>

        {/* KPI 4: Overdue / At Risk Revenue */}
        <div className="rounded-2xl border border-rose-200/90 bg-rose-50/25 p-5 shadow-2xs card-elevation">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              Overdue / At Risk
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 border border-rose-200/80">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-extrabold tracking-tight text-rose-700 font-mono">
              {formatCurrency(stats?.overdueInvoices?.totalAmount || 159298)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-0.5 font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                {stats?.overdueInvoices?.value || 2} Overdue
              </span>
              <span className="text-[11px] text-rose-600 font-medium">requires action</span>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-rose-200/60 flex items-center justify-between text-[11px]">
            <span className="text-rose-700">Action Center Alert</span>
            <Link to="/action-center" className="font-bold text-rose-700 hover:underline flex items-center gap-0.5">
              Triage <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Large Revenue Chart + Recent Invoices Snapshot ─────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Large: Revenue Performance Trend (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Revenue Performance Trajectory
                </h3>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                  12-Month Run
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly recurring revenue expansion alongside net new cohort yield
              </p>
            </div>

            {/* Toggle button group */}
            <div className="flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto text-xs font-bold">
              <button
                onClick={() => setChartView('mrr')}
                className={clsx(
                  'px-3 py-1 rounded-lg transition-all cursor-pointer',
                  chartView === 'mrr' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                Total MRR
              </button>
              <button
                onClick={() => setChartView('newMrr')}
                className={clsx(
                  'px-3 py-1 rounded-lg transition-all cursor-pointer',
                  chartView === 'newMrr' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                Net New MRR
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCurrency(v, true)}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  width={60}
                />
                <Tooltip content={<MrrTooltip />} />
                {chartView === 'mrr' ? (
                  <Area
                    type="monotone"
                    dataKey="mrr"
                    name="MRR"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fill="url(#indigoGradient)"
                  />
                ) : (
                  <Area
                    type="monotone"
                    dataKey="newMrr"
                    name="Net New MRR"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#emeraldGradient)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alongside: Recent Important Invoices Snapshot (1 Col) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Invoices</h3>
                <p className="text-xs text-slate-500">Automated recurring billing snapshots</p>
              </div>
              <Link to="/invoices" className="text-xs font-bold text-indigo-600 hover:underline">
                View all →
              </Link>
            </div>

            <div className="divide-y divide-slate-100 text-xs mt-3">
              {importantInvoices.map((inv) => (
                <div key={inv.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{inv.customerCompany}</div>
                    <div className="text-[11px] font-mono text-slate-400">{inv.invoiceNumber} • {formatDate(inv.dueDate)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-slate-900">{formatCurrency(inv.total)}</div>
                    <div className="mt-0.5">
                      <StatusBadge status={inv.status} className="scale-90 origin-right" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              to="/invoices"
              className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <span>Inspect Full Billing Ledger</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── ROW 4: Upcoming Renewals + Revenue Distribution ───────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Renewals */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Upcoming Renewals</h3>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                    Renewal Queue
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Subscriptions approaching billing renewal dates</p>
              </div>
              <Link to="/subscriptions" className="text-xs font-bold text-indigo-600 hover:underline">
                Manage →
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingRenewals.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs truncate">{sub.customerCompany}</div>
                      <div className="text-[11px] text-slate-500 truncate font-medium">
                        {sub.planName} • Renewal {formatDate(sub.renewalDate)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      {formatCurrency(sub.totalMonthlyValue)}
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      Auto-Renew
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Next Renewal Batch: <strong>01 Nov 2024</strong></span>
            <span className="font-bold text-indigo-600 font-mono">₹50,738 Due</span>
          </div>
        </div>

        {/* Revenue Distribution / Plan Analytics */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Revenue by Product Plan</h3>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Share Breakdown</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Total product allocation across recurring customer contracts</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-44 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<PieTooltip />} />
                    <Pie
                      data={productRevenue}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {productRevenue.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Catalog Yield</span>
                  <span className="text-sm font-extrabold text-slate-900 font-mono">
                    {formatCurrency(totalProductYield, true)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {productRevenue.map((item) => {
                  const pct = Math.round((item.value / totalProductYield) * 100);
                  return (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
                        <span className="truncate text-slate-600 font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-bold text-slate-900 font-mono">{formatCurrency(item.value, true)}</span>
                        <span className="text-[11px] text-slate-400 font-semibold w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Primary Revenue Driver:</span>
            <strong className="text-slate-800">REVORA Core (64%)</strong>
          </div>
        </div>
      </div>

      {/* ── ROW 5: REVORA Intelligence Action Center ──────────────────────── */}
      <div className="rounded-2xl border border-indigo-200/80 bg-white p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Zap className="h-3.5 w-3.5 fill-current" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                REVORA Intelligence Action Center
              </h3>
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                {openActions.length} Pending Actions
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Prasanth&apos;s Revenue Intelligence Engine detected critical overdue items and churn indicators
            </p>
          </div>

          <Link
            to="/action-center"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <span>Open Action Center</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {openActions.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className={clsx(
                'rounded-xl border p-4 flex flex-col justify-between transition-all hover:shadow-sm',
                alert.priority === 'critical'
                  ? 'border-rose-200 bg-rose-50/20'
                  : alert.priority === 'high'
                  ? 'border-orange-200 bg-orange-50/20'
                  : 'border-slate-200 bg-slate-50/40'
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <StatusBadge status={alert.priority} type="priority" />
                  {alert.amount && (
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {formatCurrency(alert.amount)}
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-1">
                  {alert.title}
                </h4>

                <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {alert.description}
                </p>

                <div className="mt-3 rounded-lg bg-white/80 border border-slate-200/60 p-2 text-[11px] text-slate-700">
                  <strong className="text-indigo-900 block font-semibold mb-0.5">Recommended Action:</strong>
                  <span className="line-clamp-2">{alert.recommendedAction}</span>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600 truncate">
                  {alert.customerCompany}
                </span>
                <Link
                  to="/action-center"
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                >
                  Take Action <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
