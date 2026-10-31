"""Renewal detector component.

Analyzes subscription contracts to identify upcoming expirations,
recent expirations, and renewals requiring immediate retention action.
"""

from datetime import date
from typing import Any, Dict, List, Optional, Union

from intelligence_engine.adapters.data_adapter import (
    normalize_subscription,
    parse_date,
)
from intelligence_engine.schemas.intelligence_schema import (
    RenewalRiskLevel,
    SubscriptionRecord,
)


class RenewalDetector:
    """Detects subscriptions reaching contract renewal and expiry deadlines."""

    @classmethod
    def detect(
        cls,
        subscriptions: List[Union[Dict[str, Any], SubscriptionRecord]],
        reference_date: Optional[Union[str, date]] = None,
    ) -> List[Dict[str, Any]]:
        """Evaluate subscriptions for renewal and expiration urgency.

        Args:
            subscriptions: List of subscription records or dicts.
            reference_date: Current reference date for evaluation.

        Returns:
            List of detected renewal situations with risk classification.
        """
        ref_dt = parse_date(reference_date) or date.today()
        results: List[Dict[str, Any]] = []

        for item in subscriptions:
            sub = (
                item
                if isinstance(item, SubscriptionRecord)
                else normalize_subscription(item)
            )

            # Skip explicitly closed subscriptions unless expired recently
            if sub.status.upper() == "CLOSED":
                continue

            exp_dt = parse_date(sub.expiry_date)
            if not exp_dt:
                continue

            days_until = (exp_dt - ref_dt).days

            # Classify into standard windows
            if days_until < 0:
                # Expired recently (within past 30 days) or still marked active
                if days_until >= -60 or sub.status.upper() == "ACTIVE":
                    window = RenewalRiskLevel.EXPIRED.value
                    renewal_risk = "CRITICAL"
                else:
                    continue  # Old inactive closed contract
            elif days_until == 0:
                window = RenewalRiskLevel.EXPIRES_TODAY.value
                renewal_risk = "CRITICAL"
            elif days_until <= 3:
                window = RenewalRiskLevel.WITHIN_3_DAYS.value
                renewal_risk = "CRITICAL"
            elif days_until <= 7:
                window = RenewalRiskLevel.WITHIN_7_DAYS.value
                renewal_risk = "HIGH"
            elif days_until <= 30:
                window = RenewalRiskLevel.WITHIN_30_DAYS.value
                renewal_risk = "MEDIUM"
            else:
                window = RenewalRiskLevel.SAFE.value
                renewal_risk = "LOW"
                continue  # Safe subscriptions do not create renewal alerts

            sub_val = float(sub.total_amount)
            if sub_val <= 0.0:
                sub_val = float(sub.unit_price) * float(sub.quantity)

            results.append(
                {
                    "subscription_id": sub.subscription_id,
                    "customer_id": sub.customer_id,
                    "customer_name": sub.customer_name,
                    "expiry_date": sub.expiry_date,
                    "days_until_expiry": days_until,
                    "subscription_value": sub_val,
                    "renewal_risk": renewal_risk,
                    "window": window,
                    "status": sub.status,
                }
            )

        return results


def detect_renewals(
    subscriptions: List[Union[Dict[str, Any], SubscriptionRecord]],
    reference_date: Optional[Union[str, date]] = None,
) -> List[Dict[str, Any]]:
    """Functional convenience wrapper for RenewalDetector.detect."""
    return RenewalDetector.detect(subscriptions, reference_date)
