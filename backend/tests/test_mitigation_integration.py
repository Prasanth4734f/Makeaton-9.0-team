import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.connection import Base, get_db
from app.database.models import (
    User, UserRole, Invoice, InvoiceStatus, Subscription, SubscriptionStatus, BillingFrequency, Plan, PlanStatus
)
from app.core.security import hash_password
from app.main import app
from app.services.mitigation_service import MitigationPersistenceManager

TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="function")
def db_session(tmp_path):
    # Set isolated SQLite store for test
    temp_store = str(tmp_path / "test_revora.db")
    MitigationPersistenceManager._db_path = temp_store
    MitigationPersistenceManager.init_tables()

    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()

    # Pre-seed Admin, Staff, and Customer users
    admin = User(
        name="Admin User",
        email="admin@revora.com",
        password_hash=hash_password("Admin@1234"),
        role=UserRole.ADMIN
    )
    staff = User(
        name="Staff User",
        email="staff@revora.com",
        password_hash=hash_password("Staff@1234"),
        role=UserRole.STAFF
    )
    customer = User(
        name="Acme Corp Client",
        email="customer@acme.com",
        password_hash=hash_password("Customer@1234"),
        role=UserRole.CUSTOMER
    )
    session.add_all([admin, staff, customer])
    session.commit()

    # Seed a plan
    plan = Plan(
        name="Enterprise Cloud",
        billing_frequency=BillingFrequency.MONTHLY,
        price=59000.0,
        minimum_quantity=1,
        status=PlanStatus.ACTIVE
    )
    session.add(plan)
    session.commit()

    # Seed an overdue invoice to trigger PAYMENT_RISK action in intelligence engine
    now = datetime.utcnow()
    inv = Invoice(
        invoice_number="INV-TEST-001",
        customer_id=customer.id,
        billing_period_start=now - timedelta(days=45),
        billing_period_end=now - timedelta(days=15),
        items='[{"description": "Cloud Service", "quantity": 1, "unit_price": 59000.0}]',
        subtotal=59000.0,
        discount=0.0,
        tax=0.0,
        total=59000.0,
        paid_amount=0.0,
        outstanding_amount=59000.0,
        issue_date=now - timedelta(days=30),
        due_date=now - timedelta(days=15),
        status=InvoiceStatus.OVERDUE
    )
    session.add(inv)

    # Seed an active subscription with past next_billing_date to trigger BILLING_RISK
    sub = Subscription(
        customer_id=customer.id,
        plan_id=plan.id,
        status=SubscriptionStatus.ACTIVE,
        current_period_start=now - timedelta(days=35),
        current_period_end=now + timedelta(days=2),
        next_billing_date=now - timedelta(days=5),
        billing_frequency=BillingFrequency.MONTHLY,
        price=59000.0,
        quantity=1
    )
    session.add(sub)
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def get_auth_token(client: TestClient, email: str, password: str) -> str:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["data"]["access_token"]


# Test 1: Authentication & RBAC on Mitigation APIs
def test_mitigation_auth_and_rbac(client):
    # Unauthenticated request -> 401
    res = client.get("/api/intelligence/actions/ACT-001/mitigation-plan")
    assert res.status_code == 401

    res = client.post("/api/intelligence/actions/ACT-001/execute")
    assert res.status_code == 401

    res = client.get("/api/intelligence/recovery-metrics")
    assert res.status_code == 401

    # Customer user (unauthorized role) -> 403 Forbidden
    cust_token = get_auth_token(client, "customer@acme.com", "Customer@1234")
    res = client.get("/api/intelligence/actions/ACT-001/mitigation-plan", headers={"Authorization": f"Bearer {cust_token}"})
    assert res.status_code == 403

    res = client.post("/api/intelligence/actions/ACT-001/execute", headers={"Authorization": f"Bearer {cust_token}"})
    assert res.status_code == 403

    res = client.get("/api/intelligence/recovery-metrics", headers={"Authorization": f"Bearer {cust_token}"})
    assert res.status_code == 403

    # Staff user -> 200 OK
    staff_token = get_auth_token(client, "staff@revora.com", "Staff@1234")
    res_actions = client.get("/api/intelligence/actions", headers={"Authorization": f"Bearer {staff_token}"})
    assert res_actions.status_code == 200


# Test 2: Backward Compatibility of /api/intelligence/actions
def test_backward_compatibility_actions(client):
    admin_token = get_auth_token(client, "admin@revora.com", "Admin@1234")
    res = client.get("/api/intelligence/actions", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "actions" in data["data"]
    assert len(data["data"]["actions"]) >= 1


# Test 3: API 1 - Get Mitigation Plan (Valid & Invalid Action ID)
def test_get_mitigation_plan(client):
    admin_token = get_auth_token(client, "admin@revora.com", "Admin@1234")

    # Invalid Action ID -> 404
    res_invalid = client.get("/api/intelligence/actions/ACT-999/mitigation-plan", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_invalid.status_code == 404

    # Valid Action ID -> Returns Prasanth's intelligence engine plan
    res = client.get("/api/intelligence/actions/ACT-001/mitigation-plan", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    plan_data = res.json()["data"]
    assert plan_data["action_id"] == "ACT-001"
    assert "risk" in plan_data
    assert "churn" in plan_data
    assert "financial_impact" in plan_data
    assert "mitigation_plan" in plan_data
    assert plan_data["requires_human_approval"] is True
    assert plan_data["financial_impact"]["potential_revenue_impact"] > 0
    assert plan_data["mitigation_plan"]["confidence"] > 0


# Test 4: API 2 - Execute Mitigation (Requires explicit POST, performs genuine state transition)
def test_execute_mitigation(client):
    admin_token = get_auth_token(client, "admin@revora.com", "Admin@1234")

    # Explicit POST execution
    res = client.post(
        "/api/intelligence/actions/ACT-001/execute",
        json={"note": "Verified customer phone conversation and approved dunning notice."},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    exec_data = res.json()["data"]
    assert exec_data["action_id"] == "ACT-001"
    assert exec_data["status"] == "EXECUTED"
    assert exec_data["execution_status"] == "SUCCESS"
    assert exec_data["executed_by"] == "admin@revora.com"
    assert "details" in exec_data


# Test 5: API 3 - Resolve Action
def test_resolve_action(client):
    admin_token = get_auth_token(client, "admin@revora.com", "Admin@1234")

    res = client.post(
        "/api/intelligence/actions/ACT-001/resolve",
        json={"resolution_note": "Payment settled offline via wire transfer."},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["action_id"] == "ACT-001"
    assert data["status"] == "RESOLVED"
    assert data["resolved_by"] == "admin@revora.com"

    # Cannot re-execute a resolved action
    res_exec = client.post(
        "/api/intelligence/actions/ACT-001/execute",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_exec.status_code == 400


# Test 6: API 4 - Snooze Action & Validation
def test_snooze_action(client):
    admin_token = get_auth_token(client, "admin@revora.com", "Admin@1234")

    # Invalid snooze days (> 90) -> 422
    res_bad = client.post(
        "/api/intelligence/actions/ACT-001/snooze",
        json={"duration_days": 180},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_bad.status_code == 422

    # Valid snooze
    res = client.post(
        "/api/intelligence/actions/ACT-001/snooze",
        json={"duration_days": 14, "reason": "Customer CFO on annual leave."},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["action_id"] == "ACT-001"
    assert data["status"] == "SNOOZED"
    assert "snoozed_until" in data


# Test 7: API 5 - Recovery Metrics Calculation
def test_recovery_metrics(client):
    admin_token = get_auth_token(client, "admin@revora.com", "Admin@1234")

    # Execute mitigation to create real execution log
    client.post(
        "/api/intelligence/actions/ACT-001/execute",
        json={"note": "Approved dunning escalation."},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    # Fetch metrics
    res = client.get("/api/intelligence/recovery-metrics", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    metrics = res.json()["data"]
    assert "total_revenue_recovered" in metrics
    assert "revenue_protected" in metrics
    assert "mitigation_success_rate" in metrics
    assert "active_recovery_actions" in metrics
    assert metrics["mitigation_success_rate"] == 100.0
    assert metrics["total_revenue_recovered"] > 0 or metrics["revenue_protected"] > 0
