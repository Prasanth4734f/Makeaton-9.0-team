import React, { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import {
  AlertCircle, Clock, TrendingDown, ArrowUpRight, CheckCircle,
  Bell, BellOff, RefreshCw, Zap, AlertTriangle, DollarSign,
  Users, BarChart3, Lightbulb, Sparkles, Building2, ChevronRight,
  ShieldAlert, CheckCircle2, RotateCcw, ArrowRight
} from 'lucide-react';

import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Loading } from '../components/ui/Loading';
import { intelligenceService } from '../services/intelligenceService';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/formatters';

const FILTER_TABS = [
  { key: 'all',      label: 'All Alerts' },
  { key: 'open',     label: 'Open' },
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open');
  const [loadingMap, setLoadingMap] = useState({});
  const [banner, setBanner] = useState(null);

  const fetchActions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await intelligenceService.getActions();
      setActions(res.data);
    } catch (err) {
      console.error('Failed to load actions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const showBanner = (msg) => {
    setBanner(msg);
    setTimeout(() => setBanner(null), 4000);
  };

  const handleResolve = async (id) => {
    setLoadingMap(prev => ({ ...prev, [id]: 'resolving' }));
    try {
      const res = await intelligenceService.resolveAction(id);
      setActions(prev => prev.map(a => a.id === id ? res.data : a));
      showBanner(`Action marked resolved. Revenue risk mitigated.`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMap(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleSnooze = async (id) => {
    setLoadingMap(prev => ({ ...prev, [id]: 'snoozing' }));
    try {
      const res = await intelligenceService.snoozeAction(id);
      setActions(prev => prev.map(a => a.id === id ? res.data : a));
      showBanner(`Action snoozed for 7 days.`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMap(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleReopen = async (id) => {
    setLoadingMap(prev => ({ ...prev, [id]: 'reopening' }));
    try {
      const res = await intelligenceService.reopenAction(id);
      setActions(prev => prev.map(a => a.id === id ? res.data : a));
      showBanner(`Action reopened and returned to active triage queue.`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMap(prev => ({ ...prev, [id]: null }));
    }
  };

  // KPIs
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
        subtitle="Automated revenue intelligence, churn prevention, and proactive dunning orchestration"
        breadcrumbs={['REVORA', 'Intelligence', 'Action Center']}
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            size="sm"
            onClick={fetchActions}
            loading={loading}
          >
            Refresh Alerts
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
          <button onClick={() => setBanner(null)} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex rounded-xl bg-slate-100 p-1 gap-1 text-xs font-bold">
          {FILTER_TABS.map(tab => {
            const count = actions.filter(a => tab.key === 'all' ? true : a.status === tab.key).length;
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

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span>Total Monthly Yield at Risk:</span>
          <span className="font-mono font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
            {formatCurrency(totalAtRisk)}
          </span>
        </div>
      </div>

      {/* Action Cards List */}
      {loading ? (
        <Loading text="Scanning revenue pipelines for risks..." />
      ) : filteredActions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
            <CheckCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">All revenue streams nominal</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No active revenue alerts match the &ldquo;{activeTab}&rdquo; filter. The automated billing engine continues monitoring.
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
                    <div className="shrink-0 self-start sm:self-auto rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-right">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Revenue Impact
                      </span>
                      <span className={clsx('text-base font-extrabold font-mono', pConfig.impactColor)}>
                        {formatCurrency(action.amount)}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-medium">at risk</span>
                    </div>
                  )}
                </div>

                {/* Recommended Action Card (High-Impact Box) */}
                <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-1">
                    <Lightbulb className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>Recommended Action:</span>
                  </div>
                  <p className="text-indigo-950 font-medium leading-relaxed pl-5.5">
                    {action.recommendedAction}
                  </p>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-slate-400 font-medium">
                    Alert identified {formatRelativeTime(action.createdAt)} • Automated Priority Engine
                  </div>

                  <div className="flex items-center gap-2">
                    {action.status === 'open' && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Clock}
                          loading={isSnoozing}
                          onClick={() => handleSnooze(action.id)}
                        >
                          Snooze
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={CheckCircle2}
                          loading={isResolving}
                          onClick={() => handleResolve(action.id)}
                        >
                          Take Action / Resolve
                        </Button>
                      </>
                    )}

                    {(action.status === 'resolved' || action.status === 'snoozed') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={RotateCcw}
                        loading={isReopening}
                        onClick={() => handleReopen(action.id)}
                      >
                        Reopen Alert
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
