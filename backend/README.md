# REVORA — Subscription Revenue Intelligence Platform (Backend)

Core backend and subscription lifecycle service for **REVORA**, built using **FastAPI**, **SQLAlchemy**, **Pydantic v2**, and **Uvicorn**.

---

## 1. Required Python Version
- **Python 3.10+**

---

## 2. Environment Setup

Copy `.env.example` to create your local `.env` configuration:

```bash
cd backend
cp .env.example .env
```

Configuration variables available in `.env`:
- `APP_ENV`: Application environment (`development` / `production`).
- `SECRET_KEY`: Secret string used for JWT signature generation.
- `ALGORITHM`: Token algorithm (default `HS256`).
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Expiration time for access tokens (default `1440` / 24 hours).
- `DATABASE_URL`: Connection string (default `sqlite:///./revora.db`, supports PostgreSQL / MySQL).
- `FRONTEND_URL`: Allowed CORS origin for Harshitha's frontend (default `http://localhost:5173`).
- `PORT`: Server listening port (default `8000`).

---

## 3. Dependency Installation

Install backend requirements:

```bash
cd backend
pip install -r requirements.txt
```

---

## 4. Database Configuration & Models
The backend uses **SQLAlchemy** declarative models (`app/database/models.py`) mapping to the shared schema:
- `users`: Role-based authentication (`ADMIN`, `STAFF`, `CUSTOMER`).
- `products` & `product_variants`: Product catalog with pricing, cost, and variant add-on pricing.
- `plans`: Subscription plans with billing frequencies (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`).
- `quotations`: Customer quotations with backend-authoritative subtotals, discounts, taxes, and totals.
- `subscriptions`: Full subscription state machine with billing frequency and period management.
- `invoices`: Invoices with auto-generated unique IDs, period tracking, and payment balance management. Includes unique constraint `uq_sub_billing_period` (`subscription_id`, `billing_period_start`) for duplicate prevention.
- `payments`: Transaction records updating invoice balances and statuses (`OUTSTANDING`, `PAID`, `OVERDUE`).

Tables are automatically initialized upon startup.

---

## 5. Server Startup Command

Run the application with Uvicorn:

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 6. Swagger / OpenAPI Documentation
Once the server is running, explore interactive API documentation at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## 7. Test Execution Command

Run the full automated pytest suite:

```bash
cd backend
pytest tests/test_backend.py -v
```

All 10 test suites cover:
- Health check endpoint
- Customer signup and login
- Password strength validation (length, uppercase, lowercase, special characters)
- Admin privilege escalation prevention
- Role-based permissions (Customer vs Staff/Admin)
- Product & plan management and date validation
- Quotation calculations & customer data isolation
- Subscription lifecycle transitions (`DRAFT` → `ACTIVE` ↔ `PAUSED` → `CLOSED`)
- Invoices & payment processing (partial and full balance reconciliation)
- Finance dashboard aggregates & revenue intelligence adapter

---

## 8. API Endpoint Overview

### Health
- `GET /api/health` — Application health check.

### Authentication & Authorization
- `POST /api/auth/signup` — Register new user (defaults to `CUSTOMER`; `ADMIN` signup blocked without admin privileges).
- `POST /api/auth/login` — Authenticate and retrieve JWT token.
- `GET /api/auth/me` — Retrieve profile of authenticated user.

### Products
- `GET /api/products` — List products (with optional status filter).
- `POST /api/products` — Create product (Staff/Admin).
- `GET /api/products/{id}` — Get product details.
- `PUT /api/products/{id}` — Update product (Staff/Admin).
- `DELETE /api/products/{id}` — Safely archive product.

### Plans
- `GET /api/plans` — List subscription plans.
- `POST /api/plans` — Create plan (Staff/Admin).
- `GET /api/plans/{id}` — Get plan details.
- `PUT /api/plans/{id}` — Update plan (Staff/Admin).
- `DELETE /api/plans/{id}` — Safely archive plan.

### Quotations
- `GET /api/quotations` — List quotations (Customer sees only own quotations).
- `POST /api/quotations` — Create quotation with backend-calculated totals.
- `GET /api/quotations/{id}` — Get quotation details.
- `PUT /api/quotations/{id}` — Update quotation or accept quote.

### Subscriptions (Lifecycle Core)
- `GET /api/subscriptions` — List subscriptions.
- `POST /api/subscriptions` — Create subscription draft.
- `GET /api/subscriptions/{id}` — Get subscription details.
- `PUT /api/subscriptions/{id}` — Update subscription.
- `POST /api/subscriptions/{id}/activate` — Activate subscription.
- `POST /api/subscriptions/{id}/pause` — Pause active subscription.
- `POST /api/subscriptions/{id}/resume` — Resume paused subscription.
- `POST /api/subscriptions/{id}/renew` — Renew active/paused subscription.
- `POST /api/subscriptions/{id}/close` — Permanently close subscription.

### Invoices
- `GET /api/invoices` — List invoices.
- `POST /api/invoices` — Create invoice (Staff/Admin).
- `GET /api/invoices/{id}` — Get invoice details.
- `PUT /api/invoices/{id}` — Update invoice.
- `POST /api/invoices/{id}/confirm` — Confirm draft invoice.
- `POST /api/invoices/{id}/send` — Mark invoice as sent.
- `POST /api/invoices/{id}/cancel` — Cancel invoice (if unpaid).

### Payments
- `GET /api/payments` — List payments.
- `POST /api/payments` — Record payment against an invoice (updates balance atomically).
- `GET /api/payments/{id}` — Get payment details.

### Finance Dashboard
- `GET /api/dashboard/summary` — Returns active subscriptions, total revenue, outstanding/overdue amounts, upcoming renewals, and recent records.

### Intelligence Integration
- `GET /api/intelligence/actions` — Consumes actionable recommendations (overdue collections, churn mitigation).

---

## 9. Current Limitations
- Real payment gateway webhooks (e.g. Stripe/Razorpay) are not active in hackathon mode; staff-recorded payments are fully supported with transactional integrity.
- Email delivery for password resets and invoice dispatch outputs logged events rather than SMTP dispatch unless external SMTP credentials are provided.

---

## 10. Integration Instructions for Teammates

### Harshitha (Frontend & UX)
- Set your frontend API client base URL to `http://localhost:8000`.
- Store the JWT token from `POST /api/auth/login` and provide it in the `Authorization: Bearer <token>` header for private endpoints.
- Check `GET /docs` for request payload models and TypeScript type generation.

### Prasanth (Billing Automation & Revenue Intelligence)
- **Billing Automation**: Call `BillingEngineAdapter.identify_due_subscriptions(db)` to locate active subscriptions eligible for renewal, followed by `BillingEngineAdapter.bill_subscription_period(db, sub_id)`. The unique database constraint `uq_sub_billing_period` prevents double-invoicing across concurrent scheduler runs.
- **Revenue Intelligence**: Wire algorithm output directly into `app/services/intelligence_service.py` to populate `/api/intelligence/actions`.

### Krishna (Database & Finance Support)
- To connect PostgreSQL or MySQL, update `DATABASE_URL` in `backend/.env` (e.g. `postgresql+psycopg2://user:password@localhost:5432/revora_db`).
- All models in `app/database/models.py` utilize standard SQLAlchemy types and constraints ready for Alembic migration.

