"""Revenue analyzer component.

Synthesizes detector findings across payments, renewals, and billing cycles,
calculates explainable priority scores, and generates structured business action items.
"""

from datetime import date
from typing import Any, Dict, List, Optional, Union

from intelligence_engine.adapters.data_adapter import (
    DataAdapter,
    parse_date,
)
from intelligence_engine.engine.billing_risk_detector import BillingRiskDetector
from intelligence_engine.engine.overdue_detector import OverdueDetector
from intelligence_engine.engine.priority_scoring import (
    PriorityScorer,
    classify_priority,
)
from intelligence_engine.engine.renewal_detector import RenewalDetector
from intelligence_engine.schemas.intelligence_schema import (
    ActionCategory,
    ActionItem,
    InvoiceRecord,
    PriorityLevel,
    SubscriptionRecord,
)

PRIORITY_RANK = {
    PriorityLevel.CRITICAL.value: 4,
    PriorityLevel.HIGH.value: 3,
    PriorityLevel.MEDIUM.value: 2,
    PriorityLevel.LOW.value: 1,
}


class RevenueAnalyzer:
    """Analyzes business records to produce sorted actionable intelligence items."""

    @classmethod
    def analyze(
        cls,
        subscriptions: List[Union[Dict[str, Any], SubscriptionRecord]],
        invoices: List[Union[Dict[str, Any], InvoiceRecord]],
        reference_date: Optional[Union[str, date]] = None,
    ) -> List[Dict[str, Any]]:
        """Run all detectors, score findings, and generate structured action items.

        Args:
            subscriptions: List of subscriptions (normalized or raw).
            invoices: List of invoices (normalized or raw).
            reference_date: Date context for analysis (defaults to today).

        Returns:
            List of prioritized ActionItem dictionaries.
        """
        ref_dt = parse_date(reference_date) or date.today()
        ref_str = ref_dt.strftime("%Y-%m-%d")

        actions: List[Dict[str, Any]] = []

        # ---------------------------------------------------------------------
        # 1. Detect Payment Risks (Overdue / Outstanding Invoices)
        # ---------------------------------------------------------------------
        overdue_items = OverdueDetector.detect(invoices, reference_date=ref_dt)
        for item in overdue_items:
            # We only generate action items if there's an outstanding balance
            if item["outstanding_amount"] <= 0:
                continue

            score_res = PriorityScorer.score_payment_risk(
                days_overdue=item["days_overdue"],
                outstanding_amount=item["outstanding_amount"],
                total_amount=item["total_amount"],
            )

            inv_id = item["invoice_id"]
            cust = item["customer_name"]
            out_amt = item["outstanding_amount"]
            days = item["days_overdue"]

            if days > 0:
                title = "High-value payment overdue" if out_amt >= 25000 else "Payment overdue"
                reason = f"Invoice {inv_id} is overdue by {days} days with ₹{out_amt:,.2f} outstanding."
                action = "Contact the customer immediately and initiate payment follow-up."
            else:
                title = "Payment due today"
                reason = f"Invoice {inv_id} is due for payment today with ₹{out_amt:,.2f} outstanding."
                action = "Send payment reminder to ensure timely settlement."

            actions.append(
                {
                    "priority": score_res["priority"],
                    "score": score_res["score"],
                    "category": ActionCategory.PAYMENT_RISK.value,
                    "title": title,
                    "reason": reason,
                    "recommended_action": action,
                    "related_entity_type": "invoice",
                    "related_entity_id": inv_id,
                    "customer_name": cust,
                    "amount": round(out_amt, 2),
                    "created_at": ref_str,
                    "score_breakdown": score_res["score_breakdown"],
                    "reasoning": score_res["reasoning"],
                }
            )

        # ---------------------------------------------------------------------
        # 2. Detect Renewal Risks (Expiring Subscriptions)
        # ---------------------------------------------------------------------
        renewal_items = RenewalDetector.detect(subscriptions, reference_date=ref_dt)
        for item in renewal_items:
            sub_id = item["subscription_id"]
            cust = item["customer_name"]
            sub_val = item["subscription_value"]
            days = item["days_until_expiry"]

            score_res = PriorityScorer.score_renewal_risk(
                days_until_expiry=days,
                subscription_value=sub_val,
            )

            if days < 0:
                title = "Subscription expired — retention risk"
                reason = f"Subscription {sub_id} expired {abs(days)} day(s) ago without confirmed renewal."
                action = "Reach out immediately to discuss contract renewal or prevent account churn."
            elif days == 0:
                title = "Subscription expires today"
                reason = f"Subscription {sub_id} expires today (Contract value: ₹{sub_val:,.2f})."
                action = "Contact customer to finalize renewal terms before service interruption."
            else:
                title = "Upcoming subscription renewal"
                reason = f"Subscription expires in {days} days. Annual contract value: ₹{sub_val:,.2f}."
                action = "Contact customer before expiry to secure renewal commitment."

            actions.append(
                {
                    "priority": score_res["priority"],
                    "score": score_res["score"],
                    "category": ActionCategory.RENEWAL_RISK.value,
                    "title": title,
                    "reason": reason,
                    "recommended_action": action,
                    "related_entity_type": "subscription",
                    "related_entity_id": sub_id,
                    "customer_name": cust,
                    "amount": round(sub_val, 2),
                    "created_at": ref_str,
                    "score_breakdown": score_res["score_breakdown"],
                    "reasoning": score_res["reasoning"],
                }
            )

        # ---------------------------------------------------------------------
        # 3. Detect Billing Risks (Active Unbilled Subscriptions)
        # ---------------------------------------------------------------------
        billing_items = BillingRiskDetector.detect(
            subscriptions=subscriptions,
            invoices=invoices,
            reference_date=ref_dt,
        )
        for item in billing_items:
            sub_id = item["subscription_id"]
            cust = item["customer_name"]
            val = item["potential_revenue_amount"]
            days = item["days_billing_overdue"]

            score_res = PriorityScorer.score_billing_risk(
                days_billing_overdue=days,
                potential_revenue=val,
            )

            if days > 0:
                title = "Missed billing cycle — unbilled revenue"
                reason = f"Subscription billing date passed {days} days ago. No valid invoice exists."
                action = "Generate and review the pending invoice immediately."
            else:
                title = "Billing due today"
                reason = "Subscription is due for billing today with no invoice yet issued."
                action = "Trigger billing cycle and generate invoice."

            actions.append(
                {
                    "priority": score_res["priority"],
                    "score": score_res["score"],
                    "category": ActionCategory.BILLING_RISK.value,
                    "title": title,
                    "reason": reason,
                    "recommended_action": action,
                    "related_entity_type": "subscription",
                    "related_entity_id": sub_id,
                    "customer_name": cust,
                    "amount": round(val, 2),
                    "created_at": ref_str,
                    "score_breakdown": score_res["score_breakdown"],
                    "reasoning": score_res["reasoning"],
                }
            )

        # ---------------------------------------------------------------------
        # 4. Deterministic Sort: Priority Tier (CRITICAL -> HIGH -> MEDIUM -> LOW)
        #    then Highest Score First, then Highest Amount First
        # ---------------------------------------------------------------------
        actions.sort(
            key=lambda x: (
                PRIORITY_RANK.get(x["priority"], 0),
                x["score"],
                x["amount"],
            ),
            reverse=True,
        )

        # 5. Assign Deterministic IDs (ACT-001, ACT-002, ...)
        for idx, act in enumerate(actions, start=1):
            act["id"] = f"ACT-{idx:03d}"

        return actions


def analyze_revenue_actions(
    subscriptions: List[Union[Dict[str, Any], SubscriptionRecord]],
    invoices: List[Union[Dict[str, Any], InvoiceRecord]],
    reference_date: Optional[Union[str, date]] = None,
) -> List[Dict[str, Any]]:
    """Functional convenience wrapper for RevenueAnalyzer.analyze."""
    return RevenueAnalyzer.analyze(subscriptions, invoices, reference_date)
