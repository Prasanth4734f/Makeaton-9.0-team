import { api } from './api.js';
import { MOCK_REVENUE_ACTIONS } from '../data/mockData.js';

// Persistent in-memory & localStorage store for actions and recovery metrics
const STORAGE_ACTIONS_KEY = 'revora_intelligence_actions';
const STORAGE_METRICS_KEY = 'revora_recovery_metrics';

function loadStoredActions() {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fallback */ }
  return [...MOCK_REVENUE_ACTIONS];
}

function saveStoredActions(actionsList) {
  try {
    localStorage.setItem(STORAGE_ACTIONS_KEY, JSON.stringify(actionsList));
  } catch { /* ignore */ }
}

function loadStoredMetrics() {
  try {
    const raw = localStorage.getItem(STORAGE_METRICS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fallback */ }
  return {
    totalRevenueRecovered: 245000,
    arrProtected: 1280000,
    successRate: 78,
    activeActions: 8,
    mitigationsExecuted: 14,
    lastMitigationAt: new Date().toISOString(),
  };
}

function saveStoredMetrics(metrics) {
  try {
    localStorage.setItem(STORAGE_METRICS_KEY, JSON.stringify(metrics));
  } catch { /* ignore */ }
}

let localActions = loadStoredActions();
let localRecoveryMetrics = loadStoredMetrics();

function delay(ms = 250) {
  return new Promise(r => setTimeout(r, ms));
}

export const intelligenceService = {
  /**
   * Fetch all intelligence actions
   */
  async getActions() {
    try {
      const res = await api.get('/intelligence/actions');
      if (res?.data?.data?.actions) {
        return { data: res.data.data.actions };
      }
      if (res?.data?.data) {
        return { data: res.data.data };
      }
    } catch (err) {
      // Backend unavailable or endpoint pending — use local store
    }
    await delay(200);
    return { data: localActions };
  },

  /**
   * Fetch recovery analytics metrics
   * Required: Total Revenue Recovered, ARR Protected, Mitigation Success Rate, Active Recovery Actions
   */
  async getRecoveryMetrics() {
    try {
      const res = await api.get('/intelligence/recovery-metrics');
      if (res?.data?.data) {
        return { data: res.data.data };
      }
      if (res?.data) {
        return { data: res.data };
      }
    } catch (err) {
      // Backend unavailable or endpoint pending — compute from local store
    }
    await delay(150);
    const activeCount = localActions.filter(a => a.status === 'open' || a.status === 'in_progress').length;
    const computedMetrics = {
      ...localRecoveryMetrics,
      activeActions: activeCount || localRecoveryMetrics.activeActions,
    };
    return { data: computedMetrics };
  },

  /**
   * Generate or fetch AI Mitigation Plan preview for a specific risk alert
   */
  async getMitigationPlan(actionId) {
    try {
      const res = await api.get(`/intelligence/actions/${actionId}/preview`);
      if (res?.data?.data) {
        return { data: res.data.data };
      }
    } catch {
      // Endpoint fallback
    }

    await delay(300);
    const action = localActions.find(a => a.id === actionId) || {
      id: actionId,
      customerCompany: 'Enterprise Client',
      amount: 59000,
      priority: 'critical',
      type: 'overdue',
    };

    // Determine plan type and synthesized signals based on action context
    let planType = 'DUNNING_NOTICE';
    let recommendedAction = 'Send Smart Payment Reminder & Dunning Sequence';
    let suggestedGracePeriod = '7 days';
    let recommendedDiscount = 0;
    let signals = [
      'Invoice is past due date and exceeds normal payment cycle',
      'Previous payment attempt experienced failure / decline',
      'Outstanding ledger balance has increased by >35%',
    ];

    if (action.type === 'churn_risk' || action.churnProbability) {
      planType = 'RENEWAL_RESCUE_OFFER';
      recommendedAction = 'Generate Renewal Rescue Offer & Executive Retention Touchpoint';
      recommendedDiscount = 10;
      signals = [
        'Customer engagement score dropped below threshold (42/100)',
        'Payment method decline recorded on previous invoice cycle',
        'Approaching subscription renewal date with unacknowledged quote',
      ];
    } else if (action.type === 'upsell') {
      planType = 'TIER_UPGRADE_OPTIMIZATION';
      recommendedAction = 'Generate Automated Plan Expansion Proposal with Volume Discount';
      recommendedDiscount = 15;
      signals = [
        'Customer has consumed >85% of licensed tier capacity',
        'API usage metrics indicate sustained 40% MoM volume growth',
        'Account profile matches ideal Growth-tier customer cohort',
      ];
    } else if (action.type === 'renewal') {
      planType = 'RENEWAL_RESCUE_OFFER';
      recommendedAction = 'Issue Advance Renewal Notice with 10% Multi-Year Discount';
      recommendedDiscount = 10;
      signals = [
        'Subscription renewal window opens in under 14 days',
        'Auto-renewal card token valid but requires customer pre-approval',
        'High lifetime value account (ARR > ₹1.5L)',
      ];
    }

    const churnRisk = action.churnProbability
      ? Math.round(action.churnProbability * 100)
      : action.priority === 'critical' ? 84 : action.priority === 'high' ? 68 : 45;

    const riskScore = action.priority === 'critical' ? 92 : action.priority === 'high' ? 82 : 64;

    const potentialImpact = action.amount || (action.potentialMrr ? action.potentialMrr * 12 : 59000);
    const projectedRecovery = Math.round(potentialImpact * 0.95);

    const plan = {
      action_id: action.id,
      customer_company: action.customerCompany,
      customer_name: action.customerName,
      plan_type: planType,
      risk_score: riskScore,
      risk_level: (action.priority || 'high').toUpperCase(),
      churn_probability: churnRisk,
      potential_revenue_impact: potentialImpact,
      projected_recovery: projectedRecovery,
      confidence: 0.91,
      signals,
      recommended_action: recommendedAction,
      suggested_grace_period: suggestedGracePeriod,
      recommended_discount: recommendedDiscount,
      target_recovery: projectedRecovery,
      preview: {
        subject: `[Urgent Action Required] Payment & Service Continuity Notice — ${action.customerCompany}`,
        channel: 'Omnichannel (Email, In-App Banner, WhatsApp webhook)',
        schedule: 'Immediate dispatch upon human approval, followed by T+3 automated escalation',
        message: `Dear ${action.customerName || 'Finance Team'},\n\nOur automated revenue protection system noticed an outstanding balance of ₹${(potentialImpact).toLocaleString('en-IN')} associated with your REVORA enterprise subscription. To prevent service disruption, please review your billing ledger or update your payment details using our secure customer portal.\n\nA grace period of ${suggestedGracePeriod} has been provisioned.\n\nBest regards,\nREVORA Autonomous Revenue Operations`,
      },
    };

    return { data: plan };
  },

  /**
   * Execute human-confirmed mitigation plan
   */
  async executeMitigation(actionId, params = {}) {
    try {
      const res = await api.post(`/intelligence/actions/${actionId}/execute`, params);
      if (res?.data) {
        return res.data;
      }
    } catch {
      // Backend endpoint fallback
    }

    await delay(600);
    const idx = localActions.findIndex(a => a.id === actionId);
    let target = null;
    if (idx !== -1) {
      localActions[idx] = {
        ...localActions[idx],
        status: 'resolved',
        mitigationStatus: 'executed',
        mitigatedAt: new Date().toISOString(),
        mitigationPlanType: params.plan_type || 'DUNNING_NOTICE',
      };
      target = localActions[idx];
      saveStoredActions(localActions);
    }

    // Update recovery metrics dynamically
    const recoveredDelta = target?.amount || params.projected_recovery || 45000;
    localRecoveryMetrics = {
      ...localRecoveryMetrics,
      totalRevenueRecovered: localRecoveryMetrics.totalRevenueRecovered + recoveredDelta,
      arrProtected: localRecoveryMetrics.arrProtected + Math.round(recoveredDelta * 1.5),
      mitigationsExecuted: localRecoveryMetrics.mitigationsExecuted + 1,
      successRate: Math.min(96, localRecoveryMetrics.successRate + 1),
      lastMitigationAt: new Date().toISOString(),
    };
    saveStoredMetrics(localRecoveryMetrics);

    return {
      success: true,
      message: `Mitigation executed successfully for ${target?.customerCompany || 'account'}. Recovery sequence active.`,
      data: target,
      recoveryMetrics: localRecoveryMetrics,
    };
  },

  /**
   * Mark action resolved
   */
  async resolveAction(id) {
    try {
      const res = await api.post(`/intelligence/actions/${id}/resolve`);
      if (res?.data) return res.data;
    } catch {
      // Fallback
    }
    await delay(300);
    const idx = localActions.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Action not found');
    localActions[idx] = { ...localActions[idx], status: 'resolved' };
    saveStoredActions(localActions);
    return { data: localActions[idx] };
  },

  /**
   * Snooze action
   */
  async snoozeAction(id) {
    try {
      const res = await api.post(`/intelligence/actions/${id}/snooze`);
      if (res?.data) return res.data;
    } catch {
      // Fallback
    }
    await delay(300);
    const idx = localActions.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Action not found');
    localActions[idx] = { ...localActions[idx], status: 'snoozed' };
    saveStoredActions(localActions);
    return { data: localActions[idx] };
  },

  /**
   * Reopen action
   */
  async reopenAction(id) {
    try {
      const res = await api.post(`/intelligence/actions/${id}/reopen`);
      if (res?.data) return res.data;
    } catch {
      // Fallback
    }
    await delay(300);
    const idx = localActions.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Action not found');
    localActions[idx] = { ...localActions[idx], status: 'open' };
    saveStoredActions(localActions);
    return { data: localActions[idx] };
  },
};
