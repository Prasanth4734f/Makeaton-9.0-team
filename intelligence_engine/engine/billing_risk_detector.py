"""Billing risk detector component.

Identifies active subscriptions with passed billing dates and missing invoices,
preventing revenue leakage from unbilled service delivery.
"""

from datetime import date
from typing import Any, Dict, List, Optional, Union

from intelligence_engine.adapters.data_adapter import (
    normalize_invoice,
    normalize_subscription,
    parse_date,
)
from intelligence_engine.automation.duplicate_checker import DuplicateChecker
from intelligence_engine.schemas.intelligence_schema import (
    InvoiceRecord,
    SubscriptionRecord,
)


class BillingRiskDetector:
    """Detects active subscriptions that are due or overdue for billing with no generated invoice."""

    @classmethod
    def detect(
        cls,
        subscriptions: List[Union[Dict[str, Any], SubscriptionRecord]],
        invoices: Optional[List[Union[Dict[str, Any], InvoiceRecord]]] = None,
        reference_date: Optional[Union[str, date]] = None,
    ) -> List[Dict[str, Any]]:
        """Identify subscriptions with overdue billing dates and no corresponding invoice.

        Args:
            subscriptions: List of subscriptions to examine.
            invoices: All invoices in the system to verify against.
            reference_date: Current reference date for evaluation.

        Returns:
            List of detected billing risk evaluation dicts.
        """
        ref_dt = parse_date(reference_date) or date.today()
        inv_list = invoices or []
        results: List[Dict[str, Any]] = []

        for item in subscriptions:
            sub = (
                item
                if isinstance(item, SubscriptionRecord)
                else normalize_subscription(item)
            )

            if sub.status.upper() != "ACTIVE":
                continue

            next_dt = parse_date(sub.next_billing_date)
            if not next_dt:
                continue

            days_overdue = (ref_dt - next_dt).days
            if days_overdue < 0:
                # Billing not yet due
                continue

            # Check if a valid invoice was already generated for this billing date / cycle
            dup_check = DuplicateChecker.check_duplicate(
                subscription_id=sub.subscription_id,
                billing_period_start=sub.next_billing_date,
                existing_invoices=inv_list,
            )

            if dup_check["is_duplicate"]:
                # An invoice exists, so billing was executed
                continue

            # No invoice exists for this due or overdue billing date -> RISK DETECTED
            val = float(sub.total_amount)
            if val <= 0.0:
                val = float(sub.unit_price) * float(sub.quantity)

            if days_overdue == 0:
                reason = "Subscription is due for billing today, but no invoice has been generated yet"
            else:
                reason = f"Active subscription billing date passed {days_overdue} day(s) ago with no generated invoice"

            results.append(
                {
                    "subscription_id": sub.subscription_id,
                    "customer_id": sub.customer_id,
                    "customer_name": sub.customer_name,
                    "next_billing_date": sub.next_billing_date,
                    "days_billing_overdue": max(0, days_overdue),
                    "potential_revenue_amount": val,
                    "reason": reason,
                }
            )

        return results


def detect_billing_risks(
    subscriptions: List[Union[Dict[str, Any], SubscriptionRecord]],
    invoices: Optional[List[Union[Dict[str, Any], InvoiceRecord]]] = None,
    reference_date: Optional[Union[str, date]] = None,
) -> List[Dict[str, Any]]:
    """Functional convenience wrapper for BillingRiskDetector.detect."""
    return BillingRiskDetector.detect(subscriptions, invoices, reference_date)
