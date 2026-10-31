#!/usr/bin/env python3
"""
REVORA Action Center & Autonomous Recovery Ledger - Test Suite
Engineer: Krishna (Database & Persistence Engineer)
Description: Verifies persistent action records, status transitions, snooze persistence,
recovery execution logging, financial outcome separation, and recovery metrics calculations.
"""

import sys
import os
import unittest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.connection import Base
from app.database.models import (
    User, UserRole, Product, ProductType, ProductStatus,
    Plan, BillingFrequency, PlanStatus,
    Invoice, InvoiceStatus, Subscription, SubscriptionStatus,
    ActionRecord, RecoveryExecutionLog, ActionStatus, ActionPriority, ExecutionStatus
)
from app.repositories.action_repository import ActionRepository


class TestActionPersistence(unittest.TestCase):
    """Test suite for Krishna's Persistent Action & Recovery Ledger."""

    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool
        )
        Base.metadata.create_all(bind=cls.engine)
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        self.db = self.SessionLocal()

    def tearDown(self):
        self.db.rollback()
        self.db.close()

    def test_01_create_and_retrieve_action_record(self):
        """Test Action Persistence: Create Action -> Save -> Retrieve."""
        # 1. Create a customer user for relationship
        customer = User(
            email="brighttech@corp.io",
            name="BrightTech Enterprise",
            password_hash="hashed_pw_123",
            role=UserRole.CUSTOMER
        )
        self.db.add(customer)
        self.db.commit()

        # 2. Persist an ActionRecord
        action = ActionRepository.create_action(
            db=self.db,
            action_id="ACT-101",
            title="High-value payment overdue: INV-1042",
            action_type="PAYMENT_RISK",
            description="Invoice past due by 12 days; risk score elevated",
            priority=ActionPriority.CRITICAL,
            risk_score=92,
            customer_id=customer.id,
            customer_name=customer.name,
            potential_revenue_impact=48000.0,
            recommended_action="Execute Smart Dunning Sequence & Grace Period Notice"
        )
        self.assertIsNotNone(action.id)
        self.assertEqual(action.action_id, "ACT-101")
        self.assertEqual(action.status, ActionStatus.OPEN)

        # 3. Retrieve by action_id code and verify
        retrieved = ActionRepository.get_action(self.db, "ACT-101")
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.title, "High-value payment overdue: INV-1042")
        self.assertEqual(retrieved.risk_score, 92)
        self.assertEqual(retrieved.priority, ActionPriority.CRITICAL)
        self.assertEqual(retrieved.potential_revenue_impact, 48000.0)
        self.assertEqual(retrieved.customer.name, "BrightTech Enterprise")

    def test_02_status_transitions(self):
        """Test Status Updates: OPEN -> IN_PROGRESS -> RESOLVED."""
        action = ActionRepository.create_action(
            db=self.db,
            action_id="ACT-102",
            title="Subscription #44 Renewal Churn Risk",
            action_type="RENEWAL_RISK",
            priority=ActionPriority.HIGH,
            risk_score=75,
            potential_revenue_impact=120000.0
        )
        self.assertEqual(action.status, ActionStatus.OPEN)

        # Transition to IN_PROGRESS
        updated = ActionRepository.update_action_status(self.db, "ACT-102", ActionStatus.IN_PROGRESS)
        self.assertEqual(updated.status, ActionStatus.IN_PROGRESS)

        # Transition to RESOLVED with audit notes
        resolved = ActionRepository.resolve_action(
            self.db,
            action_id="ACT-102",
            resolution_notes="Customer confirmed annual renewal discount"
        )
        self.assertEqual(resolved.status, ActionStatus.RESOLVED)
        self.assertIsNotNone(resolved.resolved_at)
        self.assertEqual(resolved.resolution_notes, "Customer confirmed annual renewal discount")

    def test_03_snooze_persistence_and_filtering(self):
        """Test Snooze: Set snoozed_until -> Save -> Retrieve correctly & filter active queue."""
        snooze_target = datetime.utcnow() + timedelta(days=3)
        action = ActionRepository.create_action(
            db=self.db,
            action_id="ACT-103",
            title="Billing Anomaly Detected",
            action_type="BILLING_RISK",
            priority=ActionPriority.MEDIUM,
            risk_score=55,
            potential_revenue_impact=15000.0
        )

        # Snooze action
        snoozed = ActionRepository.snooze_action(
            db=self.db,
            action_id="ACT-103",
            snoozed_until=snooze_target,
            snooze_reason="Waiting for client procurement meeting on Friday"
        )
        self.assertEqual(snoozed.status, ActionStatus.SNOOZED)
        self.assertEqual(snoozed.snooze_reason, "Waiting for client procurement meeting on Friday")
        self.assertIsNotNone(snoozed.snoozed_at)

        # Verify active_only filter excludes active snoozed items
        active_items = ActionRepository.list_actions(self.db, active_only=True)
        active_ids = [a.action_id for a in active_items]
        self.assertNotIn("ACT-103", active_ids)

        # Reopen action
        reopened = ActionRepository.reopen_action(self.db, "ACT-103")
        self.assertEqual(reopened.status, ActionStatus.OPEN)
        self.assertIsNone(reopened.snoozed_until)

    def test_04_recovery_execution_log_and_financial_separation(self):
        """
        Test Recovery Log & Financial Separation:
        Create Execution -> Save projected outcome -> Save actual outcome -> Retrieve.
        Verifies potential_revenue_impact vs projected_recovery vs actual_recovered_amount.
        """
        action = ActionRepository.create_action(
            db=self.db,
            action_id="ACT-104",
            title="Overdue Invoice Recovery - TechNova",
            action_type="PAYMENT_RISK",
            priority=ActionPriority.CRITICAL,
            risk_score=95,
            potential_revenue_impact=120000.0
        )

        # Create mitigation execution
        log = ActionRepository.create_recovery_log(
            db=self.db,
            action_id="ACT-104",
            plan_type="DUNNING_NOTICE",
            financial_amount=120000.0,
            projected_recovery=114000.0, # 95% projected
            actual_recovered_amount=0.0,   # Cash not yet collected
            channel="OMNICHANNEL",
            notes="Dispatched automated WhatsApp and email dunning series with 7-day grace period",
            signals=["Overdue > 12 days", "Card decline on file"]
        )
        self.assertIsNotNone(log.id)
        self.assertEqual(log.financial_amount, 120000.0)
        self.assertEqual(log.projected_recovery, 114000.0)
        self.assertEqual(log.actual_recovered_amount, 0.0) # Projected is NOT actual cash!

        # Action is auto-resolved upon mitigation execution
        action_refreshed = ActionRepository.get_action(self.db, "ACT-104")
        self.assertEqual(action_refreshed.status, ActionStatus.RESOLVED)

        # Record actual cash collected when customer wire clears
        updated_log = ActionRepository.record_recovery_outcome(
            db=self.db,
            execution_id=log.execution_id,
            actual_recovered_amount=120000.0,
            notes="Customer wired full payment via RTGS"
        )
        self.assertEqual(updated_log.actual_recovered_amount, 120000.0)

    def test_05_recovery_metrics_calculation(self):
        """Test calculation of authentic recovery metrics directly from persisted records."""
        # Clean state for metrics check
        self.db.query(RecoveryExecutionLog).delete()
        self.db.query(ActionRecord).delete()
        self.db.commit()

        # Action 1: Open critical risk
        ActionRepository.create_action(
            db=self.db, action_id="MET-01", title="Risk 1",
            status=ActionStatus.OPEN, potential_revenue_impact=50000.0
        )
        # Action 2: In Progress
        ActionRepository.create_action(
            db=self.db, action_id="MET-02", title="Risk 2",
            status=ActionStatus.IN_PROGRESS, potential_revenue_impact=30000.0
        )
        # Action 3: Executed & Recovered
        act3 = ActionRepository.create_action(
            db=self.db, action_id="MET-03", title="Risk 3",
            status=ActionStatus.OPEN, potential_revenue_impact=100000.0
        )
        ActionRepository.create_recovery_log(
            db=self.db, action_id="MET-03", plan_type="RENEWAL_RESCUE",
            financial_amount=100000.0, projected_recovery=95000.0, actual_recovered_amount=95000.0,
            execution_status=ExecutionStatus.SUCCESS
        )

        # Action 4: Executed partially recovered
        act4 = ActionRepository.create_action(
            db=self.db, action_id="MET-04", title="Risk 4",
            status=ActionStatus.OPEN, potential_revenue_impact=60000.0
        )
        ActionRepository.create_recovery_log(
            db=self.db, action_id="MET-04", plan_type="DUNNING_NOTICE",
            financial_amount=60000.0, projected_recovery=60000.0, actual_recovered_amount=40000.0,
            execution_status=ExecutionStatus.SUCCESS
        )

        metrics = ActionRepository.calculate_recovery_metrics(self.db)
        
        # Verify: Total Actual Cash Recovered = 95000 + 40000 = 135,000.0
        self.assertEqual(metrics["total_revenue_recovered"], 135000.0)
        self.assertEqual(metrics["totalRevenueRecovered"], 135000.0)

        # Verify: ARR Protected = 95000 + 60000 = 155,000.0
        self.assertEqual(metrics["arr_protected"], 155000.0)

        # Verify: Active Actions = 2 (MET-01 and MET-02)
        self.assertEqual(metrics["active_recovery_actions"], 2)
        self.assertEqual(metrics["activeActions"], 2)

        # Verify: Mitigations Executed = 2
        self.assertEqual(metrics["mitigations_executed"], 2)
        self.assertEqual(metrics["mitigation_success_rate"], 100)

    def test_06_backward_compatibility_with_core_models(self):
        """Verify that existing core models (Product, Plan, Invoice, etc.) function flawlessly."""
        prod = Product(
            name="REVORA AI Suite",
            product_type=ProductType.SERVICE,
            sales_price=25000.0,
            cost_price=5000.0,
            status=ProductStatus.ACTIVE
        )
        plan = Plan(
            name="Pro Plan",
            billing_frequency=BillingFrequency.MONTHLY,
            price=25000.0,
            status=PlanStatus.ACTIVE
        )
        self.db.add_all([prod, plan])
        self.db.commit()

        self.assertIsNotNone(prod.id)
        self.assertIsNotNone(plan.id)
        self.assertEqual(prod.sales_price, 25000.0)
        self.assertEqual(plan.price, 25000.0)


if __name__ == "__main__":
    unittest.main()

