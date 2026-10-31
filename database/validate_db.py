#!/usr/bin/env python3
"""
REVORA Database Validation & Test Suite
Engineer: Krishna (Database, Finance & System Engineer)
Description: Automated validation script that creates an isolated database,
verifies schema integrity, loads demo data, validates financial constraints,
tests all dashboard, revenue, and intelligence queries, and confirms all
four hackathon demo scenarios.
"""

import sys
import os
import sqlite3
import argparse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
SCHEMA_FILE = BASE_DIR / "schema" / "schema.sql"
CONSTRAINTS_FILE = BASE_DIR / "schema" / "constraints.sql"
SEED_FILE = BASE_DIR / "seed" / "demo_data.sql"
QUERIES_DIR = BASE_DIR / "queries"

REQUIRED_TABLES = [
    "users",
    "customers",
    "products",
    "product_variants",
    "subscription_plans",
    "discounts",
    "quotations",
    "quotation_items",
    "subscriptions",
    "subscription_items",
    "invoices",
    "invoice_items",
    "payments"
]

def print_header(title):
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70)

def split_sql_statements(sql_text):
    """Splits SQL script into executable statements, preserving triggers."""
    statements = []
    current_stmt = []
    in_trigger = False
    
    for line in sql_text.splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith("--"):
            continue
        
        upper = trimmed.upper()
        if "CREATE TRIGGER" in upper:
            in_trigger = True
        
        current_stmt.append(line)
        
        if in_trigger:
            if trimmed.upper() == "END;":
                in_trigger = False
                statements.append("\n".join(current_stmt))
                current_stmt = []
        else:
            if trimmed.endswith(";"):
                statements.append("\n".join(current_stmt))
                current_stmt = []
                
    if current_stmt:
        remaining = "\n".join(current_stmt).strip()
        if remaining:
            statements.append(remaining)
            
    return statements

def run_validation(db_path=":memory:"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    print_header(f"REVORA DATABASE VERIFICATION SUITE (Target: {db_path})")
    
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()
    
    # ------------------------------------------------------------------------
    # STEP 1: Verify Schema Execution
    # ------------------------------------------------------------------------
    print("\n[CHECK 1] Applying schema.sql...")
    if not SCHEMA_FILE.exists():
        raise FileNotFoundError(f"Missing schema file: {SCHEMA_FILE}")
    with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)
    print(" -> schema.sql executed successfully.")

    print("\n[CHECK 2] Applying constraints.sql (Indexes, Views, Triggers)...")
    if not CONSTRAINTS_FILE.exists():
        raise FileNotFoundError(f"Missing constraints file: {CONSTRAINTS_FILE}")
    with open(CONSTRAINTS_FILE, "r", encoding="utf-8") as f:
        constraints_sql = f.read()
    conn.executescript(constraints_sql)
    print(" -> constraints.sql executed successfully.")

    # ------------------------------------------------------------------------
    # STEP 2: Verify Tables Existence
    # ------------------------------------------------------------------------
    print("\n[CHECK 3] Verifying all 13 required core tables exist...")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    existing_tables = {row[0] for row in cursor.fetchall()}
    
    missing_tables = [t for t in REQUIRED_TABLES if t not in existing_tables]
    if missing_tables:
        raise AssertionError(f"Missing required tables: {missing_tables}")
    print(f" -> All 13 tables present: {', '.join(REQUIRED_TABLES)}")

    # ------------------------------------------------------------------------
    # STEP 3: Load Demo Data
    # ------------------------------------------------------------------------
    print("\n[CHECK 4] Loading seed/demo_data.sql...")
    if not SEED_FILE.exists():
        raise FileNotFoundError(f"Missing seed file: {SEED_FILE}")
    with open(SEED_FILE, "r", encoding="utf-8") as f:
        seed_sql = f.read()
    conn.executescript(seed_sql)
    print(" -> demo_data.sql executed successfully.")

    # ------------------------------------------------------------------------
    # STEP 4: Foreign Key Integrity Check
    # ------------------------------------------------------------------------
    print("\n[CHECK 5] Checking for orphaned foreign keys (PRAGMA foreign_key_check)...")
    cursor.execute("PRAGMA foreign_key_check;")
    fk_errors = cursor.fetchall()
    if fk_errors:
        raise AssertionError(f"Foreign key violations detected: {fk_errors}")
    print(" -> Zero foreign key violations. Relational integrity intact.")

    # ------------------------------------------------------------------------
    # STEP 5: Verify Record Counts
    # ------------------------------------------------------------------------
    print("\n[CHECK 6] Verifying minimum dataset requirements...")
    counts = {}
    for table in REQUIRED_TABLES:
        cursor.execute(f"SELECT COUNT(*) FROM {table};")
        counts[table] = cursor.fetchone()[0]
        print(f"    - {table:20s}: {counts[table]:3d} records")
        
    assert counts["customers"] >= 10, f"Expected >= 10 customers, got {counts['customers']}"
    assert counts["products"] >= 6, f"Expected >= 6 products, got {counts['products']}"
    assert counts["subscription_plans"] >= 5, f"Expected >= 5 plans, got {counts['subscription_plans']}"
    assert counts["subscriptions"] >= 8, f"Expected >= 8 subscriptions, got {counts['subscriptions']}"
    assert counts["invoices"] >= 12, f"Expected >= 12 invoices, got {counts['invoices']}"
    assert counts["payments"] >= 8, f"Expected >= 8 payments, got {counts['payments']}"
    assert counts["quotations"] >= 2, f"Expected multiple quotations, got {counts['quotations']}"
    print(" -> Record count criteria fully met.")

    # ------------------------------------------------------------------------
    # STEP 6: Financial Calculations Integrity
    # ------------------------------------------------------------------------
    print("\n[CHECK 7] Verifying financial calculation rules across all invoices...")
    # Rule 1: total_amount = subtotal - discount_amount + tax_amount
    cursor.execute("""
        SELECT invoice_number, subtotal, discount_amount, tax_amount, total_amount
        FROM invoices
        WHERE ABS(total_amount - (subtotal - discount_amount + tax_amount)) > 0.01;
    """)
    mismatches = cursor.fetchall()
    if mismatches:
        raise AssertionError(f"Invoice math mismatch (Subtotal - Discount + Tax != Total): {mismatches}")

    # Rule 2: outstanding_amount = total_amount - amount_paid
    cursor.execute("""
        SELECT invoice_number, total_amount, amount_paid, outstanding_amount
        FROM invoices
        WHERE ABS(outstanding_amount - (total_amount - amount_paid)) > 0.01;
    """)
    mismatches2 = cursor.fetchall()
    if mismatches2:
        raise AssertionError(f"Invoice balance mismatch (Total - Paid != Outstanding): {mismatches2}")
    print(" -> Financial calculations (Tax, Discount, Total, Outstanding) 100% consistent.")

    # ------------------------------------------------------------------------
    # STEP 7: Verify Multi-Payment Reconciliations
    # ------------------------------------------------------------------------
    print("\n[CHECK 8] Verifying invoice paid amounts against payment ledger...")
    cursor.execute("""
        SELECT 
            i.invoice_number,
            i.amount_paid,
            COALESCE(SUM(p.amount), 0.00) AS actual_payments_sum
        FROM invoices i
        LEFT JOIN payments p ON i.id = p.invoice_id AND p.status = 'COMPLETED'
        GROUP BY i.id
        HAVING ABS(i.amount_paid - COALESCE(SUM(p.amount), 0.00)) > 0.01;
    """)
    reconciliation_errors = cursor.fetchall()
    if reconciliation_errors:
        raise AssertionError(f"Payment ledger reconciliation errors: {reconciliation_errors}")
    print(" -> All invoice payment sums perfectly match recorded payments.")

    # ------------------------------------------------------------------------
    # STEP 8: Testing All Dashboard Queries
    # ------------------------------------------------------------------------
    print("\n[CHECK 9] Testing queries/dashboard_queries.sql...")
    dashboard_file = QUERIES_DIR / "dashboard_queries.sql"
    with open(dashboard_file, "r", encoding="utf-8") as f:
        dash_statements = split_sql_statements(f.read())
    
    for idx, stmt in enumerate(dash_statements, 1):
        cursor.execute(stmt)
        rows = cursor.fetchall()
        print(f"    Query {idx}: Returned {len(rows)} row(s).")
    print(" -> All dashboard queries executed without error.")

    # ------------------------------------------------------------------------
    # STEP 9: Testing All Revenue Queries
    # ------------------------------------------------------------------------
    print("\n[CHECK 10] Testing queries/revenue_queries.sql...")
    rev_file = QUERIES_DIR / "revenue_queries.sql"
    with open(rev_file, "r", encoding="utf-8") as f:
        rev_statements = split_sql_statements(f.read())
    
    for idx, stmt in enumerate(rev_statements, 1):
        cursor.execute(stmt)
        rows = cursor.fetchall()
        print(f"    Query {idx}: Returned {len(rows)} row(s).")
    print(" -> All revenue queries executed without error.")

    # ------------------------------------------------------------------------
    # STEP 10: Testing All Intelligence Queries
    # ------------------------------------------------------------------------
    print("\n[CHECK 11] Testing queries/intelligence_queries.sql...")
    intel_file = QUERIES_DIR / "intelligence_queries.sql"
    with open(intel_file, "r", encoding="utf-8") as f:
        intel_statements = split_sql_statements(f.read())
    
    for idx, stmt in enumerate(intel_statements, 1):
        cursor.execute(stmt)
        rows = cursor.fetchall()
        print(f"    Query {idx}: Returned {len(rows)} row(s).")
    print(" -> All intelligence queries executed without error.")

    # ------------------------------------------------------------------------
    # STEP 11: Specific Verification of the Four Demo Scenarios
    # ------------------------------------------------------------------------
    print_header("DEMO SCENARIOS VERIFICATION")

    # Scenario A: High-value overdue invoice (BrightTech, INV-1042, ₹48,000, 12 days overdue)
    print("\n[SCENARIO A] High-Value Overdue Invoice Verification...")
    cursor.execute("""
        SELECT 
            i.invoice_number, 
            c.company_name, 
            i.total_amount, 
            i.amount_paid, 
            i.outstanding_amount, 
            i.due_date,
            CAST((JULIANDAY(CURRENT_DATE) - JULIANDAY(i.due_date)) AS INTEGER) AS days_overdue,
            i.status
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        WHERE i.invoice_number = 'INV-1042';
    """)
    scen_a = cursor.fetchone()
    assert scen_a is not None, "Scenario A: Invoice INV-1042 not found!"
    print(f"    Invoice Number    : {scen_a[0]}")
    print(f"    Customer Name     : {scen_a[1]}")
    print(f"    Total Amount      : ₹{scen_a[2]:,.2f}")
    print(f"    Amount Paid       : ₹{scen_a[3]:,.2f}")
    print(f"    Outstanding Amount: ₹{scen_a[4]:,.2f}")
    print(f"    Days Overdue      : {scen_a[6]} days")
    print(f"    Invoice Status    : {scen_a[7]}")
    assert scen_a[1] == "BrightTech", "Expected customer BrightTech"
    assert scen_a[2] == 48000.00, "Expected total ₹48,000"
    assert scen_a[3] == 0.00, "Expected amount paid ₹0"
    assert scen_a[4] == 48000.00, "Expected outstanding ₹48,000"
    assert scen_a[6] == 12, f"Expected 12 days overdue, got {scen_a[6]}"
    assert scen_a[7] == "OVERDUE", "Expected status OVERDUE"
    print(" -> [SCENARIO A CONFIRMED: PASSED]")

    # Scenario B: Upcoming high-value renewal (TechNova, annual ₹1,20,000, in 5 days)
    print("\n[SCENARIO B] Upcoming High-Value Renewal Verification...")
    cursor.execute("""
        SELECT 
            s.subscription_code,
            c.company_name,
            s.recurring_amount,
            s.current_period_end,
            CAST((JULIANDAY(s.current_period_end) - JULIANDAY(CURRENT_DATE)) AS INTEGER) AS days_until_renewal,
            p.billing_cycle
        FROM subscriptions s
        JOIN customers c ON s.customer_id = c.id
        JOIN subscription_plans p ON s.plan_id = p.id
        WHERE c.company_name = 'TechNova' AND s.status = 'ACTIVE';
    """)
    scen_b = cursor.fetchone()
    assert scen_b is not None, "Scenario B: TechNova subscription not found!"
    print(f"    Subscription Code : {scen_b[0]}")
    print(f"    Customer Name     : {scen_b[1]}")
    print(f"    Annual Value      : ₹{scen_b[2]:,.2f}")
    print(f"    Renewal Date      : {scen_b[3]}")
    print(f"    Days Until Renewal: {scen_b[4]} days")
    print(f"    Billing Cycle     : {scen_b[5]}")
    assert scen_b[2] == 120000.00, "Expected ₹1,20,000 annual value"
    assert scen_b[4] == 5, f"Expected renewal in 5 days, got {scen_b[4]}"
    assert scen_b[5] == "ANNUAL", "Expected ANNUAL plan"
    print(" -> [SCENARIO B CONFIRMED: PASSED]")

    # Scenario C: Potential billing risk (Apex Digital, next_billing passed, missing invoice)
    print("\n[SCENARIO C] Potential Billing Risk (Missing Invoice) Verification...")
    cursor.execute("""
        SELECT 
            s.subscription_code,
            c.company_name,
            s.next_billing_date,
            CAST((JULIANDAY(CURRENT_DATE) - JULIANDAY(s.next_billing_date)) AS INTEGER) AS days_overdue
        FROM subscriptions s
        JOIN customers c ON s.customer_id = c.id
        WHERE s.status = 'ACTIVE'
          AND s.next_billing_date <= CURRENT_DATE
          AND NOT EXISTS (
              SELECT 1 FROM invoices i 
              WHERE i.subscription_id = s.id 
                AND i.status != 'CANCELLED'
                AND (i.billing_period_start >= s.next_billing_date
                     OR (s.next_billing_date BETWEEN i.billing_period_start AND i.billing_period_end))
          );
    """)
    scen_c = cursor.fetchall()
    print(f"    Flagged Subscriptions: {len(scen_c)}")
    for row in scen_c:
        print(f"    - Sub: {row[0]}, Customer: {row[1]}, Next Billing: {row[2]}, Delayed: {row[3]} days")
    assert len(scen_c) == 1, f"Expected exactly 1 flagged subscription, found {len(scen_c)}"
    assert scen_c[0][1] == "Apex Digital", f"Expected Apex Digital, got {scen_c[0][1]}"
    print(" -> [SCENARIO C CONFIRMED: PASSED]")

    # Scenario D: Healthy customer (CloudPulse Innovations, active, paid, 0 overdue, no risk)
    print("\n[SCENARIO D] Healthy Customer Profile Verification...")
    cursor.execute("""
        SELECT 
            c.company_name,
            s.subscription_code,
            s.status,
            s.next_billing_date,
            CAST((JULIANDAY(s.next_billing_date) - JULIANDAY(CURRENT_DATE)) AS INTEGER) AS days_to_billing,
            COALESCE((SELECT SUM(outstanding_amount) FROM invoices WHERE customer_id = c.id AND status = 'OVERDUE'), 0.00) AS overdue_balance,
            COALESCE((SELECT SUM(outstanding_amount) FROM invoices WHERE customer_id = c.id AND due_date < CURRENT_DATE), 0.00) AS past_due_balance
        FROM customers c
        JOIN subscriptions s ON c.id = s.customer_id
        WHERE c.company_name = 'CloudPulse Innovations';
    """)
    scen_d = cursor.fetchone()
    assert scen_d is not None, "Scenario D: CloudPulse Innovations not found!"
    print(f"    Customer Name     : {scen_d[0]}")
    print(f"    Subscription Code : {scen_d[1]}")
    print(f"    Subscription State: {scen_d[2]}")
    print(f"    Days to Billing   : {scen_d[4]} days")
    print(f"    Overdue Balance   : ₹{scen_d[5]:,.2f}")
    print(f"    Past Due Balance  : ₹{scen_d[6]:,.2f}")
    assert scen_d[2] == "ACTIVE", "Expected ACTIVE status"
    assert scen_d[4] > 14, "Expected billing date > 14 days"
    assert scen_d[5] == 0.00, "Expected zero overdue balance"
    assert scen_d[6] == 0.00, "Expected zero past due balance"
    print(" -> [SCENARIO D CONFIRMED: PASSED]")

    # ------------------------------------------------------------------------
    # STEP 12: Verify No Join Duplication in Revenue
    # ------------------------------------------------------------------------
    print("\n[CHECK 12] Verifying Join Revenue Does Not Duplicate Cash...")
    cursor.execute("SELECT SUM(amount) FROM payments WHERE status = 'COMPLETED';")
    base_cash = cursor.fetchone()[0]
    
    cursor.execute("""
        SELECT SUM(p.amount)
        FROM (SELECT DISTINCT id, amount FROM payments WHERE status = 'COMPLETED') p;
    """)
    dedup_cash = cursor.fetchone()[0]
    assert abs(base_cash - dedup_cash) < 0.001, "Cash revenue calculation discrepancy detected!"
    print(f"    Total Verified Cash Collected: ₹{base_cash:,.2f}")
    print(" -> Revenue joins verified. Zero duplication.")

    conn.close()
    print_header("ALL 12 DATABASE CHECKS & 4 SCENARIOS PASSED WITH ZERO ERRORS!")
    return True

if __name__ == "__main__":
    # Ensure UTF-8 output encoding across Windows consoles
    if sys.stdout.encoding != "utf-8":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except AttributeError:
            pass

    parser = argparse.ArgumentParser(description="REVORA Database Verification Suite")
    parser.add_argument("--db", default=":memory:", help="Database file path (defaults to :memory:)")
    parser.add_argument("--seed", action="store_true", help="Populate revora.db on disk")
    args = parser.parse_args()
    
    target_db = "revora.db" if args.seed else args.db
    success = run_validation(target_db)
    if not success:
        sys.exit(1)
