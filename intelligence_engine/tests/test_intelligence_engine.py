"""Unit and integration tests for Revora Revenue Intelligence Engine.

Covers:
- Overdue and outstanding payment detection
- Subscription renewal and contract expiration detection
- Billing risk and unbilled revenue leakage detection
- Explainable priority scoring engine (0-100 clamped, factor breakdowns)
- Revenue action generation and deterministic priority sorting
- Data adapter normalization
- End-to-end service API execution
"""

from datetime import date
import pytest

from intelligence_engine.adapters.data_adapter import (
    DataAdapter,
    normalize_invoice,
    normalize_subscription,
)
from intelligence_engine.demo.demo_data import get_demo_dataset
from intelligence_engine.engine.billing_risk_detector import detect_billing_risks
from intelligence_engine.engine.overdue_detector import detect_overdue_invoices
from intelligence_engine.engine.priority_scoring import (
    PriorityScorer,
    classify_priority,
    score_billing_risk,
    score_payment_risk,
    score_renewal_risk,
)
from intelligence_engine.engine.renewal_detector import detect_renewals
from intelligence_engine.engine.revenue_analyzer import analyze_revenue_actions
from intelligence_engine.schemas.intelligence_schema import (
    ActionCategory,
    PriorityLevel,
)
from intelligence_engine.services.intelligence_service import analyze_revenue


class TestOverdueDetector:
    """Tests for overdue invoice detection."""

    REF_DATE = "2026-10-31"

    def test_overdue_invoice_detected(self):
        invoices = [
            {
                "invoice_id": "INV-1042",
                "customer_name": "BrightTech",
                "due_date": "2026-10-19",  # 12 days overdue
                "total_amount": 48000.0,
                "paid_amount": 0.0,
                "outstanding_amount": 48000.0,
                "status": "CONFIRMED",
            }
        ]
        results = detect_overdue_invoices(invoices, reference_date=self.REF_DATE)
        assert len(results) == 1
        res = results[0]
        assert res["is_overdue"] is True
        assert res["days_overdue"] == 12
        assert res["outstanding_amount"] == 48000.0

    def test_paid_invoice_not_flagged(self):
        invoices = [
            {
                "invoice_id": "INV-PAID",
                "due_date": "2026-10-15",
                "total_amount": 10000.0,
                "paid_amount": 10000.0,
                "outstanding_amount": 0.0,
                "status": "PAID",
            }
        ]
        results = detect_overdue_invoices(invoices, reference_date=self.REF_DATE)
        assert len(results) == 0

    def test_future_due_date_not_overdue(self):
        invoices = [
            {
                "invoice_id": "INV-FUTURE",
                "due_date": "2026-11-15",
                "total_amount": 5000.0,
                "paid_amount": 0.0,
                "status": "SENT",
            }
        ]
        results = detect_overdue_invoices(invoices, reference_date=self.REF_DATE)
        assert len(results) == 1
        assert results[0]["is_overdue"] is False
        assert results[0]["days_overdue"] == 0


class TestRenewalDetector:
    """Tests for subscription renewal detection."""

    REF_DATE = "2026-10-31"

    def test_within_7_days_window_detected(self):
        subs = [
            {
                "subscription_id": "SUB-TN-101",
                "customer_name": "TechNova",
                "status": "ACTIVE",
                "expiry_date": "2026-11-05",  # 5 days
                "total_amount": 120000.0,
            }
        ]
        results = detect_renewals(subs, reference_date=self.REF_DATE)
        assert len(results) == 1
        res = results[0]
        assert res["days_until_expiry"] == 5
        assert res["window"] == "WITHIN_7_DAYS"
        assert res["renewal_risk"] == "HIGH"
        assert res["subscription_value"] == 120000.0

    def test_expires_today_classified_critical(self):
        subs = [
            {
                "subscription_id": "SUB-TODAY",
                "customer_name": "Expiring Today Inc",
                "status": "ACTIVE",
                "expiry_date": "2026-10-31",
                "total_amount": 50000.0,
            }
        ]
        results = detect_renewals(subs, reference_date=self.REF_DATE)
        assert len(results) == 1
        assert results[0]["window"] == "EXPIRES_TODAY"
        assert results[0]["renewal_risk"] == "CRITICAL"

    def test_safe_subscription_not_flagged(self):
        subs = [
            {
                "subscription_id": "SUB-FAR",
                "status": "ACTIVE",
                "expiry_date": "2027-10-31",  # 1 year later
                "total_amount": 20000.0,
            }
        ]
        results = detect_renewals(subs, reference_date=self.REF_DATE)
        assert len(results) == 0


class TestBillingRiskDetector:
    """Tests for unbilled active subscription risk detection."""

    REF_DATE = "2026-10-31"

    def test_unbilled_active_subscription_detected(self):
        subs = [
            {
                "subscription_id": "SUB-CW-303",
                "customer_name": "CloudWorks",
                "status": "ACTIVE",
                "next_billing_date": "2026-10-21",  # 10 days past
                "total_amount": 25000.0,
            }
        ]
        # No invoice exists
        results = detect_billing_risks(subs, invoices=[], reference_date=self.REF_DATE)
        assert len(results) == 1
        res = results[0]
        assert res["days_billing_overdue"] == 10
        assert res["potential_revenue_amount"] == 25000.0

    def test_billed_subscription_not_flagged_as_risk(self):
        subs = [
            {
                "subscription_id": "SUB-BILLED",
                "status": "ACTIVE",
                "next_billing_date": "2026-10-21",
                "total_amount": 25000.0,
            }
        ]
        invoices = [
            {
                "invoice_id": "INV-EXISTING",
                "subscription_id": "SUB-BILLED",
                "billing_period_start": "2026-10-21",
                "status": "CONFIRMED",
            }
        ]
        results = detect_billing_risks(subs, invoices=invoices, reference_date=self.REF_DATE)
        assert len(results) == 0


class TestPriorityScoring:
    """Tests for deterministic explainable priority scoring."""

    def test_score_boundaries_and_classification(self):
        assert classify_priority(100) == PriorityLevel.CRITICAL
        assert classify_priority(80) == PriorityLevel.CRITICAL
        assert classify_priority(79) == PriorityLevel.HIGH
        assert classify_priority(60) == PriorityLevel.HIGH
        assert classify_priority(59) == PriorityLevel.MEDIUM
        assert classify_priority(30) == PriorityLevel.MEDIUM
        assert classify_priority(29) == PriorityLevel.LOW
        assert classify_priority(0) == PriorityLevel.LOW

    def test_brighttech_critical_payment_scoring(self):
        # 12 days overdue, ₹48,000 outstanding
        res = score_payment_risk(days_overdue=12, outstanding_amount=48000.0, total_amount=48000.0)
        assert res["score"] >= 80
        assert res["priority"] == "CRITICAL"
        assert "score_breakdown" in res
        assert "reasoning" in res
        assert len(res["reasoning"]) > 0

    def test_technova_high_renewal_scoring(self):
        # 5 days until expiry, ₹120,000 value
        res = score_renewal_risk(days_until_expiry=5, subscription_value=120000.0)
        assert 60 <= res["score"] < 80
        assert res["priority"] == "HIGH"
        assert res["score_breakdown"]["subscription_value_score"] == 35

    def test_cloudworks_medium_billing_risk_scoring(self):
        # 10 days overdue billing, ₹25,000 potential revenue
        res = score_billing_risk(days_billing_overdue=10, potential_revenue=25000.0)
        assert 30 <= res["score"] < 60
        assert res["priority"] == "MEDIUM"

    def test_scores_clamped_between_0_and_100(self):
        # Extreme high factors
        high_res = score_payment_risk(days_overdue=365, outstanding_amount=10000000.0, total_amount=10000000.0)
        assert 0 <= high_res["score"] <= 100

        # Zero / negative factors
        low_res = score_payment_risk(days_overdue=0, outstanding_amount=0.0, total_amount=0.0)
        assert 0 <= low_res["score"] <= 100


class TestRevenueAnalyzer:
    """Tests for Action generation and sorting."""

    REF_DATE = "2026-10-31"

    def test_actions_generated_with_deterministic_ids_and_sorting(self):
        demo_data = get_demo_dataset()
        actions = analyze_revenue_actions(
            subscriptions=demo_data["subscriptions"],
            invoices=demo_data["invoices"],
            reference_date=self.REF_DATE,
        )

        assert len(actions) > 0
        # Check ID format
        assert actions[0]["id"] == "ACT-001"
        assert actions[1]["id"] == "ACT-002"

        # Check sorting: highest priority / score first
        first_act = actions[0]
        assert first_act["priority"] == "CRITICAL"
        assert first_act["customer_name"] == "BrightTech Innovations"
        assert first_act["amount"] == 48000.0

        second_act = actions[1]
        assert second_act["priority"] == "HIGH"
        assert second_act["customer_name"] == "TechNova Solutions"
        assert second_act["amount"] == 120000.0


class TestDataAdapter:
    """Tests for DataAdapter normalization resilience."""

    def test_normalize_raw_dictionary_variations(self):
        raw_sub = {
            "id": "SUB-ALIAS-1",
            "client_name": "Test Client",
            "state": "active",
            "frequency": "monthly",
            "price": "2500.50",
            "qty": "2",
            "next_billing_date": "2026-10-31T14:30:00Z",
        }
        normalized = normalize_subscription(raw_sub)
        assert normalized.subscription_id == "SUB-ALIAS-1"
        assert normalized.customer_name == "Test Client"
        assert normalized.status == "ACTIVE"
        assert normalized.billing_frequency == "MONTHLY"
        assert normalized.unit_price == 2500.50
        assert normalized.quantity == 2.0
        assert normalized.next_billing_date == "2026-10-31"

    def test_normalize_invoice_variations(self):
        raw_inv = {
            "inv_id": "INV-ALIAS-1",
            "customer": {"name": "Nested Client"},
            "amount": "5000",
            "paid": "1000",
            "due_date": "31/10/2026",
        }
        normalized = normalize_invoice(raw_inv)
        assert normalized.invoice_id == "INV-ALIAS-1"
        assert normalized.customer_name == "Nested Client"
        assert normalized.total_amount == 5000.0
        assert normalized.paid_amount == 1000.0
        assert normalized.outstanding_amount == 4000.0
        assert normalized.due_date == "2026-10-31"


class TestIntelligenceService:
    """End-to-end integration tests for analyze_revenue entry point."""

    def test_analyze_revenue_service_call(self):
        demo_data = get_demo_dataset()
        report = analyze_revenue(demo_data, reference_date="2026-10-31")

        assert "summary" in report
        assert "actions" in report

        summary = report["summary"]
        assert summary["total_actions"] == 4
        assert summary["critical"] == 1
        assert summary["high"] == 1
        assert summary["medium"] == 1
        assert summary["total_revenue_at_risk"] > 0

        # Verify every action has required keys
        for act in report["actions"]:
            assert "id" in act
            assert "priority" in act
            assert "score" in act
            assert "category" in act
            assert "title" in act
            assert "reason" in act
            assert "recommended_action" in act
            assert "related_entity_type" in act
            assert "related_entity_id" in act
            assert "customer_name" in act
            assert "amount" in act
            assert "created_at" in act
