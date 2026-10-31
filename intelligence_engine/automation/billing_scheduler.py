"""Billing scheduler component.

Determines whether a subscription is due or overdue for billing
based on its status and next billing date.
"""

from datetime import date, datetime
from typing import Any, Dict, Optional, Union

from intelligence_engine.adapters.data_adapter import normalize_date, parse_date


class BillingScheduler:
    """Evaluates subscription billing schedule and eligibility."""

    @staticmethod
    def check_schedule(
        subscription: Union[Dict[str, Any], Any],
        reference_date: Optional[Union[str, date]] = None,
    ) -> Dict[str, Any]:
        """Check if subscription is due for billing.

        Args:
            subscription: Subscription dictionary or record object.
            reference_date: Reference date for calculation (default: today).

        Returns:
            Dict containing billing_due, billing_status, days_difference, and reason.
        """
        if reference_date is None:
            ref_dt = date.today()
        elif isinstance(reference_date, str):
            ref_dt = parse_date(reference_date) or date.today()
        else:
            ref_dt = reference_date

        sub_id = (
            subscription.get("subscription_id")
            if isinstance(subscription, dict)
            else getattr(subscription, "subscription_id", "UNKNOWN")
        )
        status = (
            subscription.get("status")
            if isinstance(subscription, dict)
            else getattr(subscription, "status", "UNKNOWN")
        )
        status = str(status).strip().upper()

        # Rule 1: Normally only ACTIVE subscriptions can be billed
        if status != "ACTIVE":
            return {
                "subscription_id": sub_id,
                "billing_due": False,
                "billing_status": "INELIGIBLE",
                "days_difference": 0,
                "reason": f"Subscription status is {status}; only ACTIVE subscriptions can be billed",
            }

        next_date_raw = (
            subscription.get("next_billing_date")
            if isinstance(subscription, dict)
            else getattr(subscription, "next_billing_date", None)
        )
        next_dt = parse_date(next_date_raw)

        if not next_dt:
            return {
                "subscription_id": sub_id,
                "billing_due": False,
                "billing_status": "NOT_DUE",
                "days_difference": 0,
                "reason": "No valid next billing date set on subscription",
            }

        delta_days = (ref_dt - next_dt).days

        if delta_days == 0:
            return {
                "subscription_id": sub_id,
                "billing_due": True,
                "billing_status": "DUE",
                "days_difference": 0,
                "reason": "Next billing date is today",
            }
        elif delta_days > 0:
            return {
                "subscription_id": sub_id,
                "billing_due": True,
                "billing_status": "OVERDUE",
                "days_difference": delta_days,
                "reason": f"Billing is overdue by {delta_days} day(s) (due {next_dt.strftime('%Y-%m-%d')})",
            }
        else:
            days_until = abs(delta_days)
            return {
                "subscription_id": sub_id,
                "billing_due": False,
                "billing_status": "NOT_DUE",
                "days_difference": delta_days,
                "reason": f"Billing not due yet; scheduled in {days_until} day(s) ({next_dt.strftime('%Y-%m-%d')})",
            }


def check_billing_schedule(
    subscription: Union[Dict[str, Any], Any],
    reference_date: Optional[Union[str, date]] = None,
) -> Dict[str, Any]:
    """Functional convenience wrapper for BillingScheduler.check_schedule."""
    return BillingScheduler.check_schedule(subscription, reference_date)
