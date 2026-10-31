"""Billing processor component.

Orchestrates the complete billing automation workflow:
Schedule evaluation -> Duplicate check -> Base calculation -> Discount evaluation -> Tax calculation
to produce ready-to-execute billing instructions.
"""

from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Union

from intelligence_engine.adapters.data_adapter import (
    normalize_date,
    normalize_subscription,
    parse_date,
)
from intelligence_engine.automation.billing_scheduler import BillingScheduler
from intelligence_engine.automation.discount_evaluator import DiscountEvaluator
from intelligence_engine.automation.duplicate_checker import DuplicateChecker
from intelligence_engine.automation.tax_calculator import TaxCalculator
from intelligence_engine.schemas.intelligence_schema import (
    BillingInstruction,
    BillingStatus,
    SubscriptionRecord,
)


def compute_next_billing_date(start_dt: date, frequency: str) -> date:
    """Calculate the next recurring billing date given frequency."""
    freq = (frequency or "MONTHLY").upper()
    if freq == "DAILY":
        return start_dt + timedelta(days=1)
    elif freq == "WEEKLY":
        return start_dt + timedelta(days=7)
    elif freq == "YEARLY":
        try:
            return start_dt.replace(year=start_dt.year + 1)
        except ValueError:
            # Handle leap year Feb 29
            return start_dt + timedelta(days=365)
    else:  # MONTHLY default
        # Calculate next month safely
        year = start_dt.year + (start_dt.month // 12)
        month = (start_dt.month % 12) + 1
        day = min(start_dt.day, 28)  # safe day across all months
        return date(year, month, day)


class BillingProcessor:
    """End-to-end billing processor for subscriptions."""

    @classmethod
    def process_subscription(
        cls,
        subscription: Union[Dict[str, Any], SubscriptionRecord],
        existing_invoices: Optional[List[Union[Dict[str, Any], Any]]] = None,
        tax_rate: Optional[float] = None,
        reference_date: Optional[Union[str, date]] = None,
    ) -> Dict[str, Any]:
        """Execute full billing automation pipeline for a single subscription.

        Args:
            subscription: Subscription data (dict or SubscriptionRecord).
            existing_invoices: All invoices in system for duplicate checks.
            tax_rate: Optional tax rate override (otherwise uses subscription or default).
            reference_date: Date context for billing execution (defaults to today).

        Returns:
            Dict conforming to BillingInstruction specification.
        """
        # 1. Normalize subscription data
        sub = (
            subscription
            if isinstance(subscription, SubscriptionRecord)
            else normalize_subscription(subscription)
        )

        ref_dt = parse_date(reference_date) or date.today()
        ref_date_str = ref_dt.strftime("%Y-%m-%d")

        # 2. Check billing schedule
        schedule_res = BillingScheduler.check_schedule(sub, reference_date=ref_dt)
        if not schedule_res["billing_due"]:
            return {
                "subscription_id": sub.subscription_id,
                "customer_id": sub.customer_id,
                "customer_name": sub.customer_name,
                "billing_allowed": False,
                "billing_status": schedule_res["billing_status"],
                "base_amount": 0.0,
                "discount_amount": 0.0,
                "discount_applied": False,
                "discount_reason": None,
                "taxable_amount": 0.0,
                "tax_rate": 0.0,
                "tax_amount": 0.0,
                "total_amount": 0.0,
                "billing_period_start": sub.next_billing_date,
                "billing_period_end": None,
                "next_billing_date": sub.next_billing_date,
                "reason": schedule_res["reason"],
            }

        target_billing_date = sub.next_billing_date or ref_date_str
        target_billing_dt = parse_date(target_billing_date) or ref_dt

        # Compute billing period end & next billing date
        computed_next_dt = compute_next_billing_date(target_billing_dt, sub.billing_frequency)
        period_start = target_billing_dt.strftime("%Y-%m-%d")
        period_end = (computed_next_dt - timedelta(days=1)).strftime("%Y-%m-%d")
        new_next_billing_date = computed_next_dt.strftime("%Y-%m-%d")

        # 3. Check for duplicates
        dup_res = DuplicateChecker.check_duplicate(
            subscription_id=sub.subscription_id,
            billing_period_start=period_start,
            billing_period_end=period_end,
            existing_invoices=existing_invoices,
        )

        if dup_res["is_duplicate"]:
            return {
                "subscription_id": sub.subscription_id,
                "customer_id": sub.customer_id,
                "customer_name": sub.customer_name,
                "billing_allowed": False,
                "billing_status": BillingStatus.DUPLICATE_BLOCKED.value,
                "base_amount": 0.0,
                "discount_amount": 0.0,
                "discount_applied": False,
                "discount_reason": None,
                "taxable_amount": 0.0,
                "tax_rate": 0.0,
                "tax_amount": 0.0,
                "total_amount": 0.0,
                "billing_period_start": period_start,
                "billing_period_end": period_end,
                "next_billing_date": new_next_billing_date,
                "reason": f"Duplicate invoice blocked: {dup_res['reason']}",
            }

        # 4. Calculate Base Amount (incorporate products, variants, and quantities)
        base_amount = 0.0
        product_ids = []
        if sub.products:
            for item in sub.products:
                line_unit = item.unit_price + item.variant_price
                base_amount += line_unit * item.quantity
                if item.product_id:
                    product_ids.append(item.product_id)
        else:
            base_amount = sub.unit_price * sub.quantity

        if base_amount <= 0.0 and sub.total_amount > 0.0:
            base_amount = sub.total_amount

        base_amount = round(base_amount, 2)

        # 5. Evaluate Discount
        disc_res = DiscountEvaluator.evaluate(
            original_amount=base_amount,
            discount=sub.discount,
            quantity=sub.quantity,
            product_ids=product_ids,
            reference_date=ref_dt,
        )

        taxable_amount = disc_res["final_amount"]

        # 6. Calculate Tax
        effective_tax_rate = (
            tax_rate if tax_rate is not None
            else (sub.tax_rate if sub.tax_rate is not None else 18.0)
        )
        tax_res = TaxCalculator.calculate(
            taxable_amount=taxable_amount,
            tax_rate=effective_tax_rate,
        )

        total_amount = tax_res["final_amount"]

        # 7. Generate Billing Instruction
        return {
            "subscription_id": sub.subscription_id,
            "customer_id": sub.customer_id,
            "customer_name": sub.customer_name,
            "billing_allowed": True,
            "billing_status": BillingStatus.READY_FOR_INVOICE.value,
            "base_amount": base_amount,
            "discount_amount": disc_res["discount_amount"],
            "discount_applied": disc_res["discount_applied"],
            "discount_reason": disc_res["reason"],
            "taxable_amount": taxable_amount,
            "tax_rate": tax_res["tax_rate"],
            "tax_amount": tax_res["tax_amount"],
            "total_amount": total_amount,
            "billing_period_start": period_start,
            "billing_period_end": period_end,
            "next_billing_date": new_next_billing_date,
            "reason": "Billing calculation completed successfully",
        }


def process_billing(
    subscription: Union[Dict[str, Any], SubscriptionRecord],
    existing_invoices: Optional[List[Union[Dict[str, Any], Any]]] = None,
    tax_rate: Optional[float] = None,
    reference_date: Optional[Union[str, date]] = None,
) -> Dict[str, Any]:
    """Functional convenience wrapper for BillingProcessor.process_subscription."""
    return BillingProcessor.process_subscription(
        subscription=subscription,
        existing_invoices=existing_invoices,
        tax_rate=tax_rate,
        reference_date=reference_date,
    )
