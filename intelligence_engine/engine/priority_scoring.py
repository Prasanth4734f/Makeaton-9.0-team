"""Priority scoring engine for Revora Intelligence Engine.

Computes deterministic, explainable priority scores (0-100) and tiers
(CRITICAL, HIGH, MEDIUM, LOW) across payment, renewal, and billing risks.
"""

from typing import Any, Dict, List, Tuple
from intelligence_engine.schemas.intelligence_schema import PriorityLevel


def classify_priority(score: int) -> PriorityLevel:
    """Map 0-100 integer score into deterministic PriorityLevel."""
    if score >= 80:
        return PriorityLevel.CRITICAL
    elif score >= 60:
        return PriorityLevel.HIGH
    elif score >= 30:
        return PriorityLevel.MEDIUM
    else:
        return PriorityLevel.LOW


class PriorityScorer:
    """Calculates deterministic scores with transparent factor breakdowns."""

    @classmethod
    def score_payment_risk(
        cls,
        days_overdue: int,
        outstanding_amount: float,
        total_amount: float,
    ) -> Dict[str, Any]:
        """Score payment risk on overdue or outstanding invoices.

        Scale: 0-100.
        """
        days = max(0, int(days_overdue))
        out_amt = max(0.0, float(outstanding_amount))
        tot_amt = max(out_amt, float(total_amount))
        unpaid_ratio = (out_amt / tot_amt) if tot_amt > 0 else 1.0

        # 1. Overdue days score (0 to 35)
        if days > 30:
            days_score = 35
        elif days >= 15:
            days_score = 30
        elif days >= 10:
            days_score = 25
        elif days >= 5:
            days_score = 20
        elif days >= 1:
            days_score = 15
        else:
            days_score = 5

        # 2. Outstanding amount score (0 to 35)
        if out_amt >= 100000:
            amt_score = 35
        elif out_amt >= 40000:
            amt_score = 30
        elif out_amt >= 20000:
            amt_score = 20
        elif out_amt >= 10000:
            amt_score = 15
        elif out_amt >= 5000:
            amt_score = 10
        else:
            amt_score = 5

        # 3. Revenue value / unpaid ratio score (0 to 15)
        if unpaid_ratio >= 0.9:
            ratio_score = 15
        elif unpaid_ratio >= 0.5:
            ratio_score = 10
        else:
            ratio_score = 5

        # 4. Urgency factor score (0 to 15)
        if days >= 10 and out_amt >= 25000:
            urgency_score = 15
        elif days >= 5 and out_amt >= 10000:
            urgency_score = 10
        elif days >= 1:
            urgency_score = 5
        else:
            urgency_score = 0

        raw_score = days_score + amt_score + ratio_score + urgency_score
        clamped_score = max(0, min(100, raw_score))
        priority = classify_priority(clamped_score)

        reasoning: List[str] = []
        if days > 0:
            reasoning.append(f"Invoice is overdue by {days} day(s)")
        else:
            reasoning.append("Invoice is due today")

        if out_amt >= 40000:
            reasoning.append(f"High outstanding balance of ₹{out_amt:,.2f}")
        else:
            reasoning.append(f"Outstanding balance of ₹{out_amt:,.2f}")

        if unpaid_ratio >= 0.9:
            reasoning.append("Entire invoice amount remains completely unpaid")

        return {
            "score": clamped_score,
            "priority": priority.value,
            "score_breakdown": {
                "overdue_days_score": days_score,
                "outstanding_amount_score": amt_score,
                "revenue_value_score": ratio_score,
                "urgency_score": urgency_score,
            },
            "reasoning": reasoning,
        }

    @classmethod
    def score_renewal_risk(
        cls,
        days_until_expiry: int,
        subscription_value: float,
    ) -> Dict[str, Any]:
        """Score renewal urgency and contract risk for expiring subscriptions.

        Scale: 0-100.
        """
        days = int(days_until_expiry)
        val = max(0.0, float(subscription_value))

        # 1. Expiry proximity score (0 to 35)
        if days < 0:
            prox_score = 35
        elif days == 0:
            prox_score = 35
        elif days <= 3:
            prox_score = 30
        elif days <= 7:
            prox_score = 25
        elif days <= 14:
            prox_score = 18
        elif days <= 30:
            prox_score = 12
        else:
            prox_score = 5

        # 2. Subscription value score (0 to 35)
        if val >= 100000:
            val_score = 35
        elif val >= 50000:
            val_score = 25
        elif val >= 20000:
            val_score = 15
        elif val >= 5000:
            val_score = 10
        else:
            val_score = 5

        # 3. Urgency factor score (0 to 15)
        if days <= 7 and val >= 50000:
            urgency_score = 15
        elif days <= 14 and val >= 20000:
            urgency_score = 10
        elif days <= 30:
            urgency_score = 5
        else:
            urgency_score = 0

        raw_score = prox_score + val_score + urgency_score
        clamped_score = max(0, min(100, raw_score))
        priority = classify_priority(clamped_score)

        reasoning: List[str] = []
        if days < 0:
            reasoning.append(f"Subscription expired {abs(days)} day(s) ago without confirmed renewal")
        elif days == 0:
            reasoning.append("Subscription expires today")
        else:
            reasoning.append(f"Subscription contract expires in {days} day(s)")

        if val >= 100000:
            reasoning.append(f"High-value annual subscription valued at ₹{val:,.2f}")
        else:
            reasoning.append(f"Subscription contract valued at ₹{val:,.2f}")

        return {
            "score": clamped_score,
            "priority": priority.value,
            "score_breakdown": {
                "expiry_proximity_score": prox_score,
                "subscription_value_score": val_score,
                "urgency_score": urgency_score,
            },
            "reasoning": reasoning,
        }

    @classmethod
    def score_billing_risk(
        cls,
        days_billing_overdue: int,
        potential_revenue: float,
    ) -> Dict[str, Any]:
        """Score billing risk for active subscriptions with missing invoices.

        Scale: 0-100.
        """
        days = max(0, int(days_billing_overdue))
        val = max(0.0, float(potential_revenue))

        # 1. Days billing overdue score (0 to 35)
        if days >= 14:
            days_score = 30
        elif days >= 7:
            days_score = 25
        elif days >= 3:
            days_score = 18
        elif days >= 1:
            days_score = 12
        else:
            days_score = 8

        # 2. Revenue value score (0 to 35)
        if val >= 50000:
            val_score = 30
        elif val >= 20000:
            val_score = 20
        elif val >= 10000:
            val_score = 15
        else:
            val_score = 10

        # 3. Urgency factor score (0 to 15)
        if days >= 7:
            urgency_score = 10
        elif days >= 1:
            urgency_score = 5
        else:
            urgency_score = 2

        raw_score = days_score + val_score + urgency_score
        clamped_score = max(0, min(100, raw_score))
        priority = classify_priority(clamped_score)

        reasoning: List[str] = []
        if days > 0:
            reasoning.append(f"Billing cycle has been overdue for {days} day(s)")
        else:
            reasoning.append("Billing cycle is due today")

        reasoning.append(f"Unbilled service delivery risks ₹{val:,.2f} in deferred revenue")

        return {
            "score": clamped_score,
            "priority": priority.value,
            "score_breakdown": {
                "billing_delay_score": days_score,
                "revenue_leakage_score": val_score,
                "urgency_score": urgency_score,
            },
            "reasoning": reasoning,
        }


def score_payment_risk(days_overdue: int, outstanding_amount: float, total_amount: float) -> Dict[str, Any]:
    return PriorityScorer.score_payment_risk(days_overdue, outstanding_amount, total_amount)


def score_renewal_risk(days_until_expiry: int, subscription_value: float) -> Dict[str, Any]:
    return PriorityScorer.score_renewal_risk(days_until_expiry, subscription_value)


def score_billing_risk(days_billing_overdue: int, potential_revenue: float) -> Dict[str, Any]:
    return PriorityScorer.score_billing_risk(days_billing_overdue, potential_revenue)
