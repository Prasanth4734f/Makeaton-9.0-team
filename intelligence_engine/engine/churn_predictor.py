"""Customer churn and retention risk predictor for Revora.

Computes deterministic, explainable churn probabilities (0-100) and extracts
structured risk signals based on real business telemetry (invoices, payments, subscriptions).
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
    InvoiceRecord,
    PaymentRecord,
    RiskSignal,
    SignalType,
    SubscriptionRecord,
)


def classify_churn_level(probability: int) -> ChurnLevel:
    """Map 0-100 churn probability to deterministic ChurnLevel."""
    if probability >= 80:
        return ChurnLevel.CRITICAL
    elif probability >= 60:
        return ChurnLevel.HIGH
    elif probability >= 30:
        return ChurnLevel.MEDIUM
    else:
        return ChurnLevel.LOW


class ChurnPredictor:
    """Evaluates customer business health and calculates explainable churn risk."""

    @classmethod
    def evaluate(
        cls,
        customer: Optional[Union[Dict[str, Any], Any]] = None,
        invoices: Optional[List[Union[Dict[str, Any], InvoiceRecord]]] = None,
        payments: Optional[List[Union[Dict[str, Any], PaymentRecord]]] = None,
        subscriptions: Optional[List[Union[Dict[str, Any], SubscriptionRecord]]] = None,
        reference_date: Optional[Union[str, date]] = None,
    ) -> Dict[str, Any]:
        """Analyze business telemetry and return deterministic churn probability with signals.

        Args:
            customer: Customer record or dictionary.
            invoices: All invoices for this customer.
            payments: All payments associated with this customer's invoices.
            subscriptions: All subscriptions for this customer.
            reference_date: Reference date context (defaults to today).

        Returns:
            Dict containing:
                probability: int (0-100)
                level: ChurnLevel
                signals: List[Dict[str, Any]] (RiskSignal items)
                score_breakdown: Dict[str, int]
                metrics: Dict[str, Any]
        """
        ref_dt = parse_date(reference_date) or date.today()
        ref_str = ref_dt.strftime("%Y-%m-%d")

        cust_dict = customer if isinstance(customer, dict) else (
            {"id": getattr(customer, "id", None), "name": getattr(customer, "name", "Customer")}
            if customer else {}
        )
        cust_id = str(cust_dict.get("id") or cust_dict.get("customer_id") or "1")
        cust_name = str(cust_dict.get("name") or cust_dict.get("customer_name") or f"Customer #{cust_id}")

        inv_list: List[InvoiceRecord] = [
            item if isinstance(item, InvoiceRecord) else normalize_invoice(item)
            for item in (invoices or [])
        ]
        sub_list: List[SubscriptionRecord] = [
            item if isinstance(item, SubscriptionRecord) else normalize_subscription(item)
            for item in (subscriptions or [])
        ]
        pmt_list: List[Dict[str, Any]] = [
            p if isinstance(p, dict) else getattr(p, "__dict__", {})
            for p in (payments or [])
        ]

        signals: List[Dict[str, Any]] = []
        score_breakdown: Dict[str, int] = {
            "invoice_aging": 0,
            "payment_failures_and_delays": 0,
            "outstanding_exposure": 0,
            "renewal_hazard": 0,
        }

        # ---------------------------------------------------------------------
        # 1. Invoice Aging & Overdue Exposure (0 - 35 pts)
        # ---------------------------------------------------------------------
        max_overdue_days = 0
        total_overdue_amount = 0.0
        total_outstanding_amount = 0.0
        total_billed = sum(i.total_amount for i in inv_list) or 0.0

        for inv in inv_list:
            out_amt = float(inv.outstanding_amount or (inv.total_amount - inv.paid_amount))
            if out_amt > 0:
                total_outstanding_amount += out_amt
                due_dt = parse_date(inv.due_date)
                if due_dt:
                    diff = (ref_dt - due_dt).days
                    if diff > 0:
                        total_overdue_amount += out_amt
                        if diff > max_overdue_days:
                            max_overdue_days = diff

        aging_score = 0
        if max_overdue_days >= 30:
            aging_score = 35
            signals.append({
                "type": SignalType.OVERDUE_INVOICE.value,
                "severity": "CRITICAL",
                "description": f"Customer has severe invoice aging with invoices overdue by {max_overdue_days} days (₹{total_overdue_amount:,.2f} at risk).",
                "detected_at": ref_str,
                "metric_value": float(max_overdue_days),
            })
        elif max_overdue_days >= 15:
            aging_score = 25
            signals.append({
                "type": SignalType.OVERDUE_INVOICE.value,
                "severity": "HIGH",
                "description": f"Customer invoice is overdue by {max_overdue_days} days with ₹{total_overdue_amount:,.2f} unsettled.",
                "detected_at": ref_str,
                "metric_value": float(max_overdue_days),
            })
        elif max_overdue_days >= 7:
            aging_score = 18
            signals.append({
                "type": SignalType.OVERDUE_INVOICE.value,
                "severity": "MEDIUM",
                "description": f"Invoice overdue by {max_overdue_days} days requiring payment follow-up.",
                "detected_at": ref_str,
                "metric_value": float(max_overdue_days),
            })
        elif max_overdue_days >= 1:
            aging_score = 10
            signals.append({
                "type": SignalType.OVERDUE_INVOICE.value,
                "severity": "LOW",
                "description": f"Invoice passed due date by {max_overdue_days} day(s).",
                "detected_at": ref_str,
                "metric_value": float(max_overdue_days),
            })
        score_breakdown["invoice_aging"] = aging_score

        # ---------------------------------------------------------------------
        # 2. Payment Delay & Failure History (0 - 25 pts)
        # ---------------------------------------------------------------------
        failed_count = sum(
            1 for p in pmt_list
            if str(p.get("status") or "").upper() in ["FAILED", "REJECTED", "ERROR", "FAILURE"]
            or "fail" in str(p.get("notes") or "").lower()
            or "reject" in str(p.get("notes") or "").lower()
        )
        pmt_score = 0
        if failed_count >= 2:
            pmt_score = 25
            signals.append({
                "type": SignalType.PAYMENT_FAILURE.value,
                "severity": "CRITICAL",
                "description": f"Detected {failed_count} repeated transaction rejections indicating payment method failure or account block.",
                "detected_at": ref_str,
                "metric_value": float(failed_count),
            })
        elif failed_count == 1:
            pmt_score = 15
            signals.append({
                "type": SignalType.PAYMENT_FAILURE.value,
                "severity": "HIGH",
                "description": "Previous payment transaction failed and remains unresolved.",
                "detected_at": ref_str,
                "metric_value": float(failed_count),
            })
        elif max_overdue_days >= 10:
            pmt_score = 10
            signals.append({
                "type": SignalType.PAYMENT_DELAY_PATTERN.value,
                "severity": "MEDIUM",
                "description": "Payment delay history observed across billing settlement cycles.",
                "detected_at": ref_str,
                "metric_value": float(max_overdue_days),
            })
        score_breakdown["payment_failures_and_delays"] = pmt_score

        # ---------------------------------------------------------------------
        # 3. Outstanding Revenue Exposure Ratio (0 - 20 pts)
        # ---------------------------------------------------------------------
        out_ratio = (total_outstanding_amount / total_billed) if total_billed > 0 else (1.0 if total_outstanding_amount > 0 else 0.0)
        exposure_score = 0
        if total_outstanding_amount >= 50000 or (out_ratio >= 0.75 and total_outstanding_amount > 0):
            exposure_score = 20
            signals.append({
                "type": SignalType.HIGH_VALUE_EXPOSURE.value,
                "severity": "HIGH",
                "description": f"Substantial financial exposure: ₹{total_outstanding_amount:,.2f} outstanding ({out_ratio * 100:.1f}% of billed total).",
                "detected_at": ref_str,
                "metric_value": float(total_outstanding_amount),
            })
        elif total_outstanding_amount >= 20000 or out_ratio >= 0.40:
            exposure_score = 14
            signals.append({
                "type": SignalType.HIGH_VALUE_EXPOSURE.value,
                "severity": "MEDIUM",
                "description": f"Elevated receivables exposure of ₹{total_outstanding_amount:,.2f}.",
                "detected_at": ref_str,
                "metric_value": float(total_outstanding_amount),
            })
        elif total_outstanding_amount > 0:
            exposure_score = 8
        score_breakdown["outstanding_exposure"] = exposure_score

        # ---------------------------------------------------------------------
        # 4. Subscription Renewal Proximity & Value (0 - 20 pts)
        # ---------------------------------------------------------------------
        renewal_score = 0
        min_renewal_days = 9999
        active_sub_value = 0.0

        for sub in sub_list:
            if sub.status.upper() == "ACTIVE":
                sub_val = float(sub.total_amount or (sub.unit_price * sub.quantity) or 0.0)
                active_sub_value += sub_val
                # Check expiry or next billing date
                target_date_str = sub.expiry_date or sub.next_billing_date
                if target_date_str:
                    t_dt = parse_date(target_date_str)
                    if t_dt:
                        diff = (t_dt - ref_dt).days
                        if 0 <= diff < min_renewal_days:
                            min_renewal_days = diff

        if min_renewal_days <= 7:
            renewal_score = 20 if total_outstanding_amount > 0 else 15
            signals.append({
                "type": SignalType.EXPIRING_SUBSCRIPTION.value,
                "severity": "HIGH",
                "description": f"Active recurring contract expires/renews in {min_renewal_days} day(s); retention lock-in required.",
                "detected_at": ref_str,
                "metric_value": float(min_renewal_days),
            })
        elif min_renewal_days <= 15:
            renewal_score = 12
            signals.append({
                "type": SignalType.EXPIRING_SUBSCRIPTION.value,
                "severity": "MEDIUM",
                "description": f"Contract renewal approaching in {min_renewal_days} days.",
                "detected_at": ref_str,
                "metric_value": float(min_renewal_days),
            })
        elif min_renewal_days <= 30:
            renewal_score = 6
        score_breakdown["renewal_hazard"] = renewal_score

        # If zero risks detected, log healthy standing signal
        if not signals:
            signals.append({
                "type": SignalType.HEALTHY_ACTIVITY.value,
                "severity": "LOW",
                "description": "Account maintains on-time settlement history and active contract health.",
                "detected_at": ref_str,
                "metric_value": 0.0,
            })

        # Calculate final deterministic score
        raw_score = sum(score_breakdown.values())
        clamped_score = max(0, min(100, int(raw_score)))
        churn_lvl = classify_churn_level(clamped_score)

        return {
            "customer_id": cust_id,
            "customer_name": cust_name,
            "probability": clamped_score,
            "level": churn_lvl.value,
            "signals": signals,
            "score_breakdown": score_breakdown,
            "metrics": {
                "max_overdue_days": max_overdue_days,
                "total_overdue_amount": round(total_overdue_amount, 2),
                "total_outstanding_amount": round(total_outstanding_amount, 2),
                "total_billed": round(total_billed, 2),
                "failed_payments_count": failed_count,
                "active_subscription_value": round(active_sub_value, 2),
                "days_until_renewal": min_renewal_days if min_renewal_days != 9999 else None,
            },
        }
