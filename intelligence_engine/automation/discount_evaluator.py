"""Discount evaluator component.

Evaluates eligibility and calculates discount amounts (Percentage or Fixed)
against business constraints including validity dates, min purchase thresholds,
and usage limits.
"""

from datetime import date
from typing import Any, Dict, List, Optional, Union

from intelligence_engine.adapters.data_adapter import normalize_date, parse_date
from intelligence_engine.schemas.intelligence_schema import DiscountRule, DiscountType


class DiscountEvaluator:
    """Evaluates discount rules and computes deduction amounts safely."""

    @classmethod
    def evaluate(
        cls,
        original_amount: float,
        discount: Optional[Union[Dict[str, Any], DiscountRule]] = None,
        quantity: float = 1.0,
        product_ids: Optional[List[str]] = None,
        reference_date: Optional[Union[str, date]] = None,
    ) -> Dict[str, Any]:
        """Evaluate discount eligibility and calculate discount amount.

        Args:
            original_amount: Original gross amount before discount.
            discount: Discount rule or dictionary.
            quantity: Purchased item count or subscription quantity.
            product_ids: List of product IDs included in the transaction.
            reference_date: Date to evaluate discount validity against.

        Returns:
            Dict containing original_amount, discount_amount, final_amount,
            discount_applied, and reason.
        """
        base = max(0.0, float(original_amount))

        if not discount:
            return {
                "original_amount": round(base, 2),
                "discount_amount": 0.0,
                "final_amount": round(base, 2),
                "discount_applied": False,
                "reason": "No discount rule provided",
            }

        if reference_date is None:
            ref_dt = date.today()
        elif isinstance(reference_date, str):
            ref_dt = parse_date(reference_date) or date.today()
        else:
            ref_dt = reference_date

        # Extract fields
        if isinstance(discount, dict):
            is_active = discount.get("is_active", True)
            d_type = str(discount.get("type", "PERCENTAGE")).strip().upper()
            val = float(discount.get("value", 0.0))
            min_purchase = float(discount.get("min_purchase_amount", 0.0))
            min_qty = float(discount.get("min_quantity", 0.0))
            start_date_raw = discount.get("start_date")
            end_date_raw = discount.get("end_date")
            usage_limit = discount.get("usage_limit")
            usage_count = int(discount.get("usage_count", 0))
            applicable_prods = discount.get("applicable_products")
            name = discount.get("name") or "Discount"
        else:
            is_active = discount.is_active
            d_type = discount.type.value if hasattr(discount.type, "value") else str(discount.type)
            val = float(discount.value)
            min_purchase = float(discount.min_purchase_amount)
            min_qty = float(discount.min_quantity)
            start_date_raw = discount.start_date
            end_date_raw = discount.end_date
            usage_limit = discount.usage_limit
            usage_count = int(discount.usage_count)
            applicable_prods = discount.applicable_products
            name = discount.name or "Discount"

        # Check active status
        if not is_active:
            return {
                "original_amount": round(base, 2),
                "discount_amount": 0.0,
                "final_amount": round(base, 2),
                "discount_applied": False,
                "reason": f"{name} is currently inactive",
            }

        # Check date range
        start_dt = parse_date(start_date_raw)
        if start_dt and ref_dt < start_dt:
            return {
                "original_amount": round(base, 2),
                "discount_amount": 0.0,
                "final_amount": round(base, 2),
                "discount_applied": False,
                "reason": f"{name} starts on {start_dt.strftime('%Y-%m-%d')} (not yet active)",
            }

        end_dt = parse_date(end_date_raw)
        if end_dt and ref_dt > end_dt:
            return {
                "original_amount": round(base, 2),
                "discount_amount": 0.0,
                "final_amount": round(base, 2),
                "discount_applied": False,
                "reason": f"{name} expired on {end_dt.strftime('%Y-%m-%d')}",
            }

        # Check minimum purchase amount
        if min_purchase > 0.0 and base < min_purchase:
            return {
                "original_amount": round(base, 2),
                "discount_amount": 0.0,
                "final_amount": round(base, 2),
                "discount_applied": False,
                "reason": f"Minimum purchase amount of ₹{min_purchase:,.2f} required (current: ₹{base:,.2f})",
            }

        # Check minimum quantity
        if min_qty > 0.0 and quantity < min_qty:
            return {
                "original_amount": round(base, 2),
                "discount_amount": 0.0,
                "final_amount": round(base, 2),
                "discount_applied": False,
                "reason": f"Minimum quantity of {min_qty} required (current: {quantity})",
            }

        # Check usage limit
        if usage_limit is not None and usage_count >= usage_limit:
            return {
                "original_amount": round(base, 2),
                "discount_amount": 0.0,
                "final_amount": round(base, 2),
                "discount_applied": False,
                "reason": f"Discount usage limit of {usage_limit} has been reached",
            }

        # Check product applicability
        if applicable_prods:
            app_set = {str(p) for p in applicable_prods}
            given_set = {str(p) for p in (product_ids or [])}
            if not (app_set & given_set):
                return {
                    "original_amount": round(base, 2),
                    "discount_amount": 0.0,
                    "final_amount": round(base, 2),
                    "discount_applied": False,
                    "reason": "Discount is only applicable to specific products not present in this order",
                }

        # Calculate discount amount
        if "FIX" in d_type:
            discount_amount = min(val, base)
            reason = f"Fixed discount of ₹{discount_amount:,.2f} applied successfully"
        else:
            pct = max(0.0, min(100.0, val))
            discount_amount = base * (pct / 100.0)
            reason = f"{pct:.0f}% discount applied successfully"

        discount_amount = round(discount_amount, 2)
        final_amount = max(0.0, round(base - discount_amount, 2))

        return {
            "original_amount": round(base, 2),
            "discount_amount": discount_amount,
            "final_amount": final_amount,
            "discount_applied": discount_amount > 0.0,
            "reason": reason,
        }


def evaluate_discount(
    original_amount: float,
    discount: Optional[Union[Dict[str, Any], DiscountRule]] = None,
    quantity: float = 1.0,
    product_ids: Optional[List[str]] = None,
    reference_date: Optional[Union[str, date]] = None,
) -> Dict[str, Any]:
    """Functional convenience wrapper for DiscountEvaluator.evaluate."""
    return DiscountEvaluator.evaluate(
        original_amount=original_amount,
        discount=discount,
        quantity=quantity,
        product_ids=product_ids,
        reference_date=reference_date,
    )
