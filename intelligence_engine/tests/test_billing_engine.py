"""Unit and integration tests for Revora Billing Automation Engine.

Covers:
- Billing scheduler (due, overdue, not due, inactive subscriptions)
- Duplicate checking (period matches, cancelled status exemptions)
- Discount evaluation (percentage, fixed, min purchase, expiration, limits)
- Tax calculation (configurable rates, custom tax rules)
- Full billing processing pipeline with products and variants
"""

from datetime import date
import pytest

from intelligence_engine.automation.billing_processor import (
    BillingProcessor,
    compute_next_billing_date,
    process_billing,
)
from intelligence_engine.automation.billing_scheduler import (
    BillingScheduler,
    check_billing_schedule,
)
from intelligence_engine.automation.discount_evaluator import (
    DiscountEvaluator,
    evaluate_discount,
)
from intelligence_engine.automation.duplicate_checker import (
    DuplicateChecker,
    check_duplicate_billing,
)
from intelligence_engine.automation.tax_calculator import (
    TaxCalculator,
    calculate_tax,
)


class TestBillingScheduler:
    """Tests for BillingScheduler."""

    REF_DATE = "2026-10-31"

    def test_billing_due_today(self):
        sub = {
            "subscription_id": "SUB-DUE",
            "status": "ACTIVE",
            "next_billing_date": "2026-10-31",
        }
        res = check_billing_schedule(sub, reference_date=self.REF_DATE)
        assert res["billing_due"] is True
        assert res["billing_status"] == "DUE"
        assert res["days_difference"] == 0

    def test_billing_not_due_future_date(self):
        sub = {
            "subscription_id": "SUB-FUTURE",
            "status": "ACTIVE",
            "next_billing_date": "2026-11-15",
        }
        res = check_billing_schedule(sub, reference_date=self.REF_DATE)
        assert res["billing_due"] is False
        assert res["billing_status"] == "NOT_DUE"
        assert res["days_difference"] < 0

    def test_billing_overdue_past_date(self):
        sub = {
            "subscription_id": "SUB-OVERDUE",
            "status": "ACTIVE",
            "next_billing_date": "2026-10-20",
        }
        res = check_billing_schedule(sub, reference_date=self.REF_DATE)
        assert res["billing_due"] is True
        assert res["billing_status"] == "OVERDUE"
        assert res["days_difference"] == 11

    def test_inactive_subscription_blocked(self):
        statuses = ["DRAFT", "QUOTATION", "CONFIRMED", "PAUSED", "CLOSED"]
        for st in statuses:
            sub = {
                "subscription_id": f"SUB-{st}",
                "status": st,
                "next_billing_date": "2026-10-31",
            }
            res = check_billing_schedule(sub, reference_date=self.REF_DATE)
            assert res["billing_due"] is False
            assert res["billing_status"] == "INELIGIBLE"

    def test_missing_billing_date(self):
        sub = {"subscription_id": "SUB-NODATE", "status": "ACTIVE"}
        res = check_billing_schedule(sub, reference_date=self.REF_DATE)
        assert res["billing_due"] is False
        assert res["billing_status"] == "NOT_DUE"


class TestDuplicateChecker:
    """Tests for DuplicateChecker."""

    def test_duplicate_detected_exact_period(self):
        invoices = [
            {
                "invoice_id": "INV-001",
                "subscription_id": "SUB-100",
                "billing_period_start": "2026-10-01",
                "billing_period_end": "2026-10-31",
                "status": "CONFIRMED",
            }
        ]
        res = check_duplicate_billing(
            subscription_id="SUB-100",
            billing_period_start="2026-10-01",
            billing_period_end="2026-10-31",
            existing_invoices=invoices,
        )
        assert res["is_duplicate"] is True
        assert res["existing_invoice_id"] == "INV-001"

    def test_no_duplicate_when_different_period(self):
        invoices = [
            {
                "invoice_id": "INV-001",
                "subscription_id": "SUB-100",
                "billing_period_start": "2026-09-01",
                "billing_period_end": "2026-09-30",
                "status": "PAID",
            }
        ]
        res = check_duplicate_billing(
            subscription_id="SUB-100",
            billing_period_start="2026-10-01",
            billing_period_end="2026-10-31",
            existing_invoices=invoices,
        )
        assert res["is_duplicate"] is False
        assert res["existing_invoice_id"] is None

    def test_cancelled_invoices_do_not_block_billing(self):
        invoices = [
            {
                "invoice_id": "INV-VOID",
                "subscription_id": "SUB-100",
                "billing_period_start": "2026-10-01",
                "billing_period_end": "2026-10-31",
                "status": "CANCELLED",
            }
        ]
        res = check_duplicate_billing(
            subscription_id="SUB-100",
            billing_period_start="2026-10-01",
            billing_period_end="2026-10-31",
            existing_invoices=invoices,
        )
        assert res["is_duplicate"] is False


class TestDiscountEvaluator:
    """Tests for DiscountEvaluator."""

    REF_DATE = "2026-10-31"

    def test_percentage_discount(self):
        discount = {
            "type": "PERCENTAGE",
            "value": 15.0,
            "is_active": True,
        }
        res = evaluate_discount(10000.0, discount=discount, reference_date=self.REF_DATE)
        assert res["discount_applied"] is True
        assert res["original_amount"] == 10000.0
        assert res["discount_amount"] == 1500.0
        assert res["final_amount"] == 8500.0

    def test_fixed_discount(self):
        discount = {
            "type": "FIXED",
            "value": 1200.0,
            "is_active": True,
        }
        res = evaluate_discount(5000.0, discount=discount, reference_date=self.REF_DATE)
        assert res["discount_applied"] is True
        assert res["discount_amount"] == 1200.0
        assert res["final_amount"] == 3800.0

    def test_fixed_discount_exceeding_base_never_negative(self):
        discount = {
            "type": "FIXED",
            "value": 15000.0,
            "is_active": True,
        }
        res = evaluate_discount(10000.0, discount=discount, reference_date=self.REF_DATE)
        assert res["discount_applied"] is True
        assert res["discount_amount"] == 10000.0
        assert res["final_amount"] == 0.0

    def test_expired_discount_rejected(self):
        discount = {
            "type": "PERCENTAGE",
            "value": 20.0,
            "end_date": "2026-10-15",  # Expired relative to 2026-10-31
            "is_active": True,
        }
        res = evaluate_discount(10000.0, discount=discount, reference_date=self.REF_DATE)
        assert res["discount_applied"] is False
        assert res["discount_amount"] == 0.0
        assert res["final_amount"] == 10000.0
        assert "expired" in res["reason"].lower()

    def test_min_purchase_not_met(self):
        discount = {
            "type": "FIXED",
            "value": 500.0,
            "min_purchase_amount": 8000.0,
            "is_active": True,
        }
        res = evaluate_discount(5000.0, discount=discount, reference_date=self.REF_DATE)
        assert res["discount_applied"] is False
        assert res["final_amount"] == 5000.0

    def test_usage_limit_reached(self):
        discount = {
            "type": "PERCENTAGE",
            "value": 10.0,
            "usage_limit": 5,
            "usage_count": 5,
            "is_active": True,
        }
        res = evaluate_discount(10000.0, discount=discount, reference_date=self.REF_DATE)
        assert res["discount_applied"] is False
        assert "limit" in res["reason"].lower()


class TestTaxCalculator:
    """Tests for TaxCalculator."""

    def test_standard_tax_calculation(self):
        res = calculate_tax(taxable_amount=9000.0, tax_rate=18.0)
        assert res["taxable_amount"] == 9000.0
        assert res["tax_rate"] == 18.0
        assert res["tax_amount"] == 1620.0
        assert res["final_amount"] == 10620.0

    def test_zero_tax(self):
        res = calculate_tax(taxable_amount=5000.0, tax_rate=0.0)
        assert res["tax_amount"] == 0.0
        assert res["final_amount"] == 5000.0

    def test_custom_tax_rule(self):
        custom_rule = {"name": "State VAT", "rate": 12.5}
        res = calculate_tax(taxable_amount=1000.0, tax_rule=custom_rule)
        assert res["tax_name"] == "State VAT"
        assert res["tax_rate"] == 12.5
        assert res["tax_amount"] == 125.0
        assert res["final_amount"] == 1125.0


class TestBillingProcessor:
    """End-to-end billing processor tests."""

    REF_DATE = "2026-10-31"

    def test_complete_billing_flow_ready_for_invoice(self):
        sub = {
            "subscription_id": "SUB-FULL",
            "customer_name": "Acme Corp",
            "status": "ACTIVE",
            "billing_frequency": "MONTHLY",
            "next_billing_date": "2026-10-31",
            "unit_price": 5000.0,
            "quantity": 2.0,  # 10,000 base
            "discount": {
                "type": "PERCENTAGE",
                "value": 10.0,
                "is_active": True,
            },
            "tax_rate": 18.0,
        }
        res = process_billing(sub, existing_invoices=[], reference_date=self.REF_DATE)

        assert res["billing_allowed"] is True
        assert res["billing_status"] == "READY_FOR_INVOICE"
        assert res["base_amount"] == 10000.0
        assert res["discount_amount"] == 1000.0
        assert res["taxable_amount"] == 9000.0
        assert res["tax_amount"] == 1620.0
        assert res["total_amount"] == 10620.0
        assert res["billing_period_start"] == "2026-10-31"
        assert res["next_billing_date"] is not None

    def test_duplicate_blocks_billing(self):
        sub = {
            "subscription_id": "SUB-DUP",
            "customer_name": "Acme Corp",
            "status": "ACTIVE",
            "billing_frequency": "MONTHLY",
            "next_billing_date": "2026-10-31",
            "unit_price": 1000.0,
            "quantity": 1.0,
        }
        # Pre-existing invoice
        existing = [
            {
                "invoice_id": "INV-EXISTING",
                "subscription_id": "SUB-DUP",
                "billing_period_start": "2026-10-31",
                "status": "CONFIRMED",
            }
        ]
        res = process_billing(sub, existing_invoices=existing, reference_date=self.REF_DATE)
        assert res["billing_allowed"] is False
        assert res["billing_status"] == "DUPLICATE_BLOCKED"

    def test_products_with_variants_calculated_correctly(self):
        sub = {
            "subscription_id": "SUB-VAR",
            "customer_name": "Variant Test",
            "status": "ACTIVE",
            "billing_frequency": "MONTHLY",
            "next_billing_date": "2026-10-31",
            "products": [
                {
                    "product_id": "P1",
                    "product_name": "Base Software",
                    "unit_price": 1000.0,
                    "variant_name": "Enterprise (+560)",
                    "variant_price": 560.0,
                    "quantity": 2.0,  # (1000 + 560) * 2 = 3120.0
                }
            ],
            "tax_rate": 18.0,
        }
        res = process_billing(sub, reference_date=self.REF_DATE)
        assert res["billing_allowed"] is True
        assert res["base_amount"] == 3120.0
        assert res["discount_amount"] == 0.0
        assert res["tax_amount"] == round(3120.0 * 0.18, 2)
        assert res["total_amount"] == round(3120.0 * 1.18, 2)
