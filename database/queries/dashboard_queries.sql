-- ============================================================================
-- REVORA — Subscription Revenue Intelligence Platform
-- Component: Dashboard SQL Queries
-- Engineer: Krishna (Database, Finance & System Engineer)
-- Dialect: ANSI SQL / SQLite 3 / PostgreSQL Compatible
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ACTIVE SUBSCRIPTION COUNT
-- Returns the count of currently active subscription contracts
-- ----------------------------------------------------------------------------
SELECT 
    COUNT(*) AS active_subscriptions_count
FROM subscriptions
WHERE status = 'ACTIVE';

-- ----------------------------------------------------------------------------
-- 2. TOTAL REVENUE COLLECTED (ACTUAL CASH IN BANK)
-- IMPORTANT: Distinguishes collected cash from invoiced revenue.
-- Only sums completed payment transactions; avoids double-counting.
-- ----------------------------------------------------------------------------
SELECT 
    COALESCE(SUM(amount), 0.00) AS total_cash_collected,
    currency
FROM payments
WHERE status = 'COMPLETED'
GROUP BY currency;

-- ----------------------------------------------------------------------------
-- 3. TOTAL OUTSTANDING INVOICE AMOUNT
-- Sum of all unpaid and partially paid balances on issued invoices
-- (Excludes CANCELLED and DRAFT invoices)
-- ----------------------------------------------------------------------------
SELECT 
    COALESCE(SUM(outstanding_amount), 0.00) AS total_outstanding_amount,
    currency
FROM invoices
WHERE status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
GROUP BY currency;

-- ----------------------------------------------------------------------------
-- 4. OVERDUE INVOICE AMOUNT & COUNT (AGING RISK)
-- Invoices that are past due date and remain unpaid
-- ----------------------------------------------------------------------------
SELECT 
    COUNT(*) AS overdue_invoices_count,
    COALESCE(SUM(outstanding_amount), 0.00) AS total_overdue_amount,
    currency
FROM invoices
WHERE status = 'OVERDUE'
   OR (due_date < CURRENT_DATE AND status IN ('ISSUED', 'PARTIALLY_PAID'))
GROUP BY currency;

-- ----------------------------------------------------------------------------
-- 5. RECENT INVOICES FEED
-- Displays the latest invoices with customer names, dates, amounts, and statuses
-- ----------------------------------------------------------------------------
SELECT 
    i.invoice_number,
    c.company_name AS customer_name,
    c.customer_code,
    i.issue_date,
    i.due_date,
    i.total_amount,
    i.amount_paid,
    i.outstanding_amount,
    i.status AS invoice_status,
    i.currency
FROM invoices i
JOIN customers c ON i.customer_id = c.id
ORDER BY i.issue_date DESC, i.id DESC
LIMIT 10;

-- ----------------------------------------------------------------------------
-- 6. UPCOMING RENEWALS (NEXT 30 DAYS)
-- Subscriptions approaching their billing period end within 30 days
-- Highlights Scenario B (TechNova renewal)
-- ----------------------------------------------------------------------------
SELECT 
    s.subscription_code,
    c.company_name AS customer_name,
    p.name AS plan_name,
    p.billing_cycle,
    s.recurring_amount,
    s.current_period_end AS renewal_date,
    s.auto_renew,
    CAST((JULIANDAY(s.current_period_end) - JULIANDAY(CURRENT_DATE)) AS INTEGER) AS days_until_renewal
FROM subscriptions s
JOIN customers c ON s.customer_id = c.id
JOIN subscription_plans p ON s.plan_id = p.id
WHERE s.status = 'ACTIVE'
  AND s.current_period_end >= CURRENT_DATE
  AND s.current_period_end <= DATE(CURRENT_DATE, '+30 days')
ORDER BY s.current_period_end ASC;

-- ----------------------------------------------------------------------------
-- 7. RECENT PAYMENTS FEED
-- Feed of recently cleared transactions without duplication
-- ----------------------------------------------------------------------------
SELECT 
    p.payment_reference,
    p.payment_date,
    c.company_name AS customer_name,
    i.invoice_number,
    p.payment_method,
    p.amount,
    p.currency,
    p.status AS payment_status,
    p.transaction_id
FROM payments p
JOIN customers c ON p.customer_id = c.id
JOIN invoices i ON p.invoice_id = i.id
WHERE p.status = 'COMPLETED'
ORDER BY p.payment_date DESC, p.id DESC
LIMIT 10;

-- ----------------------------------------------------------------------------
-- 8. COMPREHENSIVE DASHBOARD KPI SUMMARY
-- Single aggregated summary row for fast executive dashboard rendering
-- ----------------------------------------------------------------------------
SELECT 
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'ACTIVE') AS active_subscriptions,
    (SELECT COALESCE(SUM(amount), 0.00) FROM payments WHERE status = 'COMPLETED') AS total_cash_collected,
    (SELECT COALESCE(SUM(total_amount), 0.00) FROM invoices WHERE status != 'CANCELLED') AS total_invoiced_amount,
    (SELECT COALESCE(SUM(outstanding_amount), 0.00) FROM invoices WHERE status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')) AS total_outstanding_amount,
    (SELECT COALESCE(SUM(outstanding_amount), 0.00) FROM invoices WHERE status = 'OVERDUE' OR (due_date < CURRENT_DATE AND status IN ('ISSUED', 'PARTIALLY_PAID'))) AS total_overdue_amount,
    (SELECT COUNT(*) FROM invoices WHERE status = 'OVERDUE' OR (due_date < CURRENT_DATE AND status IN ('ISSUED', 'PARTIALLY_PAID'))) AS overdue_invoices_count;

