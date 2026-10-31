# REVORA Demo Seed Data Guide

This directory contains the realistic demo dataset for the **REVORA Subscription Revenue Intelligence Platform**.

## 1. Overview of Demo Records
The seed script (`demo_data.sql`) populates all 13 relational tables with connected, valid financial records:
- **5 System Users**: Engineers and finance operators (Krishna, Sai, Prasanth, Harshitha, Sales).
- **12 B2B Customers**: TechNova, BrightTech, CloudPulse, Apex Digital, FinEdge, etc.
- **6 Products**: Core billing engine, predictive intelligence suite, ERP connector, enterprise support, compliance guard, and 1 inactive legacy bridge.
- **8 Product Variants**: Covering Starter, Pro, and Enterprise tiers across Monthly and Annual billing frequencies.
- **6 Subscription Plans**: Monthly, quarterly, and annual pricing models.
- **4 Discounts**: Percentage and fixed discount policies.
- **4 Quotations & Items**: Proposals covering Draft, Sent, Accepted, and Rejected stages.
- **10 Subscriptions & Items**: Active, paused, closed, and past-due contracts.
- **14 Invoices & Items**: Covering all invoice statuses (`PAID`, `PARTIALLY_PAID`, `OVERDUE`, `ISSUED`, `DRAFT`, `CANCELLED`).
- **10 Payments**: Covering Bank Transfer, Credit Card, UPI, and Razorpay, including a multi-payment scenario.

---

## 2. The Four Key Intelligence Demo Scenarios

### Scenario A: High-Value Overdue Invoice
- **Customer**: BrightTech (`CUST-002`)
- **Invoice Number**: `INV-1042`
- **Total Amount**: ₹48,000.00
- **Amount Paid**: ₹0.00
- **Outstanding Amount**: ₹48,000.00
- **Due Date**: Exactly 12 days before demo date (`date('now', '-12 days')`)
- **Status**: `OVERDUE`
- **Purpose**: Triggers dunning alert and aging risk scoring in Prasanth's intelligence engine.

### Scenario B: Upcoming High-Value Renewal
- **Customer**: TechNova (`CUST-001`)
- **Annual Subscription Value**: ₹1,20,000.00
- **Expiry / Current Period End**: Exactly 5 days after demo date (`date('now', '+5 days')`)
- **Next Billing Date**: `date('now', '+5 days')`
- **Status**: `ACTIVE` (with `auto_renew = 1`)
- **Purpose**: Detected by renewal alert queries to trigger account executive renewal notifications.

### Scenario C: Potential Billing Risk (Missing Invoice)
- **Customer**: Apex Digital (`CUST-004`)
- **Subscription**: `SUB-2026-004` (Status: `ACTIVE`, Plan: `PLAN-STARTER-M`, ₹15,000/mo)
- **Risk Trigger**: Next billing date has passed (`date('now', '-2 days')`), but NO invoice has been generated for the active cycle starting 2 days ago.
- **Purpose**: Detected by the missing billing invoice query, identifying automated billing failures or stalled cron jobs.

### Scenario D: Healthy Customer
- **Customer**: CloudPulse Innovations (`CUST-003`)
- **Subscription**: `SUB-2026-003` (Status: `ACTIVE`, Plan: `PLAN-PRO-M`, ₹25,000/mo)
- **Next Billing Date**: 25 days in the future (`date('now', '+25 days')`)
- **Invoices**: `INV-1003` (₹25,000) and `INV-1012` (₹20,000) are paid in full with ₹0 outstanding.
- **Purpose**: Baseline for healthy customer profile with zero churn or dunning risk.

---

## 3. Dynamic Demo-Date Strategy
To prevent demo data from expiring after the hackathon evaluation begins, dates in `demo_data.sql` are written using SQL date expressions relative to the execution timestamp:
- `date('now', '-12 days')`: Past due dates.
- `date('now', '+5 days')`: Upcoming renewal dates.
- `date('now', '-2 days')`: Passed billing dates.

Whenever the seed script is loaded into SQLite or Python, all scenarios automatically align relative to that moment!

---

## 4. Resetting and Reloading Seed Data Safely

### Option A: Using the Automated Python Verification Script
From the project root:
```bash
python database/validate_db.py --seed
```

### Option B: Using the SQLite Command Line
```bash
# Delete the existing database file (if you wish to wipe completely)
rm revora.db

# Apply schema and seed data
sqlite3 revora.db < database/schema/schema.sql
sqlite3 revora.db < database/schema/constraints.sql
sqlite3 revora.db < database/seed/demo_data.sql
```

### Option C: In Python (Sai's Backend / Prasanth's Engine)
```python
import sqlite3

conn = sqlite3.connect("revora.db")
with open("database/schema/schema.sql") as f:
    conn.executescript(f.read())
with open("database/schema/constraints.sql") as f:
    conn.executescript(f.read())
with open("database/seed/demo_data.sql") as f:
    conn.executescript(f.read())
conn.close()
print("REVORA database seeded successfully!")
```
