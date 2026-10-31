import React, { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import {
  AlertCircle, Clock, TrendingDown, ArrowUpRight, CheckCircle,
  Bell, BellOff, RefreshCw, Zap, AlertTriangle, DollarSign,
  Users, BarChart3, Lightbulb, Sparkles, Building2, ChevronRight,
  ShieldAlert, CheckCircle2, RotateCcw, ArrowRight, ShieldCheck,
  TrendingUp, Award, Layers
} from 'lucide-react';

import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Loading } from '../components/ui/Loading';
import { MitigationModal } from '../components/intelligence/MitigationModal';
import { intelligenceService } from '../services/intelligenceService';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/formatters';

const FILTER_TABS = [
  { key: 'all',      label: 'All Alerts' },
  { key: 'open',     label: 'Open Queue' },
  { key: 'snoozed',  label: 'Snoozed' },
  { key: 'resolved', label: 'Resolved' },
];

const PRIORITY_BADGE_CONFIG = {
  critical: {
    symbol: '🔴',
    label: 'Critical Risk',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
    cardBorder: 'border-l-rose-600',
    cardBg: 'bg-gradient-to-r from-rose-50/90 via-white to-white',
    impactColor: 'text-rose-700',
  },
  high: {
    symbol: '🟠',
    label: 'High Risk',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-300 font-bold',
    cardBorder: 'border-l-orange-500',
    cardBg: 'bg-gradient-to-r from-orange-50/90 via-white to-white',
    impactColor: 'text-orange-700',
  },
  medium: {
    symbol: '🟡',
    label: 'Medium Attention',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
    cardBorder: 'border-l-amber-400',
    cardBg: 'bg-gradient-to-r from-amber-50/90 via-white to-white',
    impactColor: 'text-amber-800',
  },
  low: {
    symbol: '🟢',
    label: 'Low Priority',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
    cardBorder: 'border-l-emerald-500',
    cardBg: 'bg-gradient-to-r from-emerald-50/90 via-white to-white',
    impactColor: 'text-emerald-700',
  },
};

export default function ActionCenter() {
  const [actions, setActions] = useState([]);
  const [recoveryMetrics, setRecoveryMetrics] = useState({
    totalRevenueRecovered: 245000,
    arrProtected: 1280000,
    successRate: 78,
    activeActions: 8,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open');
  const [loadingMap, setLoadingMap] = useState({});
  const [banner, setBanner] = useState(null);

  // Mitigation Modal State
  const [selectedMitigationAction, setSelectedMitigationAction] = useState(null);
  const [mitigationPlan, setMitigationPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [executingMitigation, setExecutingMitigation] = useState(false);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [actionsRes, metricsRes] = await Promise.all([
        intelligenceService.getActions(),
        intelligenceService.getRecoveryMetrics(),
      ]);
      setActions(actionsRes.data || []);
      if (metricsRes?.data) {
        setRecoveryMetrics(metricsRes.data);
      }
    } catch (err) {
      console.error('Failed to load intelligence data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const showBanner = (msg, type = 'success') => {
    setBanner({ message: msg, type });
    setTimeout(() => setBanner(null), 5000);
  };

  // Open Mitigation Preview Modal
  const handleOpenMitigate = async (action) => {
    setSelectedMitigationAction(action);
    setLoadingPlan(true);
    setMitigationPlan(null);
    try {
      const planRes = await intelligenceService.getMitigationPlan(action.id);
      setMitigationPlan(planRes.data);
    } catch (err) {
      console.error('Error generating mitigation plan:', err);
      showBanner('Unable to retrieve the mitigation plan. Please try again.', 'error');
    } finally {
      setLoadingPlan(false);
    }
  };

  // Execute Confirmed Mitigation
  const handleConfirmExecution = async (actionId, plan) => {
    setExecutingMitigation(true);
    try {
      const result = await intelligenceService.executeMitigation(actionId, plan);
      
      // Update action in state
      setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: 'resolved', mitigationStatus: 'executed' } : a));
      
      // Update recovery metrics dynamically
      if (result.recoveryMetrics) {
        setRecoveryMetrics(result.recoveryMetrics);
      } else {
        setRecoveryMetrics(prev => ({
          ...prev,
          totalRevenueRecovered: prev.totalRevenueRecovered + (plan?.target_recovery || 45000),
          arrProtected: prev.arrProtected + Math.round((plan?.target_recovery || 45000) * 1.5),
          activeActions: Math.max(0, prev.activeActions - 1),
          successRate: Math.min(98, prev.successRate + 1),
        }));
      }

      showBanner(
        `⚡ Mitigation executed for ${selectedMitigationAction?.customerCompany || 'account'}. Recovery sequence initiated.`,
        'success'
      );
      setSelectedMitigationAction(null);
      setMitigationPlan(null);
    } catch (err) {
      console.error('Failed to execute mitigation:', err);
      showBanner('Mitigation execution encountered an error. Please retry.', 'error');
    } finally {
      setExecutingMitigation(false);
    }
  };

  // Persistent Triage: Resolve
  const handleResolve = async (id) => {
    setLoadingMap(prev => ({ ...prev, [id]: 'resolving' }));
    try {
      const res = await intelligenceService.resolveAction(id);
      setActions(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a));
      showBanner(`Action marked resolved. Revenue risk mitigated.`);
      // Refresh metrics
      const metricsRes = await intelligenceService.getRecoveryMetrics();
      if (metricsRes?.data) setRecoveryMetrics(metricsRes.data);
    } catch (err) {
      console.error(err);
      showBanner('Failed to resolve action.', 'error');
    } finally {
      setLoadingMap(prev => ({ ...prev, [id]: null }));
    }
  };

  // Persistent Triage: Snooze
  const handleSnooze = async (id) => {
    setLoadingMap(prev => ({ ...prev, [id]: 'snoozing' }));
    try {
      await intelligenceService.snoozeAction(id);
      setActions(prev => prev.map(a => a.id === id ? { ...a, status: 'snoozed' } : a));
      showBanner(`Action snoozed for 7 days.`);
    } catch (err) {
      console.error(err);
      showBanner('Failed to snooze action.', 'error');
    } finally {
      setLoadingMap(prev => ({ ...prev, [id]: null }));
    }
  };

  // Persistent Triage: Reopen
  const handleReopen = async (id) => {
    setLoadingMap(prev => ({ ...prev, [id]: 'reopening' }));
    try {
      await intelligenceService.reopenAction(id);
      setActions(prev => prev.map(a => a.id === id ? { ...a, status: 'open' } : a));
      showBanner(`Action reopened and returned to active queue.`);
    } catch (err) {
      console.error(err);
      showBanner('Failed to reopen action.', 'error');
    } finally {
      setLoadingMap(prev => ({ ...prev, [id]: null }));
    }
  };

  // Counts for triage tabs
  const criticalCount = actions.filter(a => a.priority === 'critical' && a.status === 'open').length;
  const highCount     = actions.filter(a => a.priority === 'high' && a.status === 'open').length;
  const mediumCount   = actions.filter(a => a.priority === 'medium' && a.status === 'open').length;
  const resolvedCount = actions.filter(a => a.status === 'resolved').length;

  const totalAtRisk = actions
    .filter(a => a.status === 'open' && a.amount)
    .reduce((sum, a) => sum + a.amount, 0);

  const filteredActions = actions.filter(a => {
    if (activeTab === 'all') return true;
    return a.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue Action Center"
        subtitle="Autonomous Revenue Recovery & Churn Defense Agent — Real-time risk detection and human-supervised mitigation"
        breadcrumbs={['REVORA', 'Intelligence', 'Action Center']}
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchAllData}
            loading={loading}
          >
            Refresh Alerts
          </Button>
        }
      />

      {/* Banner Notifications */}
      {banner && (
        <div className={clsx(
          'flex items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold shadow-xs animate-fade-in border',
          banner.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        )}>
          <div className="flex items-center gap-2">
            {banner.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            )}
            <span>{banner.message}</span>
          </div>
          <button onClick={() => setBanner(null)} className="hover:underline font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* ── FEATURE 1: RECOVERY ANALYTICS KPI RIBBON ──────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Revenue Recovered */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Total Revenue Recovered
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/25">
              <DollarSign className="h-5 w-5 stroke-[2.5]" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-slate-900 font-mono">
              {formatCurrency(recoveryMetrics.totalRevenueRecovered)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-0.5 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                +₹48,200 this cycle
              </span>
              <span className="text-[11px] text-slate-400 font-medium">dunning recovered</span>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Status</span>
            <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Revenue Protected
            </span>
          </div>
        </div>

        {/* Metric 2: ARR Protected */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-indigo-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              ARR Protected
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-slate-900 font-mono">
              {formatCurrency(recoveryMetrics.arrProtected)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-0.5 font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                <Award className="h-3 w-3" />
                5 High-Value Accounts
              </span>
              <span className="text-[11px] text-slate-400 font-medium">churn mitigated</span>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Annual Run-Rate Defense</span>
            <span className="font-extrabold text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded-md">
              Active Defense
            </span>
          </div>
        </div>

        {/* Metric 3: Mitigation Success Rate */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-cyan-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Mitigation Success Rate
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/25">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-slate-900 font-mono">
              {recoveryMetrics.successRate}%
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-0.5 font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                High Efficiency
              </span>
              <span className="text-[11px] text-slate-400 font-medium">automated rescue</span>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Dunning Conversion</span>
            <span className="font-extrabold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md">
              Top 5% Cohort
            </span>
          </div>
        </div>

        {/* Metric 4: Active Recovery Actions */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-amber-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Active Recovery Actions
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25">
              <Zap className="h-5 w-5 fill-current" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-slate-900 font-mono">
              {recoveryMetrics.activeActions}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-0.5 font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                <Clock className="h-3 w-3" />
                Requires Attention
              </span>
              <span className="text-[11px] text-slate-400 font-medium">pending human review</span>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Priority Queue</span>
            <span className="font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
              AI Monitored
            </span>
          </div>
        </div>
      </div>

      {/* Intelligence Priority Triage Bar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-rose-300 bg-gradient-to-br from-rose-50/70 via-white to-white p-4 shadow-xs">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>🔴</span> Critical Risk
            </span>
            <span className="text-[10px] font-extrabold text-rose-900 bg-rose-200/90 px-2 py-0.5 rounded-full border border-rose-300">
              Immediate
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">{criticalCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">High-impact invoice overdue</div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-orange-300 bg-gradient-to-br from-orange-50/70 via-white to-white p-4 shadow-xs">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>🟠</span> High Risk
            </span>
            <span className="text-[10px] font-extrabold text-orange-900 bg-orange-200/90 px-2 py-0.5 rounded-full border border-orange-300">
              Churn Alerts
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">{highCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Payment failures / churn probability</div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50/70 via-white to-white p-4 shadow-xs">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>🟡</span> Medium Attention
            </span>
            <span className="text-[10px] font-extrabold text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-full border border-amber-300">
              Renewals
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">{mediumCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Renewals & expansion upsell</div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50/70 via-white to-white p-4 shadow-xs">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>🟢</span> Protected Yield
            </span>
            <span className="text-[10px] font-extrabold text-emerald-900 bg-emerald-200/90 px-2 py-0.5 rounded-full border border-emerald-300">
              Mitigated
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">{resolvedCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Actions executed successfully</div>
        </div>
      </div>

      {/* Filter Tabs & Total at Stake Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex rounded-xl bg-slate-100 p-1 gap-1 text-xs font-bold border border-slate-200/80">
          {FILTER_TABS.map(tab => {
            const count = actions.filter(a => tab.key === 'all' ? true : a.status === tab.key).length;
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={clsx(
                  'px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                <span>{tab.label}</span>
                <span className={clsx(
                  'rounded-full px-1.5 py-0.2 text-[10px]',
                  isSelected ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'bg-slate-200/70 text-slate-600'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Unsettled Pipeline Exposure:</span>
          <span className="font-mono font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            {formatCurrency(totalAtRisk)}
          </span>
        </div>
      </div>

      {/* Action Cards List */}
      {loading ? (
        <Loading text="Scanning revenue pipelines for risks..." />
      ) : filteredActions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-3 shadow-xs">
            <CheckCircle className="h-6 w-6 stroke-[2.5]" />
          </div>
          <h3 className="text-base font-bold text-slate-900">✓ No critical revenue risks detected</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            REVORA is currently monitoring your revenue health. No active revenue alerts match the &ldquo;{activeTab}&rdquo; filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActions.map(action => {
            const pConfig = PRIORITY_BADGE_CONFIG[action.priority] || PRIORITY_BADGE_CONFIG.medium;
            const isResolving = loadingMap[action.id] === 'resolving';
            const isSnoozing  = loadingMap[action.id] === 'snoozing';
            const isReopening = loadingMap[action.id] === 'reopening';

            return (
              <div
                key={action.id}
                className={clsx(
                  'rounded-2xl border border-slate-200/90 p-5 shadow-xs transition-all hover:shadow-md border-l-4 card-elevation',
                  pConfig.cardBorder,
                  pConfig.cardBg
                )}
              >
                {/* Header row: Priority Badge + Title + Revenue Impact */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border', pConfig.badgeClass)}>
                        <span>{pConfig.symbol}</span>
                        <span>{pConfig.label.toUpperCase()}</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Target Account: <strong className="text-slate-800">{action.customerCompany}</strong>
                      </span>
                      <StatusBadge status={action.status} showDot={false} className="text-[10px]" />
                      {action.mitigationStatus === 'executed' && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                          ⚡ Mitigation Active
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 tracking-tight pt-1">
                      {action.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {action.description}
                    </p>
                  </div>

                  {/* Revenue Impact Callout */}
                  {action.amount && (
                    <div className="shrink-0 self-start sm:self-auto rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-right shadow-2xs">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Revenue Impact
                      </span>
                      <span className={clsx('text-base font-black font-mono', pConfig.impactColor)}>
                        {formatCurrency(action.amount)}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-medium">at risk</span>
                    </div>
                  )}
                </div>

                {/* Recommended Action Card (High-Impact Box) */}
                <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-950 mb-1">
                    <Lightbulb className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>AI Recommended Action:</span>
                  </div>
                  <p className="text-indigo-950 font-medium leading-relaxed pl-5.5">
                    {action.recommendedAction}
                  </p>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-slate-400 font-medium">
                    Alert identified {formatRelativeTime(action.createdAt)} • Automated Priority Engine
                  </div>

                  {/* Action Buttons: ⚡ Mitigate + Triage Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* FEATURE 2: 1-Click Mitigate Button */}
                    {action.status !== 'resolved' && (
                      <button
                        onClick={() => handleOpenMitigate(action)}
                        data-variant="primary"
                        style={{ color: '#ffffff', opacity: 1, visibility: 'visible', WebkitTextFillColor: '#ffffff' }}
                        className="btn-primary inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-indigo-500/25 hover:from-indigo-500 hover:to-purple-500 transition-all cursor-pointer"
                      >
                        <Zap className="h-3.5 w-3.5 fill-current text-white" style={{ color: '#ffffff' }} />
                        <span style={{ color: '#ffffff', opacity: 1, visibility: 'visible', WebkitTextFillColor: '#ffffff' }}>⚡ Mitigate Risk</span>
                      </button>
                    )}

                    {/* FEATURE 4: Persistent Triage Controls */}
                    {action.status === 'open' && (
                      <>
                        <button
                          onClick={() => handleResolve(action.id)}
                          disabled={!!loadingMap[action.id]}
                          className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{isResolving ? 'Resolving...' : '✓ Resolve'}</span>
                        </button>

                        <button
                          onClick={() => handleSnooze(action.id)}
                          disabled={!!loadingMap[action.id]}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{isSnoozing ? 'Snoozing...' : '⏰ Snooze'}</span>
                        </button>
                      </>
                    )}

                    {action.status === 'snoozed' && (
                      <button
                        onClick={() => handleReopen(action.id)}
                        disabled={!!loadingMap[action.id]}
                        className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>{isReopening ? 'Reopening...' : '↻ Reopen Queue'}</span>
                      </button>
                    )}

                    {action.status === 'resolved' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Risk Mitigated
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── FEATURE 3: AI MITIGATION PREVIEW MODAL ───────────────────────── */}
      <MitigationModal
        isOpen={!!selectedMitigationAction}
        onClose={() => {
          setSelectedMitigationAction(null);
          setMitigationPlan(null);
        }}
        action={selectedMitigationAction}
        plan={mitigationPlan}
        loadingPlan={loadingPlan}
        onExecute={handleConfirmExecution}
        executing={executingMitigation}
      />
    </div>
  );
}
