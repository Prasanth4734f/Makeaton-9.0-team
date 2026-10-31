-- ============================================================================
-- REVORA — Subscription Revenue Intelligence Platform
-- Component: Revenue Analytics SQL Queries
-- Engineer: Krishna (Database, Finance & System Engineer)
-- Dialect: ANSI SQL / SQLite 3 / PostgreSQL Compatible
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. REVENUE COLLECTED BY MONTH (CASH ACCOUNTING)
-- Definition: Sum of completed payment amounts grouped by year and month.
-- Excludes uncollected invoices to reflect true cash realization.
-- ----------------------------------------------------------------------------
SELECT 
    STRFTIME('%Y-%m', payment_date) AS payment_month,
    COUNT(id) AS transaction_count,
    SUM(amount) AS total_collected_revenue,
    currency
FROM payments
WHERE status = 'COMPLETED'
GROUP BY STRFTIME('%Y-%m', payment_date), currency
ORDER BY payment_month DESC;

-- ----------------------------------------------------------------------------
-- 2. REVENUE COLLECTED BY SUBSCRIPTION PLAN
-- Definition: Cash collected from invoices attributed to each subscription plan.
-- Uses invoice-to-subscription join to avoid double counting payments.
-- ----------------------------------------------------------------------------
SELECT 
    p.plan_code,
    p.name AS plan_name,
    p.billing_cycle,
    COUNT(DISTINCT s.id) AS active_subscribers,
    COALESCE(SUM(pm.amount), 0.00) AS total_cash_collected
FROM subscription_plans p
LEFT JOIN subscriptions s ON p.id = s.plan_id
LEFT JOIN invoices i ON s.id = i.subscription_id
LEFT JOIN payments pm ON i.id = pm.invoice_id AND pm.status = 'COMPLETED'
GROUP BY p.id, p.plan_code, p.name, p.billing_cycle
ORDER BY total_cash_collected DESC;

-- ----------------------------------------------------------------------------
-- 3. OUTSTANDING REVENUE BREAKDOWN BY CUSTOMER
-- Definition: Sum of unpaid amounts on non-cancelled invoices per customer.
-- Distinguishes current outstanding (within due date) from overdue.
-- ----------------------------------------------------------------------------
SELECT 
    c.customer_code,
    c.company_name,
    COUNT(i.id) AS open_invoices_count,
    SUM(i.total_amount) AS total_invoiced,
    SUM(i.amount_paid) AS total_paid,
    SUM(i.outstanding_amount) AS total_outstanding,
    SUM(CASE WHEN i.due_date < CURRENT_DATE THEN i.outstanding_amount ELSE 0.00 END) AS overdue_portion
FROM customers c
JOIN invoices i ON c.id = i.customer_id
WHERE i.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
GROUP BY c.id, c.customer_code, c.company_name
HAVING SUM(i.outstanding_amount) > 0.00
ORDER BY total_outstanding DESC;

-- ----------------------------------------------------------------------------
-- 4. OVERDUE REVENUE AGING ANALYSIS (BUCKETING)
-- Definition: Outstanding debt categorized by aging brackets:
-- 1-15 days, 16-30 days, 31-60 days, and 60+ days past due.
-- ----------------------------------------------------------------------------
SELECT 
    i.invoice_number,
    c.company_name,
    i.due_date,
    CAST((JULIANDAY(CURRENT_DATE) - JULIANDAY(i.due_date)) AS INTEGER) AS days_past_due,
    i.outstanding_amount,
    CASE 
        WHEN (JULIANDAY(CURRENT_DATE) - JULIANDAY(i.due_date)) BETWEEN 1 AND 15 THEN '1 - 15 Days'
        WHEN (JULIANDAY(CURRENT_DATE) - JULIANDAY(i.due_date)) BETWEEN 16 AND 30 THEN '16 - 30 Days'
        WHEN (JULIANDAY(CURRENT_DATE) - JULIANDAY(i.due_date)) BETWEEN 31 AND 60 THEN '31 - 60 Days'
        ELSE '60+ Days'
    END AS aging_bucket
FROM invoices i
JOIN customers c ON i.customer_id = c.id
WHERE i.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
  AND i.due_date < CURRENT_DATE
ORDER BY days_past_due DESC;

-- ----------------------------------------------------------------------------
-- 5. HIGHEST-VALUE CUSTOMERS (RANKED BY TOTAL CASH PAID)
-- Definition: Lifetime customer value (LTV) calculated from settled cash payments.
-- ----------------------------------------------------------------------------
SELECT 
    c.customer_code,
    c.company_name,
    c.status AS customer_status,
    COUNT(DISTINCT p.id) AS settled_payments_count,
    COALESCE(SUM(p.amount), 0.00) AS lifetime_cash_paid,
    COALESCE((
        SELECT SUM(s.recurring_amount) 
        FROM subscriptions s 
        WHERE s.customer_id = c.id AND s.status = 'ACTIVE'
    ), 0.00) AS active_contract_value
FROM customers c
LEFT JOIN payments p ON c.id = p.customer_id AND p.status = 'COMPLETED'
GROUP BY c.id, c.customer_code, c.company_name, c.status
ORDER BY lifetime_cash_paid DESC;

-- ----------------------------------------------------------------------------
-- 6. SUBSCRIPTION REVENUE RUN-RATE (MRR & ARR ESTIMATION)
-- Definition: Monthly Recurring Revenue (MRR) normalized from active subscriptions:
-- - Monthly plans: recurring_amount * 1
-- - Quarterly plans: recurring_amount / 3
-- - Annual plans: recurring_amount / 12
-- Annual Recurring Revenue (ARR) = MRR * 12
-- ----------------------------------------------------------------------------
WITH subscription_mrr AS (
    SELECT 
        s.id,
        s.recurring_amount,
        p.billing_cycle,
        CASE 
            WHEN p.billing_cycle = 'MONTHLY' THEN s.recurring_amount
            WHEN p.billing_cycle = 'QUARTERLY' THEN ROUND(s.recurring_amount / 3.0, 2)
            WHEN p.billing_cycle = 'ANNUAL' THEN ROUND(s.recurring_amount / 12.0, 2)
            ELSE s.recurring_amount
        END AS normalized_mrr
    FROM subscriptions s
    JOIN subscription_plans p ON s.plan_id = p.id
    WHERE s.status = 'ACTIVE'
)
SELECT 
    COUNT(id) AS active_subscription_count,
    ROUND(SUM(normalized_mrr), 2) AS estimated_mrr,
    ROUND(SUM(normalized_mrr) * 12.0, 2) AS estimated_arr
FROM subscription_mrr;

-- ----------------------------------------------------------------------------
-- 7. PAYMENT METHOD REVENUE DISTRIBUTION
-- Breakdown of collected cash across payment rails
-- ----------------------------------------------------------------------------
SELECT 
    payment_method,
    COUNT(id) AS successful_transactions,
    SUM(amount) AS total_collected_amount,
    ROUND((SUM(amount) * 100.0 / (SELECT SUM(amount) FROM payments WHERE status = 'COMPLETED')), 2) AS volume_percentage
FROM payments
WHERE status = 'COMPLETED'
GROUP BY payment_method
ORDER BY total_collected_amount DESC;

