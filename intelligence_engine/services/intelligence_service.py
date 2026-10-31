"""Main intelligence service for Revora.

Primary integration boundary for Sai's backend.
Provides clean, pure-Python APIs to analyze revenue risks and execute billing automation.
"""

from datetime import date
from typing import Any, Dict, List, Optional, Union

from intelligence_engine.adapters.data_adapter import DataAdapter, parse_date
from intelligence_engine.automation.billing_processor import BillingProcessor
from intelligence_engine.engine.revenue_analyzer import RevenueAnalyzer
from intelligence_engine.schemas.intelligence_schema import (
    IntelligenceReport,
    PriorityLevel,
    RevenueSummary,
)


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
