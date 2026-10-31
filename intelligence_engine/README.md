# 🧠 Revora — Billing Automation & Revenue Intelligence Engine

**Manage subscriptions. Automate billing. Protect recurring revenue.**

> **Module Owner:** Prasanth (Billing Automation & Revenue Intelligence Engineer)  
> **Package Directory:** `intelligence_engine/`  
> **Integration Target:** Sai (`backend/`), Krishna (`database/`), Harshitha (`frontend/`)

---

## 1. Purpose & Architectural Overview

The **Intelligence Engine** is the core operational and analytical brain of the Revora Subscription Revenue Intelligence Platform. It executes two mission-critical systems:

1. **Billing Automation Engine (System 1):** Automates recurring subscription billing calculations, detects billing dues/overdues, enforces strict duplicate invoice prevention, evaluates multi-tier discounts (percentage & fixed), and calculates configurable taxes (e.g. GST) to prepare deterministic billing instructions without directly touching database tables.
2. **Revenue Intelligence Engine & Revenue Action Center (System 2 — Revora's Unique Differentiator):** Moves beyond static dashboard metrics ("*what happened*") by proactively determining **what needs attention right now and why**, applying a deterministic, explainable 0–100 priority scoring model across payment risks, contract renewal hazards, and unbilled revenue leakages.

### Architecture & Boundary Map

```text
[Database / Krishna Queries]
             ↓
[Sai's FastAPI Backend Services]
             ↓
[intelligence_engine.adapters.DataAdapter]
             ↓
    ┌────────────────────────────────────────────────────────┐
    │              REVORA INTELLIGENCE ENGINE                │
    │                                                        │
    │   🔄 SYSTEM 1: BILLING AUTOMATION                      │
    │      ├── Billing Scheduler                             │
    │      ├── Duplicate Checker                             │
    │      ├── Discount Evaluator                            │
    │      ├── Tax Calculator                                │
    │      └── Billing Processor                             │
    │                                                        │
    │   🧠 SYSTEM 2: REVENUE INTELLIGENCE (ACTION CENTER)    │
    │      ├── Overdue Payment Detector                      │
    │      ├── Contract Renewal Detector                     │
    │      ├── Billing Leakage Risk Detector                 │
    │      ├── Explainable Priority Scoring (0-100)          │
    │      └── Revenue Action Analyzer                       │
    └────────────────────────────────────────────────────────┘
             ↓
[Structured JSON Response] ──> [Sai Backend Route] ──> [Harshitha React UI]
```

---

## 2. Folder Structure

```text
intelligence_engine/
│
├── __init__.py                      # Package entry point & version
├── README.md                        # Complete module & integration guide
├── requirements.txt                 # Dependencies (pydantic, pytest)
│
├── engine/                          # Revenue Intelligence System
│   ├── __init__.py
│   ├── revenue_analyzer.py          # Action item generator & priority ranker
│   ├── priority_scoring.py          # Deterministic 0-100 explainable scoring
│   ├── overdue_detector.py          # Overdue & outstanding payment detection
│   ├── renewal_detector.py          # Subscription expiry & renewal windows
│   └── billing_risk_detector.py     # Unbilled active subscription risk detection
│
├── automation/                      # Billing Automation System
│   ├── __init__.py
│   ├── billing_scheduler.py         # Schedule verification (NOT_DUE, DUE, OVERDUE)
│   ├── duplicate_checker.py         # Duplicate billing cycle prevention guard
│   ├── discount_evaluator.py        # Percentage & fixed discount validator
│   ├── tax_calculator.py            # Configurable tax calculation (GST, VAT)
│   └── billing_processor.py         # End-to-end billing execution pipeline
│
├── services/                        # Clean Public API for Sai's Backend
│   ├── __init__.py
│   └── intelligence_service.py      # analyze_revenue() & process_subscription_billing()
│
├── schemas/                         # Strongly-typed Pydantic data models
│   ├── __init__.py
│   └── intelligence_schema.py       # Input/output schemas & enums
│
├── adapters/                        # Robust Payload Normalizer
│   ├── __init__.py
│   └── data_adapter.py              # Resilient mapper for backend/database dictionaries
│
├── demo/                            # Standalone Demo Runner
│   ├── __init__.py
│   └── demo_data.py                 # Realistic connected business dataset
│
└── tests/                           # Comprehensive Pytest Suite
    ├── __init__.py
    ├── test_billing_engine.py       # Billing scheduler, discounts, taxes & pipeline tests
    └── test_intelligence_engine.py  # Detector, scoring, sorting & adapter tests
```

---

## 3. Input Data Formats

The engine is completely decoupled from database drivers and ORMs. It ingests standard Python dictionaries or Pydantic models. Flexible field aliases are supported via `DataAdapter`:

```python
payload = {
    "subscriptions": [
        {
            "subscription_id": "SUB-TN-101",        # Also accepts 'id', 'sub_id'
            "customer_name": "TechNova Solutions",   # Also accepts 'customer', 'client_name'
            "status": "ACTIVE",                      # DRAFT, QUOTATION, CONFIRMED, ACTIVE, CLOSED
            "billing_frequency": "YEARLY",           # DAILY, WEEKLY, MONTHLY, YEARLY
            "start_date": "2025-11-05",
            "next_billing_date": "2026-11-05",
            "expiry_date": "2026-11-05",
            "unit_price": 10000.0,
            "quantity": 12.0,
            "total_amount": 120000.0,
            "products": [
                {
                    "product_id": "PROD-ENT",
                    "product_name": "Enterprise Cloud ERP",
                    "unit_price": 9500.0,
                    "variant_name": "Multi-Region (+500)",
                    "variant_price": 500.0,
                    "quantity": 12.0
                }
            ],
            "discount": {                            # Optional discount rule
                "type": "PERCENTAGE",                # PERCENTAGE or FIXED
                "value": 10.0,
                "min_purchase_amount": 5000.0,
                "start_date": "2026-10-01",
                "end_date": "2026-12-31",
                "is_active": True
            },
            "tax_rate": 18.0                         # Configurable percentage (default 18.0)
        }
    ],
    "invoices": [
        {
            "invoice_id": "INV-1042",                # Also accepts 'id', 'inv_id'
            "subscription_id": "SUB-BT-202",
            "customer_name": "BrightTech Innovations",
            "billing_period_start": "2026-09-01",
            "billing_period_end": "2026-09-30",
            "issue_date": "2026-10-01",
            "due_date": "2026-10-19",
            "status": "OVERDUE",                     # DRAFT, CONFIRMED, SENT, PAID, OVERDUE
            "total_amount": 48000.0,
            "paid_amount": 0.0,
            "outstanding_amount": 48000.0            # If omitted, computed as total - paid
        }
    ],
    "payments": [
        {
            "payment_id": "PMT-001",
            "invoice_id": "INV-1001",
            "amount": 120000.0,
            "payment_date": "2025-11-20",
            "payment_method": "BANK_TRANSFER"
        }
    ]
}
```

---

## 4. Billing Automation Workflow (System 1)

When a billing check is triggered:

```text
       [Active Subscription Record]
                    │
                    ▼
       1. [Billing Scheduler Check]
          ├── Is Status == "ACTIVE"?
          └── Is next_billing_date <= today?
                    │ (DUE or OVERDUE)
                    ▼
       2. [Duplicate Guard Check]
          └── Has a valid invoice (DRAFT, CONFIRMED, SENT, PAID)
              already been created for this billing period?
                    │ (NO DUPLICATE)
                    ▼
       3. [Base Amount Calculation]
          └── Line Item Units + Variant Addons * Quantity
                    │
                    ▼
       4. [Discount Evaluator]
          ├── Check active status & validity date window
          ├── Check min purchase amount & min quantity
          └── Apply Percentage or Fixed deduction (clamped >= 0)
                    │
                    ▼
       5. [Tax Calculator]
          └── Compute tax rate percentage on taxable amount
                    │
                    ▼
       6. [Produce BillingInstruction]
          └── Returns structured instruction ready for Sai's invoice generation
```

### Output: Structured Billing Instruction

```json
{
  "subscription_id": "SUB-RP-404",
  "customer_name": "RetailPro Commerce",
  "billing_allowed": true,
  "billing_status": "READY_FOR_INVOICE",
  "base_amount": 10000.0,
  "discount_amount": 1000.0,
  "discount_applied": true,
  "discount_reason": "10% discount applied successfully",
  "taxable_amount": 9000.0,
  "tax_rate": 18.0,
  "tax_amount": 1620.0,
  "total_amount": 10620.0,
  "billing_period_start": "2026-10-31",
  "billing_period_end": "2026-11-27",
  "next_billing_date": "2026-11-28",
  "reason": "Billing calculation completed successfully"
}
```

---

## 5. Revenue Intelligence Workflow & Action Center (System 2)

```text
       [Invoices, Subscriptions & Payments]
                    │
                    ▼
       [Data Normalization Adapter]
                    │
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
 [Overdue       [Renewal       [Billing Risk
  Detector]      Detector]      Detector]
     │              │              │
     └──────────────┼──────────────┘
                    ▼
     [Deterministic Priority Scorer]
        0 - 100 Clamped Score
        Transparent Factor Breakdown
                    │
                    ▼
     [Revenue Action Item Synthesis]
        Deterministic Sorting:
        Priority Tier (CRITICAL > HIGH > MEDIUM > LOW)
        → Highest Score First
        → Highest Amount First
                    │
                    ▼
     [Revenue Action Center Report]
```

### Action Categories Supported

* `PAYMENT_RISK`: Unpaid overdue invoices jeopardizing cash flow.
* `RENEWAL_RISK`: High-value subscription contracts nearing expiration.
* `BILLING_RISK`: Unbilled active subscriptions causing deferred revenue leakage.
* `REVENUE_OPPORTUNITY`: Upcoming expansion or early renewal opportunities.

---

## 6. Priority Scoring Model

Scores range strictly between **0 and 100**, clamped deterministically:

| Priority Tier | Score Range | Definition & Target SLA |
| :--- | :--- | :--- |
| 🔴 **CRITICAL** | `80 – 100` | Immediate operational intervention required today |
| 🟠 **HIGH** | `60 – 79` | High revenue value requiring urgent action this week |
| 🟡 **MEDIUM** | `30 – 59` | Scheduled review or billing reconciliation required |
| 🟢 **LOW** | `0 – 29` | Informational or low-exposure monitor item |

### Factor Breakdown Formulation

#### Payment Risk Scoring
* **Overdue Duration Factor (0–35 pts):** `>30d: 35`, `15-30d: 30`, `10-14d: 25`, `5-9d: 20`, `1-4d: 15`, `0d: 5`
* **Outstanding Amount Factor (0–35 pts):** `≥₹100k: 35`, `≥₹40k: 30`, `≥₹20k: 20`, `≥₹10k: 15`, `≥₹5k: 10`, `<₹5k: 5`
* **Unpaid Exposure Ratio (0–15 pts):** `≥90%: 15`, `≥50%: 10`, `<50%: 5`
* **Urgency Multiplier (0–15 pts):** `Days ≥ 10 & Amt ≥ ₹25k: +15`

#### Renewal Risk Scoring
* **Contract Expiry Proximity (0–35 pts):** `Expired/Today: 35`, `≤3d: 30`, `≤7d: 25`, `≤14d: 18`, `≤30d: 12`
* **Annual Contract Value (0–35 pts):** `≥₹100k: 35`, `≥₹50k: 25`, `≥₹20k: 15`, `≥₹5k: 10`, `<₹5k: 5`
* **Retention Urgency Bonus (0–15 pts):** `≤7d & Value ≥ ₹50k: +15`

#### Billing Leakage Scoring
* **Days Passed Unbilled (0–35 pts):** `≥14d: 30`, `≥7d: 25`, `≥3d: 18`, `≥1d: 12`, `Due today: 8`
* **Revenue Leakage Exposure (0–35 pts):** `≥₹50k: 30`, `≥₹20k: 20`, `≥₹10k: 15`, `<₹10k: 10`
* **Missing Billing Guard (0–15 pts):** `Days ≥ 7: +10`

---

## 7. Backend Integration Instructions for Sai

Sai can integrate both services directly with two one-line imports:

### Endpoint 1: Revenue Action Center (`/api/revenue-intelligence/action-center`)

```python
from fastapi import APIRouter, Depends
from intelligence_engine.services.intelligence_service import analyze_revenue

router = APIRouter(prefix="/api/revenue-intelligence", tags=["Revenue Intelligence"])

@router.get("/action-center")
def get_action_center_insights():
    # 1. Fetch raw subscriptions, invoices, and payments from database
    raw_data = {
        "subscriptions": db_get_subscriptions(),
        "invoices": db_get_invoices(),
        "payments": db_get_payments()
    }
    
    # 2. Run pure Python analysis (decoupled from DB)
    report = analyze_revenue(raw_data)
    
    # 3. Return structured payload directly to Harshitha's frontend
    return report
```

### Endpoint 2: Automated Billing Trigger (`/api/billing/process-due`)

```python
from intelligence_engine.services.intelligence_service import process_subscription_billing

@router.post("/billing/process-subscription/{sub_id}")
def process_subscription_cycle(sub_id: str):
    sub = db_find_subscription(sub_id)
    existing_invoices = db_find_invoices_for_subscription(sub_id)
    
    # Run billing calculation pipeline
    instruction = process_subscription_billing(
        subscription=sub,
        existing_invoices=existing_invoices,
    )
    
    if not instruction["billing_allowed"]:
        return {"status": "SKIPPED", "reason": instruction["reason"]}
        
    # Sai's invoice service inserts the actual invoice record using instruction:
    created_invoice = db_create_invoice_record(
        subscription_id=instruction["subscription_id"],
        customer_name=instruction["customer_name"],
        base_amount=instruction["base_amount"],
        discount_amount=instruction["discount_amount"],
        tax_amount=instruction["tax_amount"],
        total_amount=instruction["total_amount"],
        billing_period_start=instruction["billing_period_start"],
        billing_period_end=instruction["billing_period_end"]
    )
    
    # Update next billing date on subscription
    db_update_subscription_billing_date(sub_id, instruction["next_billing_date"])
    
    return {"status": "SUCCESS", "invoice": created_invoice}
```

---

## 8. Standalone Demo Execution

Run the standalone demo directly without needing database or frontend servers:

```bash
python -m intelligence_engine.demo.demo_data
```

The script prints the Revenue Intelligence summary, all prioritized actions with factor breakdowns, and demonstrates live billing calculation and duplicate blocking.

---

## 9. Test Suite Execution

Run the complete test suite with verbose output:

```bash
pytest intelligence_engine/tests -v
```

All 37 test cases cover:
* Billing scheduler (due, overdue, not due, ineligibility guards)
* Duplicate invoice suppression & period collision handling
* Multi-rule discount evaluator (percentage, fixed, min-spend, expiration, limit checks)
* Tax calculation with custom rules & zero-tax scenarios
* Full billing pipeline execution with multi-product variant lines
* Overdue detection & outstanding balance tracking
* Contract renewal windows (`EXPIRED`, `EXPIRES_TODAY`, `WITHIN_3_DAYS`, `WITHIN_7_DAYS`, `WITHIN_30_DAYS`)
* Billing risk detection for unbilled subscriptions
* Deterministic priority scoring (0–100 clamping, explainable factor breakdowns)
* Data adapter robustness against key variations and date formats
* End-to-end `analyze_revenue` service integration
