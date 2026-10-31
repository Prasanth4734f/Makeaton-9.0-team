# REVORA Database System & Financial Engineering Guide

**Role**: Krishna (Database, Finance & System Engineer)  
**System**: REVORA — Subscription Revenue Intelligence Platform  
**Target Audience**: Sai (Backend & Subscription Lifecycle), Prasanth (Billing Automation & Intelligence Engine), Harshitha (Frontend & UX via API)  

---

## 1. Selected Database Technology & Architecture

### Recommended Primary Engine: SQLite 3 / Python standard library
- **Zero-Setup & Zero-Dependency**: Ships directly in Python 3.10+ standard library (`import sqlite3`). No Docker containers, no daemons, no passwords.
- **Portability**: All data is encapsulated in a single file (`revora.db`) or in-memory (`:memory:`), making team handoffs, CI/CD, and local hackathon execution instantaneous.
- **ACID Compliant**: Full transaction support (`BEGIN TRANSACTION ... COMMIT`), foreign keys (`PRAGMA foreign_keys = ON;`), and `CHECK` constraints.

### Production Enterprise Target: PostgreSQL
- **Dual Compatibility**: All DDL schemas (`schema.sql`, `constraints.sql`, `demo_data.sql`) and queries are crafted in **ANSI SQL-92/2003 standard SQL**.
- If the team opts to deploy to hosted PostgreSQL (e.g. Supabase, Neon, AWS RDS), the tables and relationships port directly with zero structural alterations.

---

## 2. Directory Structure

```
database/
├── schema/
│   ├── schema.sql             # 13 core relational tables and foreign keys
│   └── constraints.sql        # High-performance indexes, audit views & triggers
├── migrations/
│   ├── 001_initial_schema.sql # Version-controlled baseline migration
│   └── README.md              # Migration guidelines for Alembic/Python
├── seed/
│   ├── demo_data.sql          # Realistic demo seed data with 4 critical scenarios
│   └── README.md              # Scenario documentation & reload instructions
├── queries/
│   ├── dashboard_queries.sql  # Real-time KPI queries for Harshitha & Sai
│   ├── revenue_queries.sql    # MRR, ARR, LTV, aging, and cohort analytics
│   └── intelligence_queries.sql # Predictive risk queries for Prasanth's AI engine
├── docs/
│   ├── DATABASE_SCHEMA.md     # Architectural design & Mermaid ER diagrams
│   └── DATA_DICTIONARY.md     # Column-by-column schema specifications
├── validate_db.py             # Automated 12-point test and scenario verification suite
└── README.md                  # System guide and integration manual (this file)
```

---

## 3. Quick Start & Setup

### Prerequisites
- Python 3.10 or newer (tested on Python 3.14).

### Step 1: Run the Automated Verification & Seeding Suite
To verify the entire schema, test all queries, and generate a populated local database (`revora.db`):
```bash
python database/validate_db.py --seed
```

This single command will:
1. Initialize the SQLite database.
2. Apply `database/schema/schema.sql`.
3. Apply `database/schema/constraints.sql` (indexes, views, triggers).
4. Load `database/seed/demo_data.sql`.
5. Run the 12-point validation check and confirm all 4 demo scenarios.

---

## 4. Query Execution Examples

### Executing Dashboard Queries in Python
```python
import sqlite3

conn = sqlite3.connect("revora.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Get Real-Time Dashboard KPI Summary
with open("database/queries/dashboard_queries.sql") as f:
    # Query 8 is the consolidated KPI summary
    kpi_query = f.read().split(";")[-2] 
    cursor.execute(kpi_query)
    kpis = dict(cursor.fetchone())
    print("Dashboard KPIs:", kpis)

conn.close()
```

### Executing Intelligence Queries for Prasanth
```python
import sqlite3

conn = sqlite3.connect("revora.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Find High-Value Overdue Invoices (Scenario A: BrightTech)
cursor.execute("""
    SELECT invoice_number, company_name, outstanding_amount, due_date
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    WHERE i.status = 'OVERDUE' AND i.outstanding_amount >= 25000;
""")
for row in cursor.fetchall():
    print(f"DUNNING ALERT: {row['company_name']} - Invoice {row['invoice_number']}: ₹{row['outstanding_amount']:,.2f}")

conn.close()
```

---

## 5. Integration Notes for Teammates

### For Sai (Python Backend & Subscription Lifecycle)
1. **Database Connection**:
   - In your FastAPI / Flask app, create a database session manager:
   ```python
   import sqlite3
   from contextlib import contextmanager

   DATABASE_URL = "revora.db"

   @contextmanager
   def get_db():
       conn = sqlite3.connect(DATABASE_URL)
       conn.execute("PRAGMA foreign_keys = ON;")
       conn.row_factory = sqlite3.Row
       try:
           yield conn
           conn.commit()
       except Exception:
           conn.rollback()
           raise
       finally:
           conn.close()
   ```
2. **Financial Validation Transaction**:
   - When recording payments against invoices, use the following transactional pattern:
   ```python
   def record_payment(invoice_id: int, amount: float, method: str):
       with get_db() as conn:
           cursor = conn.cursor()
           # Fetch invoice
           cursor.execute("SELECT total_amount, amount_paid, outstanding_amount FROM invoices WHERE id = ?", (invoice_id,))
           inv = cursor.fetchone()
           if not inv:
               raise ValueError("Invoice not found")
           if amount > inv["outstanding_amount"]:
               raise ValueError("Payment amount exceeds outstanding balance")
           
           # Insert payment (DB trigger automatically updates invoices.amount_paid & status!)
           cursor.execute("""
               INSERT INTO payments (payment_reference, invoice_id, customer_id, amount, payment_method, status)
               VALUES (?, ?, (SELECT customer_id FROM invoices WHERE id = ?), ?, ?, 'COMPLETED')
           """, (f"PAY-{uuid.uuid4().hex[:8].upper()}", invoice_id, invoice_id, amount, method))
   ```
3. **Never Commit Secrets**: Do not place credentials or sensitive tokens in database tables. All passwords in the `users` table are hashed.

### For Prasanth (Billing Automation & Intelligence Engine)
1. **Query Hooks**:
   - All risk and forecast queries are standardized in `database/queries/intelligence_queries.sql`.
   - **Query 1**: Detects high-value overdue invoices requiring automated dunning sequences.
   - **Query 2**: Detects upcoming renewals in the next 30 days for proactive churn prevention.
   - **Query 3**: Detects active subscriptions whose billing date has passed without an invoice (automated billing failure detection).
   - **Query 5**: Returns healthy customer accounts primed for upsells and expansions.
2. **Deterministic Output**: The queries return customer names, contact emails, days overdue/remaining, and recommended action tags for your automation workers.

### For Harshitha (Frontend & UX)
- Frontend must never connect directly to `revora.db`. All data must be fetched through Sai's Python REST API endpoints which query these SQL definitions.

---

## 6. Common Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `FOREIGN KEY constraint failed` | Child record inserted before parent record, or foreign keys disabled | Verify insertion order; ensure `PRAGMA foreign_keys = ON;` is executed upon connection. |
| `CHECK constraint failed: outstanding_amount >= 0.00` | Attempting to record a payment exceeding invoice balance | Validate `payment.amount <= invoice.outstanding_amount` prior to payment insertion. |
| Date scenario not matching | System clock drifted or static date used | Ensure you run queries against dynamic date functions (`CURRENT_DATE` and `JULIANDAY`). |

