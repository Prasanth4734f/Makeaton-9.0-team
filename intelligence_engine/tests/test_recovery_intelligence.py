"""Comprehensive test suite for Autonomous Revenue Recovery & Churn Defense Intelligence Engine.

Validates all required scenarios:
1. Healthy customer with zero risk
2. Overdue invoice triggering dunning / payment recovery
3. Repeated payment failures triggering manual review
4. High-value renewal expiring soon triggering renewal rescue
5. Portfolio ranking by priority tier and financial impact
6. Controlled agentic report structure and mandatory human approval flag
"""

from datetime import date
import pytest

from intelligence_engine.engine.churn_predictor import ChurnPredictor
from intelligence_engine.engine.mitigation_engine import MitigationEngine
from intelligence_engine.engine.recovery_agent import AutonomousRecoveryAgent
from intelligence_engine.schemas.intelligence_schema import (
    AgenticActionReport,
    ChurnLevel,
    PlanType,
    PriorityLevel,
    SignalType,
)
from intelligence_engine.services.intelligence_service import (
    analyze_revenue,
    evaluate_customer_churn,
    generate_mitigation_plan,
    process_subscription_billing,
    rank_customer_portfolio,
    run_autonomous_recovery_agent,
)


REF_DATE = "2026-10-31"


# =============================================================================
# SCENARIO 1: Healthy Customer
# =============================================================================

def test_scenario_1_healthy_customer():
    """Customer with active subscription, fully paid invoices, no payment failures."""
    customer = {"id": "c100", "name": "Acme Innovations Ltd"}
    invoices = [
        {
            "id": "inv_1",
            "customer_id": "c100",
            "amount": 25000.0,
            "amount_paid": 25000.0,
            "status": "PAID",
            "due_date": "2026-10-15",
            "issue_date": "2026-10-01",
        }
    ]
    payments = [
        {
            "payment_id": "pay_1",
            "invoice_id": "inv_1",
            "amount": 25000.0,
            "payment_date": "2026-10-10",
        }
    ]
    subscriptions = [
        {
            "id": "sub_1",
            "customer_id": "c100",
            "plan_name": "Enterprise Annual",
            "status": "ACTIVE",
            "recurring_amount": 300000.0,
            "billing_interval": "YEARLY",
            "next_billing_date": "2027-10-01",
            "end_date": "2027-10-01",
        }
    ]

    report = run_autonomous_recovery_agent(
        customer=customer,
        invoices=invoices,
        payments=payments,
        subscriptions=subscriptions,
        reference_date=REF_DATE,
    )

    # Validate output adheres to schema
    validated = AgenticActionReport(**report)
    assert validated.requires_human_approval is True
    assert validated.churn["level"] == ChurnLevel.LOW.value
    assert validated.churn["probability"] < 25
    assert validated.mitigation_plan.plan_type == PlanType.MONITOR
    assert validated.mitigation_plan.priority == PriorityLevel.LOW
    assert validated.financial_impact.potential_revenue_impact == 0.0
    assert validated.financial_impact.projected_revenue_protected == 300000.0

    # Signals must confirm healthy standing
    signal_types = [s.type for s in validated.signals]
    assert SignalType.HEALTHY_ACTIVITY.value in signal_types


# =============================================================================
# SCENARIO 2: Overdue Invoice
# =============================================================================

def test_scenario_2_overdue_invoice():
    """Customer with invoice overdue by 21 days and outstanding balance."""
    customer = {"id": "c200", "name": "Beta Logistics Pvt Ltd"}
    invoices = [
        {
            "id": "inv_201",
            "customer_id": "c200",
            "amount": 45000.0,
            "amount_paid": 0.0,
            "status": "OVERDUE",
            "due_date": "2026-10-10",  # 21 days overdue relative to 2026-10-31
            "issue_date": "2026-09-25",
        }
    ]
    subscriptions = [
        {
            "id": "sub_201",
            "customer_id": "c200",
            "plan_name": "Growth Tier",
            "status": "ACTIVE",
            "recurring_amount": 45000.0,
            "billing_interval": "MONTHLY",
            "next_billing_date": "2026-11-25",
        }
    ]

    report = run_autonomous_recovery_agent(
        customer=customer,
        invoices=invoices,
        subscriptions=subscriptions,
        reference_date=REF_DATE,
    )

    validated = AgenticActionReport(**report)
    assert validated.requires_human_approval is True
    assert validated.churn["level"] in (ChurnLevel.HIGH.value, ChurnLevel.CRITICAL.value)
    assert validated.churn["probability"] >= 50
    assert validated.mitigation_plan.plan_type in (PlanType.PAYMENT_RECOVERY, PlanType.DUNNING_NOTICE)
    assert validated.mitigation_plan.priority in (PriorityLevel.HIGH, PriorityLevel.CRITICAL)
    assert validated.financial_impact.potential_revenue_impact == 45000.0
    assert validated.financial_impact.projected_recovery > 0.0

    # Check that overdue signal is extracted
    signal_types = [s.type for s in validated.signals]
    assert SignalType.OVERDUE_INVOICE.value in signal_types


# =============================================================================
# SCENARIO 3: Repeated Payment Failures
# =============================================================================

def test_scenario_3_repeated_payment_failures():
    """Customer with multiple failed payment attempts triggering manual review."""
    customer = {"id": "c300", "name": "Gamma Media Networks"}
    invoices = [
        {
            "id": "inv_301",
            "customer_id": "c300",
            "amount": 60000.0,
            "amount_paid": 0.0,
            "status": "OVERDUE",
            "due_date": "2026-10-12",
        }
    ]
    # Represent payment attempts with failure notes
    payments = [
        {
            "payment_id": "fail_1",
            "invoice_id": "inv_301",
            "amount": 0.0,
            "payment_date": "2026-10-13",
            "notes": "Transaction failed: Insufficient funds (decline_code: 51)",
        },
        {
            "payment_id": "fail_2",
            "invoice_id": "inv_301",
            "amount": 0.0,
            "payment_date": "2026-10-18",
            "notes": "Transaction rejected: Card limit exceeded",
        },
    ]
    subscriptions = [
        {
            "id": "sub_301",
            "customer_id": "c300",
            "status": "ACTIVE",
            "recurring_amount": 60000.0,
        }
    ]

    report = run_autonomous_recovery_agent(
        customer=customer,
        invoices=invoices,
        payments=payments,
        subscriptions=subscriptions,
        reference_date=REF_DATE,
    )

    validated = AgenticActionReport(**report)
    assert validated.mitigation_plan.plan_type == PlanType.MANUAL_REVIEW
    assert validated.mitigation_plan.priority in (PriorityLevel.CRITICAL, PriorityLevel.HIGH)
    assert validated.churn["probability"] >= 65
    assert validated.requires_human_approval is True

    # Validate signal presence
    signal_types = [s.type for s in validated.signals]
    assert SignalType.PAYMENT_FAILURE.value in signal_types
    assert validated.mitigation_plan.execution_preview["action_type"] == "MANUAL_RECONCILIATION"


# =============================================================================
# SCENARIO 4: High-Value Renewal Proximity
# =============================================================================

def test_scenario_4_high_value_renewal_rescue():
    """Customer with high-value contract expiring in 5 days, all current invoices settled."""
    customer = {"id": "c400", "name": "Delta Enterprise Cloud"}
    invoices = [
        {
            "id": "inv_401",
            "customer_id": "c400",
            "amount": 80000.0,
            "amount_paid": 80000.0,
            "status": "PAID",
            "due_date": "2026-09-30",
        }
    ]
    subscriptions = [
        {
            "id": "sub_401",
            "customer_id": "c400",
            "plan_name": "Enterprise Strategic Cloud",
            "status": "ACTIVE",
            "recurring_amount": 960000.0,  # High value contract
            "billing_interval": "YEARLY",
            "next_billing_date": "2026-11-05",  # 5 days away from 2026-10-31
            "end_date": "2026-11-05",
        }
    ]

    report = run_autonomous_recovery_agent(
        customer=customer,
        invoices=invoices,
        subscriptions=subscriptions,
        reference_date=REF_DATE,
    )

    validated = AgenticActionReport(**report)
    assert validated.mitigation_plan.plan_type == PlanType.RENEWAL_RESCUE
    assert validated.financial_impact.projected_revenue_protected == 960000.0
    assert validated.financial_impact.potential_revenue_impact == 0.0  # Invoices are paid
    assert validated.mitigation_plan.priority in (PriorityLevel.HIGH, PriorityLevel.MEDIUM)
    assert validated.mitigation_plan.execution_preview["incentive_eligible"] is True

    signal_types = [s.type for s in validated.signals]
    assert SignalType.EXPIRING_SUBSCRIPTION.value in signal_types


# =============================================================================
# SCENARIO 5: Portfolio Priority Ranking
# =============================================================================

def test_scenario_5_portfolio_ranking():
    """Rank multiple customers across portfolio by priority tier and revenue at risk."""
    customers = [
        {"id": "cust_healthy", "name": "Healthy Customer"},
        {"id": "cust_critical_large", "name": "Mega Corp Overdue"},
        {"id": "cust_moderate_overdue", "name": "Small Biz Overdue"},
        {"id": "cust_renewal", "name": "Renewal Approaching"},
    ]

    invoices = [
        # Mega Corp: 120,000 overdue by 35 days
        {
            "id": "inv_crit",
            "customer_id": "cust_critical_large",
            "amount": 120000.0,
            "amount_paid": 0.0,
            "status": "OVERDUE",
            "due_date": "2026-09-26",
        },
        # Small Biz: 8,000 overdue by 5 days
        {
            "id": "inv_mod",
            "customer_id": "cust_moderate_overdue",
            "amount": 8000.0,
            "amount_paid": 0.0,
            "status": "OVERDUE",
            "due_date": "2026-10-26",
        },
        # Healthy: fully paid
        {
            "id": "inv_hlth",
            "customer_id": "cust_healthy",
            "amount": 15000.0,
            "amount_paid": 15000.0,
            "status": "PAID",
            "due_date": "2026-10-15",
        },
    ]

    subscriptions = [
        {
            "id": "sub_hlth",
            "customer_id": "cust_healthy",
            "status": "ACTIVE",
            "recurring_amount": 15000.0,
            "next_billing_date": "2026-12-01",
        },
        {
            "id": "sub_crit",
            "customer_id": "cust_critical_large",
            "status": "ACTIVE",
            "recurring_amount": 120000.0,
            "next_billing_date": "2026-11-20",
        },
        {
            "id": "sub_mod",
            "customer_id": "cust_moderate_overdue",
            "status": "ACTIVE",
            "recurring_amount": 8000.0,
            "next_billing_date": "2026-11-26",
        },
        {
            "id": "sub_ren",
            "customer_id": "cust_renewal",
            "status": "ACTIVE",
            "recurring_amount": 250000.0,
            "next_billing_date": "2026-11-04",  # 4 days away
        },
    ]

    ranked = rank_customer_portfolio(
        customers=customers,
        invoices=invoices,
        subscriptions=subscriptions,
        reference_date=REF_DATE,
    )

    assert len(ranked) == 4
    # The first item MUST be the highest priority risk (Mega Corp Overdue)
    assert ranked[0]["customer_id"] == "cust_critical_large"
    assert ranked[0]["financial_impact"]["potential_revenue_impact"] == 120000.0

    # The last item MUST be the healthy customer
    assert ranked[-1]["customer_id"] == "cust_healthy"
    assert ranked[-1]["mitigation_plan"]["plan_type"] == PlanType.MONITOR.value


# =============================================================================
# SCENARIO 6: Backward Compatibility & Human In The Loop Governance
# =============================================================================

def test_scenario_6_backward_compatibility():
    """Ensure legacy analyze_revenue and process_subscription_billing continue functioning."""
    payload = {
        "subscriptions": [
            {
                "id": "sub_legacy",
                "customer_name": "Legacy Corp",
                "status": "ACTIVE",
                "recurring_amount": 10000.0,
                "next_billing_date": "2026-10-31",
            }
        ],
        "invoices": [],
    }

    report = analyze_revenue(payload, reference_date=REF_DATE)
    assert "summary" in report
    assert "actions" in report
    assert isinstance(report["actions"], list)

    billing = process_subscription_billing(payload["subscriptions"][0], reference_date=REF_DATE)
    assert "billing_allowed" in billing
    assert billing["billing_allowed"] is True

