import React, { useState } from 'react';
import {
  Zap, AlertTriangle, ShieldCheck, X, CheckCircle2, Clock,
  ArrowRight, DollarSign, Mail, MessageSquare, Percent, Sparkles,
  Info, AlertCircle, RefreshCw
} from 'lucide-react';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../utils/formatters';
import { clsx } from 'clsx';

export function MitigationModal({
  isOpen,
  onClose,
  action,
  plan,
  loadingPlan,
  onExecute,
  executing
}) {
  if (!isOpen || !action) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-10 my-8 animate-fade-in">
        {/* Top Gradient Highlight */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6 bg-slate-50/70">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-md shadow-indigo-500/25">
              <Zap className="h-6 w-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Revenue Recovery Plan
                </h3>
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-700 border border-indigo-200">
                  AI Defense Agent
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Account: <strong className="text-slate-800">{action.customerCompany}</strong> ({action.customerName})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={executing}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[calc(85vh-160px)] overflow-y-auto">
          {loadingPlan ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-600">Analyzing recovery strategy & synthesizing plan...</p>
            </div>
          ) : plan ? (
            <>
              {/* Executive Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Risk Level</span>
                  <span className={clsx(
                    'inline-flex items-center gap-1 font-extrabold text-xs mt-1 px-2 py-0.5 rounded-full',
                    plan.risk_level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-orange-100 text-orange-800'
                  )}>
                    {plan.risk_level === 'CRITICAL' ? '🔴 CRITICAL' : '🟠 HIGH'}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Risk Score</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-base font-black text-slate-900 font-mono">{plan.risk_score}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">/ 100</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Revenue At Risk</span>
                  <span className="text-sm font-extrabold text-rose-700 font-mono mt-1 block">
                    {formatCurrency(plan.potential_revenue_impact)}
                  </span>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Target Recovery</span>
                  <span className="text-sm font-extrabold text-emerald-800 font-mono mt-1 block">
                    {formatCurrency(plan.target_recovery)}
                  </span>
                </div>
              </div>

              {/* Section 1: Why is this account at risk? */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-rose-500" />
                    Why is this account at risk?
                  </h4>
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    {Math.round((plan.confidence || 0.91) * 100)}% AI Confidence
                  </span>
                </div>

                {/* Signals detected */}
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Detected Signals
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {plan.signals?.map((sig, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{sig}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Churn Probability Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-600">Calculated Churn Probability:</span>
                    <span className="font-extrabold text-rose-700 font-mono">{plan.churn_probability}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 transition-all duration-500"
                      style={{ width: `${plan.churn_probability}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Recommended Mitigation Strategy */}
              <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    Recommended Mitigation Strategy
                  </h4>
                  <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-800">
                    {plan.plan_type}
                  </span>
                </div>

                <div className="rounded-lg bg-white p-3.5 border border-indigo-100 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{plan.recommended_action}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Suggested Grace Period</span>
                      <strong className="text-slate-800">{plan.suggested_grace_period || '7 days'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Projected Revenue Protected</span>
                      <strong className="text-emerald-700 font-mono">{formatCurrency(plan.target_recovery)}</strong>
                    </div>
                  </div>
                </div>

                {/* Communication Dispatch Preview */}
                {plan.preview && (
                  <div className="rounded-lg bg-slate-900 text-slate-100 p-3.5 text-xs space-y-1.5 font-mono">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                      <span>Dispatch: {plan.preview.channel}</span>
                      <span>Immediate Sequence</span>
                    </div>
                    <div className="text-[11px] text-indigo-300 font-semibold">{plan.preview.subject}</div>
                    <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                      {plan.preview.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Human Approval Required Warning Banner */}
              <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs text-amber-950">
                  <span className="font-bold block">⚠️ Human approval required before execution</span>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    REVORA autonomous revenue defense agent cannot execute payment retry, dunning notifications, or renewal discounts without explicit human confirmation.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-xs text-rose-500">
              Unable to retrieve the mitigation plan. Please try again.
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={executing}
          >
            Cancel
          </Button>

          <Button
            onClick={() => onExecute(action.id, plan)}
            loading={executing}
            disabled={loadingPlan || !plan}
            className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-md shadow-indigo-500/25"
            icon={Zap}
          >
            {executing ? 'Executing Mitigation...' : '⚡ Execute Mitigation'}
          </Button>
        </div>
      </div>
    </div>
  );
}
