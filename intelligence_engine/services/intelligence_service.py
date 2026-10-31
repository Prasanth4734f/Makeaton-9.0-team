"""Main intelligence service for Revora.

Primary integration boundary for Sai's backend.
Provides clean, pure-Python APIs to analyze revenue risks, predict customer churn,
formulate autonomous mitigation plans, and execute billing automation.
"""

from datetime import date
from typing import Any, Dict, List, Optional, Union

from intelligence_engine.adapters.data_adapter import DataAdapter, parse_date
from intelligence_engine.automation.billing_processor import BillingProcessor
from intelligence_engine.engine.churn_predictor import ChurnPredictor
from intelligence_engine.engine.mitigation_engine import MitigationEngine
from intelligence_engine.engine.recovery_agent import AutonomousRecoveryAgent
from intelligence_engine.engine.revenue_analyzer import RevenueAnalyzer
from intelligence_engine.schemas.intelligence_schema import (
    AgenticActionReport,
    BillingInstruction,
    ChurnLevel,
    FinancialImpact,
    IntelligenceReport,
    InvoiceRecord,
    MitigationPlan,
    PaymentRecord,
    PlanType,
    PriorityLevel,
    RevenueSummary,
    RiskSignal,
    SubscriptionRecord,
)


# =============================================================================
# EXISTING CORE INTELLIGENCE APIs (Preserved 100% backward-compatible)
# =============================================================================

def analyze_revenue(
    data: Union[Dict[str, Any], Any],
    reference_date: Optional[Union[str, date]] = None,
) -> Dict[str, Any]:
    """Primary integration endpoint to analyze full business data and generate the Revenue Action Center report.

    Args:
        data: Dict containing 'subscriptions', 'invoices', and optionally 'payments'.
              Accepts raw dictionaries, ORM objects, or normalized schema lists.
        reference_date: Optional reference date context (default: today).

    Returns:
        Structured dictionary matching IntelligenceReport:
        {
            "summary": {
                "total_actions": int,
                "critical": int,
                "high": int,
                "medium": int,
                "low": int,
                "total_revenue_at_risk": float
            },
            "actions": [ ...list of prioritized ActionItem dicts... ]
        }
    """
    ref_dt = parse_date(reference_date) or date.today()

    # 1. Normalize all input data
    normalized = DataAdapter.normalize_payload(data)
    subs = normalized["subscriptions"]
    invs = normalized["invoices"]

    # 2. Run revenue analysis and generate sorted action items
    actions = RevenueAnalyzer.analyze(
        subscriptions=subs,
        invoices=invs,
        reference_date=ref_dt,
    )

    # 3. Calculate summary metrics
    critical_count = sum(1 for a in actions if a["priority"] == PriorityLevel.CRITICAL.value)
    high_count = sum(1 for a in actions if a["priority"] == PriorityLevel.HIGH.value)
    medium_count = sum(1 for a in actions if a["priority"] == PriorityLevel.MEDIUM.value)
    low_count = sum(1 for a in actions if a["priority"] == PriorityLevel.LOW.value)

    # Total revenue at risk: sum of amounts across actionable risks
    total_revenue_at_risk = round(sum(a["amount"] for a in actions), 2)

    summary = {
        "total_actions": len(actions),
        "critical": critical_count,
        "high": high_count,
        "medium": medium_count,
        "low": low_count,
        "total_revenue_at_risk": total_revenue_at_risk,
    }

    return {
        "summary": summary,
        "actions": actions,
    }


def process_subscription_billing(
    subscription: Union[Dict[str, Any], Any],
    existing_invoices: Optional[List[Union[Dict[str, Any], Any]]] = None,
    tax_rate: Optional[float] = None,
    reference_date: Optional[Union[str, date]] = None,
) -> Dict[str, Any]:
    """Evaluate and process automated billing calculation for a single subscription.

    Args:
        subscription: Subscription data dictionary or object.
        existing_invoices: List of invoices in the system to prevent duplicate billing.
        tax_rate: Optional tax rate override percentage (e.g. 18.0).
        reference_date: Optional reference date (default: today).

    Returns:
        Structured dictionary matching BillingInstruction.
    """
    return BillingProcessor.process_subscription(
        subscription=subscription,
        existing_invoices=existing_invoices,
        tax_rate=tax_rate,
        reference_date=reference_date,
    )


# =============================================================================
# NEW AGENTIC INTELLIGENCE APIs (Sai's Backend Integration Contract)
# =============================================================================

def evaluate_customer_churn(
    customer: Optional[Union[Dict[str, Any], Any]] = None,
    invoices: Optional[List[Union[Dict[str, Any], Any]]] = None,
    payments: Optional[List[Union[Dict[str, Any], Any]]] = None,
    subscriptions: Optional[List[Union[Dict[str, Any], Any]]] = None,
    reference_date: Optional[Union[str, date]] = None,
) -> Dict[str, Any]:
    """Evaluate customer churn risk and extract structured risk signals.

    Args:
        customer: Customer record or dictionary (id, name, email).
        invoices: All invoices for this customer.
        payments: Historical payment records for this customer's invoices.
        subscriptions: Customer active/historical subscriptions.
        reference_date: Optional evaluation date (default: today).

    Returns:
        Dict containing:
            customer_id: str
            customer_name: str
            probability: int (0 - 100)
            level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
            signals: List of RiskSignal dicts (type, severity, description, metric_value)
            score_breakdown: Factor breakdown dict
            metrics: Core telemetry metrics dict
    """
    return ChurnPredictor.evaluate(
        customer=customer,
        invoices=invoices,
        payments=payments,
        subscriptions=subscriptions,
        reference_date=reference_date,
    )


def generate_mitigation_plan(
    churn_assessment: Dict[str, Any],
    subscriptions: Optional[List[Union[Dict[str, Any], Any]]] = None,
    invoices: Optional[List[Union[Dict[str, Any], Any]]] = None,
    reference_date: Optional[Union[str, date]] = None,
) -> Dict[str, Any]:
    """Generate Next Best Action mitigation strategy and financial impact estimation.

    Args:
        churn_assessment: Result from evaluate_customer_churn().
        subscriptions: List of customer subscriptions.
        invoices: List of customer invoices.
        reference_date: Contextual evaluation date.

    Returns:
        Dict with 'mitigation_plan' and 'financial_impact'.
    """
    return MitigationEngine.generate_plan(
        churn_assessment=churn_assessment,
        subscriptions=subscriptions,
        invoices=invoices,
        reference_date=reference_date,
    )


def run_autonomous_recovery_agent(
    customer: Optional[Union[Dict[str, Any], Any]] = None,
    invoices: Optional[List[Union[Dict[str, Any], Any]]] = None,
    payments: Optional[List[Union[Dict[str, Any], Any]]] = None,
    subscriptions: Optional[List[Union[Dict[str, Any], Any]]] = None,
    reference_date: Optional[Union[str, date]] = None,
) -> Dict[str, Any]:
    """Run complete 7-stage autonomous revenue recovery and churn defense intelligence cycle.

    Orchestrates:
    OBSERVE -> ANALYZE -> DETECT SIGNALS -> ESTIMATE IMPACT -> PLAN -> EXPLAIN -> AWAIT HUMAN APPROVAL

    Args:
        customer: Customer dict or object.
        invoices: Customer invoice history.
        payments: Customer payment history.
        subscriptions: Customer subscription records.
        reference_date: Reference date.

    Returns:
        Structured dict conforming to AgenticActionReport schema:
        {
            "action_id": str,
            "generated_at": str,
            "customer_id": str,
            "customer_name": str,
            "risk": { "priority": str, "overall_score": int, "factor_breakdown": dict, "reasoning": list },
            "churn": { "probability": int, "level": str, "metrics": dict },
            "signals": [ ...RiskSignal dicts... ],
            "financial_impact": { "potential_revenue_impact": float, "projected_recovery": float, "projected_revenue_protected": float, "currency": "INR" },
            "mitigation_plan": { "plan_type": str, "recommended_action": str, "reason": str, "priority": str, "confidence": float, "execution_preview": dict },
            "requires_human_approval": True  # Always True
        }
    """
    return AutonomousRecoveryAgent.run(
        customer=customer,
        invoices=invoices,
        payments=payments,
        subscriptions=subscriptions,
        reference_date=reference_date,
    )


def rank_customer_portfolio(
    customers: List[Dict[str, Any]],
    invoices: Optional[List[Union[Dict[str, Any], Any]]] = None,
    payments: Optional[List[Union[Dict[str, Any], Any]]] = None,
    subscriptions: Optional[List[Union[Dict[str, Any], Any]]] = None,
    reference_date: Optional[Union[str, date]] = None,
) -> List[Dict[str, Any]]:
    """Rank all customers across an entire enterprise portfolio by recovery urgency and financial impact.

    Args:
        customers: List of customer dictionaries or models.
        invoices: All invoices in the workspace.
        payments: All payments in the workspace.
        subscriptions: All subscriptions in the workspace.
        reference_date: Contextual evaluation date.

    Returns:
        List of AgenticActionReport dictionaries sorted by Priority Tier, Revenue at Risk, and Churn Risk.
    """
    return AutonomousRecoveryAgent.rank_portfolio(
        customers=customers,
        invoices=invoices,
        payments=payments,
        subscriptions=subscriptions,
        reference_date=reference_date,
    )
