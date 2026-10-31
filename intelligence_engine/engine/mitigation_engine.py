"""Mitigation planning and financial impact estimation engine for Revora.

Formulates deterministic, actionable mitigation strategies (DUNNING_NOTICE, PAYMENT_RECOVERY,
RENEWAL_RESCUE, RETENTION_OUTREACH, MANUAL_REVIEW, MONITOR) and estimates revenue at risk,
projected recovery, and protected recurring revenue.
"""

from datetime import date
from typing import Any, Dict, List, Optional, Union

from intelligence_engine.adapters.data_adapter import (
    normalize_invoice,
    normalize_subscription,
    parse_date,
)
from intelligence_engine.schemas.intelligence_schema import (
    ChurnLevel,
    FinancialImpact,
    InvoiceRecord,
    MitigationPlan,
    PlanType,
    PriorityLevel,
    SignalType,
    SubscriptionRecord,
)


class MitigationEngine:
    """Generates structured mitigation plans and financial impact projections."""

    @classmethod
    def generate_plan(
        cls,
        churn_assessment: Dict[str, Any],
        subscriptions: Optional[List[Union[Dict[str, Any], SubscriptionRecord]]] = None,
        invoices: Optional[List[Union[Dict[str, Any], InvoiceRecord]]] = None,
        reference_date: Optional[Union[str, date]] = None,
    ) -> Dict[str, Any]:
        """Formulate Next Best Action and financial impact from churn assessment.

        Args:
            churn_assessment: Output from ChurnPredictor.evaluate().
            subscriptions: List of customer subscriptions.
            invoices: List of customer invoices.
            reference_date: Contextual evaluation date.

        Returns:
            Dict containing 'mitigation_plan' and 'financial_impact'.
        """
        ref_dt = parse_date(reference_date) or date.today()
        ref_str = ref_dt.strftime("%Y-%m-%d")

        cust_id = churn_assessment.get("customer_id", "1")
        cust_name = churn_assessment.get("customer_name", "Customer")
        churn_prob = churn_assessment.get("probability", 0)
        churn_level = churn_assessment.get("level", ChurnLevel.LOW.value)
        signals = churn_assessment.get("signals", [])
        metrics = churn_assessment.get("metrics", {})

        inv_list: List[InvoiceRecord] = [
            item if isinstance(item, InvoiceRecord) else normalize_invoice(item)
            for item in (invoices or [])
        ]
        sub_list: List[SubscriptionRecord] = [
            item if isinstance(item, SubscriptionRecord) else normalize_subscription(item)
            for item in (subscriptions or [])
        ]

        total_overdue = float(metrics.get("total_overdue_amount", 0.0))
        max_overdue_days = int(metrics.get("max_overdue_days", 0))
        failed_count = int(metrics.get("failed_payments_count", 0))
        active_sub_value = float(metrics.get("active_subscription_value", 0.0))
        days_until_renewal = metrics.get("days_until_renewal")

        # Fallback calculation if metrics not fully populated
        if total_overdue == 0.0:
            for inv in inv_list:
                if inv.status in ("OVERDUE", "UNPAID") or (inv.status != "PAID" and inv.due_date and parse_date(inv.due_date) and parse_date(inv.due_date) < ref_dt):
                    total_overdue += (inv.total_amount - inv.paid_amount)

        if active_sub_value == 0.0:
            for sub in sub_list:
                if sub.status in ("ACTIVE", "TRIALING"):
                    active_sub_value += float(sub.total_amount or (sub.unit_price * sub.quantity) or 0.0)

        # ---------------------------------------------------------------------
        # 1. Financial Impact Estimation
        # ---------------------------------------------------------------------
        # Potential revenue impact: immediate overdue & uncollected balances
        potential_revenue_impact = round(max(0.0, total_overdue), 2)

        # Projected revenue protected: annualized or contract value of active subscriptions
        # If active subscriptions exist, that's what is saved if churn is averted.
        projected_revenue_protected = round(max(0.0, active_sub_value), 2)

        # ---------------------------------------------------------------------
        # 2. Strategy & Plan Determination
        # ---------------------------------------------------------------------
        # Decision tree evaluates:
        # A. Multiple payment failures or severe disputes -> MANUAL_REVIEW
        # B. High/Critical overdue invoice (> 14 days or high amount) -> PAYMENT_RECOVERY
        # C. Short overdue invoice (<= 14 days) -> DUNNING_NOTICE
        # D. Expiring subscription without severe overdue -> RENEWAL_RESCUE
        # E. Elevated churn without invoices/renewals -> RETENTION_OUTREACH
        # F. Low churn & healthy -> MONITOR

        has_repeated_failures = failed_count >= 2
        has_severe_overdue = total_overdue > 0 and (max_overdue_days >= 15 or total_overdue >= 50000)
        has_moderate_overdue = total_overdue > 0 and not has_severe_overdue
        has_imminent_renewal = (days_until_renewal is not None) and (days_until_renewal <= 30)

        if has_repeated_failures:
            plan_type = PlanType.MANUAL_REVIEW
            priority = PriorityLevel.CRITICAL if churn_prob >= 75 else PriorityLevel.HIGH
            reason = (
                f"Customer encountered {failed_count} recorded payment failures with "
                f"INR {total_overdue:,.2f} pending settlement. Automated retries risk transaction fatigue."
            )
            recommended_action = (
                "Assign financial risk specialist for manual account review, payment method "
                "reconciliation, and direct client reconciliation."
            )
            confidence = 0.94
            recovery_rate = 0.75
            execution_preview = {
                "channel": "INTERNAL_FINANCE_ESCALATION",
                "assigned_team": "Revenue Operations & Risk",
                "action_type": "MANUAL_RECONCILIATION",
                "target_customer": cust_name,
                "review_deadline_days": 2,
            }

        elif has_severe_overdue:
            plan_type = PlanType.PAYMENT_RECOVERY
            priority = PriorityLevel.CRITICAL if max_overdue_days >= 30 or total_overdue >= 50000 else PriorityLevel.HIGH
            reason = (
                f"Invoice overdue by {max_overdue_days} days with outstanding balance of "
                f"INR {total_overdue:,.2f}. High probability of revenue leakage if unaddressed."
            )
            recommended_action = (
                "Execute prioritized payment recovery workflow with accelerated retry, direct "
                "settlement link, and credit risk hold notification."
            )
            confidence = 0.92
            recovery_rate = 0.85
            execution_preview = {
                "channel": "DIRECT_PAYMENT_GATEWAY_LINK",
                "gateway_retry_scheduled": True,
                "target_amount": total_overdue,
                "grace_period_days": 3,
                "escalation_policy": "SUSPEND_PROVISIONING_AFTER_72H",
            }

        elif has_moderate_overdue:
            plan_type = PlanType.DUNNING_NOTICE
            priority = PriorityLevel.HIGH if max_overdue_days >= 7 else PriorityLevel.MEDIUM
            reason = (
                f"Invoice overdue by {max_overdue_days} day(s) totaling INR {total_overdue:,.2f}. "
                "Standard settlement period exceeded."
            )
            recommended_action = (
                "Transmit multi-channel dunning reminder with one-click instant settlement link "
                "and upcoming grace window alert."
            )
            confidence = 0.90
            recovery_rate = 0.92
            execution_preview = {
                "channel": "EMAIL_SMS_NOTIFICATION",
                "template_id": "REVORA_DUNNING_SEQUENCE_1",
                "target_amount": total_overdue,
                "grace_period_days": 5,
            }

        elif has_imminent_renewal:
            plan_type = PlanType.RENEWAL_RESCUE
            priority = PriorityLevel.HIGH if (days_until_renewal <= 7 or active_sub_value >= 25000) else PriorityLevel.MEDIUM
            reason = (
                f"Active subscription renewal due in {days_until_renewal} days representing "
                f"INR {active_sub_value:,.2f} in recurring contract value."
            )
            recommended_action = (
                "Deploy proactive renewal rescue campaign with early contract recommitment terms "
                "and customer success check-in."
            )
            confidence = 0.88
            recovery_rate = 0.90
            execution_preview = {
                "channel": "CUSTOMER_SUCCESS_OUTREACH",
                "target_renewal_value": active_sub_value,
                "days_to_expiration": days_until_renewal,
                "incentive_eligible": True,
                "proposed_terms": "Early renewal incentive (5% discount on annual commitment)",
            }

        elif churn_prob >= 50:
            plan_type = PlanType.RETENTION_OUTREACH
            priority = PriorityLevel.HIGH if churn_prob >= 70 else PriorityLevel.MEDIUM
            reason = (
                f"Customer exhibits elevated churn probability of {churn_prob}% based on historical "
                "activity patterns and contract posture."
            )
            recommended_action = (
                "Initiate high-touch retention outreach with account executive engagement and "
                "product value realization review."
            )
            confidence = 0.86
            recovery_rate = 0.80
            execution_preview = {
                "channel": "EXECUTIVE_RELATIONSHIP_REVIEW",
                "recommended_assignee": "Senior Customer Success Manager",
                "agenda": "Usage review, SLA satisfaction, and contract realignment",
            }

        else:
            plan_type = PlanType.MONITOR
            priority = PriorityLevel.LOW
            reason = (
                f"Customer maintains healthy account standing with churn probability of {churn_prob}%. "
                "No overdue invoices or immediate renewal hazards detected."
            )
            recommended_action = "Maintain regular automated monitoring and scheduled lifecycle notifications."
            confidence = 0.96
            recovery_rate = 1.00
            execution_preview = {
                "channel": "AUTOMATED_MONITOR",
                "next_audit_date": (ref_dt.replace(day=min(ref_dt.day, 28))).strftime("%Y-%m-%d"),
                "status": "HEALTHY",
            }

        # Projected recovery amount
        projected_recovery = round(potential_revenue_impact * recovery_rate, 2)

        financial_impact = FinancialImpact(
            potential_revenue_impact=potential_revenue_impact,
            projected_recovery=projected_recovery,
            projected_revenue_protected=projected_revenue_protected,
            currency="INR",
        )

        mitigation_plan = MitigationPlan(
            plan_type=plan_type,
            recommended_action=recommended_action,
            reason=reason,
            priority=priority,
            confidence=confidence,
            execution_preview=execution_preview,
        )

        return {
            "mitigation_plan": mitigation_plan.model_dump(),
            "financial_impact": financial_impact.model_dump(),
        }
