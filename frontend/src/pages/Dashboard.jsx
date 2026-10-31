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

// ── Color Schemes for Avatars ──────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-gradient-to-tr from-blue-500 to-indigo-600 text-white',
  'bg-gradient-to-tr from-purple-500 to-pink-600 text-white',
  'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white',
  'bg-gradient-to-tr from-amber-500 to-orange-600 text-white',
  'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white',
];

// ── Custom Tooltips ────────────────────────────────────────────────────────────

function MrrTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md text-slate-900 min-w-[200px]">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full shadow-xs" style={{ background: entry.color }} />
            <span className="text-slate-600 font-semibold capitalize">{entry.name}:</span>
          </div>
          <span className="font-mono font-extrabold text-slate-900">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-md text-slate-900">
      <p className="text-[11px] font-bold text-slate-500">{name}</p>
      <p className="mt-0.5 text-sm font-extrabold text-indigo-600 font-mono">{formatCurrency(value)}</p>
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
      {/* ── ROW 1: Colorful Vibrant Hero Banner ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 sm:p-7 text-white shadow-xl border border-indigo-500/20">
        {/* Colorful Ambient Glow Circles */}
        <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30 backdrop-blur-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Revenue Intelligence
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-indigo-200/80 font-medium">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-pink-300">{user?.name?.split(' ')[0] || 'Harshitha'}</span> 👋
            </h1>

            <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed max-w-xl">
              REVORA is monitoring your subscription revenue, automated billing schedules, upcoming renewal contracts, and dunning risk alerts in real time.
            </p>
          </div>

          {/* Quick Action Area */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            <Link
              to="/subscriptions"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-purple-500 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>New Subscription</span>
            </Link>

            <Link
              to="/quotations"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all shadow-sm backdrop-blur-md cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-300" />
              <span>Draft Quote</span>
            </Link>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh ledger metrics"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all shadow-sm backdrop-blur-md cursor-pointer"
            >
              <RefreshCw className={clsx('h-3.5 w-3.5', refreshing && 'animate-spin text-indigo-300')} />
            </button>
          </div>
        </div>
      </div>

      {/* ── ROW 2: Four Core Colorful KPI Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Active Subscriptions (Blue/Cyan Theme) */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-blue-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Active Subscriptions
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/25">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-slate-900 font-mono">
              {stats?.activeSubscriptions?.value || 6}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-0.5 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                +{stats?.activeSubscriptions?.change || 20}%
              </span>
              <span className="text-[11px] text-slate-400 font-medium">vs prior month</span>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Customer Retention</span>
            <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">96.8%</span>
          </div>
        </div>

        {/* KPI 2: Monthly Recurring Revenue (Indigo/Purple/Pink Theme) */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-indigo-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Monthly Recurring (MRR)
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-slate-900 font-mono">
              {formatCurrency(stats?.mrr?.value || 418500)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-0.5 font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                +{stats?.mrr?.change || 8.2}%
              </span>
              <span className="text-[11px] text-slate-400 font-medium">expansion</span>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Annual Run-Rate</span>
            <span className="font-extrabold text-purple-700 font-mono bg-purple-50 px-2 py-0.5 rounded-md">
              {formatCurrency((stats?.mrr?.value || 418500) * 12, true)}
            </span>
          </div>
        </div>

        {/* KPI 3: Outstanding Receivables (Amber/Orange Theme) */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-amber-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Outstanding Receivables
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25">
              <Receipt className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-slate-900 font-mono">
              {formatCurrency(totalOutstanding)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-0.5 font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                <Clock className="h-3 w-3" />
                3 Invoices
              </span>
              <span className="text-[11px] text-slate-400 font-medium">awaiting settlement</span>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Collection Ratio</span>
            <span className="font-extrabold text-amber-700 font-mono bg-amber-50 px-2 py-0.5 rounded-md">
              {stats?.collectionRate?.value || 85.4}%
            </span>
          </div>
        </div>

        {/* KPI 4: Overdue / At Risk Revenue (Rose/Red Theme) */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-300 bg-gradient-to-br from-rose-50/70 via-white to-orange-50/30 p-5 shadow-xs transition-all hover:shadow-md hover:border-rose-400">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700">
              Overdue / At Risk
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-md shadow-rose-500/25">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-rose-700 font-mono">
              {formatCurrency(stats?.overdueInvoices?.totalAmount || 159298)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-0.5 font-bold text-rose-900 bg-rose-200/80 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                {stats?.overdueInvoices?.value || 2} Overdue
              </span>
              <span className="text-[11px] text-rose-600 font-semibold">requires action</span>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-rose-200 flex items-center justify-between text-[11px]">
            <span className="text-rose-700 font-semibold">Action Center Alert</span>
            <Link to="/action-center" className="font-extrabold text-rose-700 hover:text-rose-900 flex items-center gap-0.5 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded-md transition-colors">
              Triage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Large Revenue Chart + Recent Invoices Snapshot ─────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Large: Revenue Performance Trend (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Revenue Performance Trajectory
                </h3>
                <span className="rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-700 border border-indigo-200">
                  12-Month Run
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly recurring revenue expansion alongside net new cohort yield
              </p>
            </div>

            {/* Toggle button group */}
            <div className="flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto text-xs font-bold border border-slate-200/80">
              <button
                onClick={() => setChartView('mrr')}
                className={clsx(
                  'px-3 py-1 rounded-lg transition-all cursor-pointer',
                  chartView === 'mrr' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Total MRR
              </button>
              <button
                onClick={() => setChartView('newMrr')}
                className={clsx(
                  'px-3 py-1 rounded-lg transition-all cursor-pointer',
                  chartView === 'newMrr' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
                  <linearGradient id="indigoPurpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="cyanEmeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
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
                    strokeWidth={3}
                    fill="url(#indigoPurpleGradient)"
                  />
                ) : (
                  <Area
                    type="monotone"
                    dataKey="newMrr"
                    name="Net New MRR"
                    stroke="#059669"
                    strokeWidth={3}
                    fill="url(#cyanEmeraldGradient)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alongside: Recent Important Invoices Snapshot (1 Col) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Invoices</h3>
                <p className="text-xs text-slate-500">Automated recurring billing snapshots</p>
              </div>
              <Link to="/invoices" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                View all →
              </Link>
            </div>

            <div className="divide-y divide-slate-100 text-xs mt-3">
              {importantInvoices.map((inv, idx) => (
                <div key={inv.id} className="py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/60 rounded-lg px-1 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={clsx(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs shadow-xs',
                      AVATAR_COLORS[idx % AVATAR_COLORS.length]
                    )}>
                      {inv.customerCompany ? inv.customerCompany.slice(0, 2).toUpperCase() : 'CO'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{inv.customerCompany}</div>
                      <div className="text-[11px] font-mono text-slate-400">{inv.invoiceNumber} • {formatDate(inv.dueDate)}</div>
                    </div>
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
              className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-indigo-200 bg-indigo-50/60 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
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
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Upcoming Renewals</h3>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200">
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
              {upcomingRenewals.map((sub, idx) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={clsx(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-xs',
                      AVATAR_COLORS[idx % AVATAR_COLORS.length]
                    )}>
                      {sub.customerCompany ? sub.customerCompany.slice(0, 2).toUpperCase() : 'SB'}
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
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      Auto-Renew
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Next Renewal Batch: <strong>01 Nov 2024</strong></span>
            <span className="font-extrabold text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded-md">
              ₹50,738 Due
            </span>
          </div>
        </div>

        {/* Revenue Distribution / Plan Analytics */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Revenue by Product Plan</h3>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md uppercase">
                Share Breakdown
              </span>
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
                  <span className="text-sm font-black text-slate-900 font-mono">
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
                        <span className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs" style={{ background: item.color }} />
                        <span className="truncate text-slate-700 font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-bold text-slate-900 font-mono">{formatCurrency(item.value, true)}</span>
                        <span className="text-[11px] font-bold text-slate-500 w-8 text-right bg-slate-100 px-1 rounded">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Primary Revenue Driver:</span>
            <strong className="text-indigo-700 font-bold">REVORA Core (64%)</strong>
          </div>
        </div>
      </div>

      {/* ── ROW 5: REVORA Intelligence Action Center ──────────────────────── */}
      <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-600" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 text-white shadow-md shadow-orange-500/20">
                <Zap className="h-4 w-4 fill-current" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                REVORA Intelligence Action Center
              </h3>
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-extrabold text-rose-800 border border-rose-200">
                {openActions.length} Pending Actions
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Prasanth&apos;s Revenue Intelligence Engine detected critical overdue items and churn indicators
            </p>
          </div>

          <Link
            to="/action-center"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 px-4 py-2 text-xs font-bold text-white hover:from-slate-800 hover:to-indigo-900 transition-all shadow-md self-start sm:self-auto cursor-pointer"
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
                'rounded-xl border p-4 flex flex-col justify-between transition-all hover:shadow-md',
                alert.priority === 'critical'
                  ? 'border-l-4 border-l-rose-500 border-rose-200 bg-gradient-to-br from-rose-50/80 via-white to-white'
                  : alert.priority === 'high'
                  ? 'border-l-4 border-l-orange-500 border-orange-200 bg-gradient-to-br from-orange-50/80 via-white to-white'
                  : 'border-l-4 border-l-amber-500 border-amber-200 bg-gradient-to-br from-amber-50/80 via-white to-white'
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <StatusBadge status={alert.priority} type="priority" />
                  {alert.amount && (
                    <span className="font-mono font-extrabold text-xs text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
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

                <div className="mt-3 rounded-lg bg-white/90 border border-slate-200/80 p-2.5 text-[11px] text-slate-700 shadow-2xs">
                  <strong className="text-indigo-900 block font-bold mb-0.5">Recommended Action:</strong>
                  <span className="line-clamp-2">{alert.recommendedAction}</span>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 truncate">
                  {alert.customerCompany}
                </span>
                <Link
                  to="/action-center"
                  className={clsx(
                    'text-xs font-bold hover:underline flex items-center gap-0.5 px-2 py-0.5 rounded-md',
                    alert.priority === 'critical' ? 'text-rose-700 bg-rose-100 hover:bg-rose-200' : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                  )}
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
