import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.connection import Base, get_db
from app.database.models import User, UserRole
from app.core.security import hash_password
from app.main import app

# Shared in-memory SQLite using StaticPool so all connections share the same in-memory DB
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    
    # Pre-seed Admin and Customer for auth tests
    admin = User(
        name="Admin User",
        email="admin@revora.com",
        password_hash=hash_password("Admin@1234"),
        role=UserRole.ADMIN
    )
    customer = User(
        name="Customer User",
        email="customer@revora.com",
        password_hash=hash_password("Customer@1234"),
        role=UserRole.CUSTOMER
    )
    session.add(admin)
    session.add(customer)
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

# 1. Health Endpoint Test
def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "revora-backend"
    }

# 2. Signup and Login Tests
def test_auth_signup_and_login(client):
    signup_data = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "Valid@Password123"
    }
    res = client.post("/api/auth/signup", json=signup_data)
    assert res.status_code == 201
    assert res.json()["success"] is True
    assert res.json()["data"]["email"] == "jane@example.com"
    assert res.json()["data"]["role"] == "CUSTOMER"

    login_res = client.post("/api/auth/login", json={
        "email": "jane@example.com",
        "password": "Valid@Password123"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()["data"]

# 3. Invalid Password Rejection
def test_invalid_password_rejection(client):
    res = client.post("/api/auth/signup", json={
        "name": "Short", "email": "short@ex.com", "password": "Sh1!"
    })
    assert res.status_code == 422

    res = client.post("/api/auth/signup", json={
        "name": "NoUpper", "email": "noupper@ex.com", "password": "password123!"
    })
    assert res.status_code == 422

    res = client.post("/api/auth/signup", json={
        "name": "NoLower", "email": "nolower@ex.com", "password": "PASSWORD123!"
    })
    assert res.status_code == 422

    res = client.post("/api/auth/signup", json={
        "name": "NoSpec", "email": "nospec@ex.com", "password": "Password1234"
    })
    assert res.status_code == 422

# 4. Role Protection & Customer Cannot Self-Promote to Admin
def test_customer_cannot_self_promote_to_admin(client):
    signup_data = {
        "name": "Hacker",
        "email": "hacker@example.com",
        "password": "Password@123",
        "role": "ADMIN"
    }
    # Unauthenticated signup attempting ADMIN role is forbidden (403)
    res = client.post("/api/auth/signup", json=signup_data)
    assert res.status_code == 403
    assert "Admin privileges required" in res.json()["message"]

# 5. Product Management & Staff/Admin Restrictions
def test_product_crud_and_permissions(client):
    admin_token = get_auth_token(client, "admin@revora.com", "Admin@1234")
    cust_token = get_auth_token(client, "customer@revora.com", "Customer@1234")

    prod_data = {
        "name": "SaaS Enterprise",
        "product_type": "SERVICE",
        "sales_price": 5000.0,
        "cost_price": 1000.0,
        "description": "Enterprise Tier",
        "variants": [{"name": "Priority Support", "additional_price": 500.0}]
    }
    res = client.post("/api/products", json=prod_data, headers={"Authorization": f"Bearer {cust_token}"})
    assert res.status_code == 403

    res_admin = client.post("/api/products", json=prod_data, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 201
    prod_id = res_admin.json()["data"]["id"]

    res_get = client.get(f"/api/products/{prod_id}", headers={"Authorization": f"Bearer {cust_token}"})
    assert res_get.status_code == 200
    assert res_get.json()["data"]["name"] == "SaaS Enterprise"
    assert len(res_get.json()["data"]["variants"]) == 1

# 6. Plan Creation & Validation
def test_plan_validation(client):
    admin_token = get_auth_token(client, "admin@revora.com", "Admin@1234")

    plan_data = {
        "name": "Monthly Pro",
        "billing_frequency": "MONTHLY",
        "price": 1000.0,
        "minimum_quantity": 1
    }
    res = client.post("/api/plans", json=plan_data, headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 201
    assert res.json()["data"]["price"] == 1000.0

    invalid_plan = {
        "name": "Invalid Plan",
        "billing_frequency": "MONTHLY",
        "price": 100.0,
        "minimum_quantity": 1,
        "available_from": "2026-12-01T00:00:00",
        "available_until": "2026-11-01T00:00:00"
    }
    res_invalid = client.post("/api/plans", json=invalid_plan, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_invalid.status_code == 422

# 7. Quotation Calculations and Customer Isolation
def test_quotation_calculations_and_isolation(client):
    admin_token = get_auth_token(client, "admin@revora.com", "Admin@1234")
    cust_token = get_auth_token(client, "customer@revora.com", "Customer@1234")

    prod_res = client.post("/api/products", json={
        "name": "Cloud API", "product_type": "SERVICE", "sales_price": 200.0, "cost_price": 50.0
    }, headers={"Authorization": f"Bearer {admin_token}"})
    prod_id = prod_res.json()["data"]["id"]

    # Customer ID 2 is customer@revora.com
    quote_data = {
        "customer_id": 2,
        "items": [{"product_id": prod_id, "product_name": "Cloud API", "quantity": 10, "unit_price": 200.0}],
        "discount": 200.0,
        "tax_rate": 0.18
    }
    res = client.post("/api/quotations", json=quote_data, headers={"Authorization": f"Bearer {cust_token}"})
    assert res.status_code == 201
    q = res.json()["data"]
    assert q["subtotal"] == 2000.0
    assert q["discount"] == 200.0
    assert q["tax"] == 324.0
    assert q["total"] == 2124.0

    res_fail = client.post("/api/quotations", json={
        "customer_id": 1,
        "items": [{"product_id": prod_id, "product_name": "Cloud API", "quantity": 1, "unit_price": 200.0}],
    }, headers={"Authorization": f"Bearer {cust_token}"})
    assert res_fail.status_code == 403

# 8. Subscription Lifecycle Transitions & Validations
def test_subscription_lifecycle_and_transitions(client):
    admin_token = get_auth_token(client, "admin@revora.com", "Admin@1234")
    cust_token = get_auth_token(client, "customer@revora.com", "Customer@1234")

    plan_res = client.post("/api/plans", json={
        "name": "Quarterly Plan", "billing_frequency": "MONTHLY", "price": 1500.0, "minimum_quantity": 2
    }, headers={"Authorization": f"Bearer {admin_token}"})
    plan_id = plan_res.json()["data"]["id"]

    res_min = client.post("/api/subscriptions", json={
        "customer_id": 2, "plan_id": plan_id, "quantity": 1
    }, headers={"Authorization": f"Bearer {cust_token}"})
    assert res_min.status_code == 400

    sub_res = client.post("/api/subscriptions", json={
        "customer_id": 2, "plan_id": plan_id, "quantity": 2
    }, headers={"Authorization": f"Bearer {cust_token}"})
    assert sub_res.status_code == 201
    sub_id = sub_res.json()["data"]["id"]
    assert sub_res.json()["data"]["status"] == "DRAFT"

    pause_fail = client.post(f"/api/subscriptions/{sub_id}/pause", headers={"Authorization": f"Bearer {cust_token}"})
    assert pause_fail.status_code == 400

    act_res = client.post(f"/api/subscriptions/{sub_id}/activate", headers={"Authorization": f"Bearer {cust_token}"})
    assert act_res.status_code == 200
    assert act_res.json()["data"]["status"] == "ACTIVE"
    assert act_res.json()["data"]["current_period_end"] is not None

    act_again = client.post(f"/api/subscriptions/{sub_id}/activate", headers={"Authorization": f"Bearer {cust_token}"})
    assert act_again.status_code == 400

    p_res = client.post(f"/api/subscriptions/{sub_id}/pause", headers={"Authorization": f"Bearer {cust_token}"})
    assert p_res.status_code == 200
    assert p_res.json()["data"]["status"] == "PAUSED"

    res_res = client.post(f"/api/subscriptions/{sub_id}/resume", headers={"Authorization": f"Bearer {cust_token}"})
    assert res_res.status_code == 200
    assert res_res.json()["data"]["status"] == "ACTIVE"

    close_res = client.post(f"/api/subscriptions/{sub_id}/close", headers={"Authorization": f"Bearer {cust_token}"})
    assert close_res.status_code == 200
    assert close_res.json()["data"]["status"] == "CLOSED"

    assert client.post(f"/api/subscriptions/{sub_id}/pause", headers={"Authorization": f"Bearer {cust_token}"}).status_code == 400
    assert client.post(f"/api/subscriptions/{sub_id}/resume", headers={"Authorization": f"Bearer {cust_token}"}).status_code == 400

# 9. Invoices and Payment Processing (Partial & Full)
def test_invoice_and_payment_flow(client):
    admin_token = get_auth_token(client, "admin@revora.com", "Admin@1234")

    inv_data = {
        "customer_id": 2,
        "items": [{"description": "Platform Access", "quantity": 1, "unit_price": 10000.0}],
        "discount": 0.0,
        "tax_rate": 0.0,
        "due_date": "2026-12-31T00:00:00"
    }
    inv_res = client.post("/api/invoices", json=inv_data, headers={"Authorization": f"Bearer {admin_token}"})
    assert inv_res.status_code == 201
    inv = inv_res.json()["data"]
    inv_id = inv["id"]
    assert inv["total"] == 10000.0
    assert inv["outstanding_amount"] == 10000.0

    conf_res = client.post(f"/api/invoices/{inv_id}/confirm", headers={"Authorization": f"Bearer {admin_token}"})
    assert conf_res.status_code == 200
    assert conf_res.json()["data"]["status"] == "CONFIRMED"

    # Payment 1: Partial ₹6,000
    pmt1 = client.post("/api/payments", json={
        "invoice_id": inv_id,
        "payment_method": "UPI",
        "amount": 6000.0
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert pmt1.status_code == 201

    chk1 = client.get(f"/api/invoices/{inv_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert chk1.json()["data"]["paid_amount"] == 6000.0
    assert chk1.json()["data"]["outstanding_amount"] == 4000.0
    assert chk1.json()["data"]["status"] == "OUTSTANDING"

    # Reject Overpayment
    pmt_over = client.post("/api/payments", json={
        "invoice_id": inv_id,
        "payment_method": "UPI",
        "amount": 5000.0
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert pmt_over.status_code == 400

    # Payment 2: Full balance ₹4,000
    pmt2 = client.post("/api/payments", json={
        "invoice_id": inv_id,
        "payment_method": "BANK_TRANSFER",
        "amount": 4000.0
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert pmt2.status_code == 201

    chk2 = client.get(f"/api/invoices/{inv_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert chk2.json()["data"]["paid_amount"] == 10000.0
    assert chk2.json()["data"]["outstanding_amount"] == 0.0
    assert chk2.json()["data"]["status"] == "PAID"

# 10. Dashboard and Intelligence Integration
def test_dashboard_and_intelligence(client):
    admin_token = get_auth_token(client, "admin@revora.com", "Admin@1234")

    dash_res = client.get("/api/dashboard/summary", headers={"Authorization": f"Bearer {admin_token}"})
    assert dash_res.status_code == 200
    dash_data = dash_res.json()["data"]
    assert "active_subscriptions" in dash_data
    assert "total_revenue" in dash_data
    assert "outstanding_amount" in dash_data
    assert "overdue_amount" in dash_data
    assert "recent_invoices" in dash_data

    intel_res = client.get("/api/intelligence/actions", headers={"Authorization": f"Bearer {admin_token}"})
    assert intel_res.status_code == 200
    intel_data = intel_res.json()["data"]
    assert "actions" in intel_data
