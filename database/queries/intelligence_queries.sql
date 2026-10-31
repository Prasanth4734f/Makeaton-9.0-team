-- ============================================================================
-- REVORA — Subscription Revenue Intelligence Platform
-- Component: Predictive Intelligence & Risk Detection Queries
-- Engineer: Krishna (Database, Finance & System Engineer)
-- Dialect: ANSI SQL / SQLite 3 / PostgreSQL Compatible
-- Targeted for: Prasanth's Billing Automation & Revenue Intelligence Engine
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HIGH-VALUE OVERDUE INVOICES (DUNNING & DEFAULT RISK)
-- Targets: Invoices where outstanding amount > ₹25,000 and due_date < CURRENT_DATE
-- Identifies: SCENARIO A (BrightTech, INV-1042, ₹48,000 overdue by 12 days)
-- ----------------------------------------------------------------------------
SELECT 
    i.id AS invoice_id,
    i.invoice_number,
    c.id AS customer_id,
    c.customer_code,
    c.company_name,
    c.contact_name,
    c.contact_email,
    c.contact_phone,
    i.issue_date,
    i.due_date,
    CAST((JULIANDAY(CURRENT_DATE) - JULIANDAY(i.due_date)) AS INTEGER) AS days_overdue,
    i.total_amount,
    i.amount_paid,
    i.outstanding_amount,
    i.status AS invoice_status,
    'HIGH_RISK_DUNNING' AS risk_category,
    CASE 
        WHEN (JULIANDAY(CURRENT_DATE) - JULIANDAY(i.due_date)) > 30 THEN 'CRITICAL_LEGAL_ESCALATION'
        WHEN (JULIANDAY(CURRENT_DATE) - JULIANDAY(i.due_date)) > 10 THEN 'IMMEDIATE_DUNNING_NOTICE'
        ELSE 'FIRST_REMINDER_DUE'
    END AS recommended_action
FROM invoices i
JOIN customers c ON i.customer_id = c.id
WHERE i.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
  AND i.due_date < CURRENT_DATE
  AND i.outstanding_amount >= 25000.00
ORDER BY i.outstanding_amount DESC, days_overdue DESC;

-- ----------------------------------------------------------------------------
-- 2. UPCOMING SUBSCRIPTION RENEWALS (CHURN INTERVENTION & CASH FORECAST)
-- Targets: Active subscriptions expiring/renewing within the next 30 days
-- Identifies: SCENARIO B (TechNova, SUB-2026-001, ₹1,20,000 annual, renewing in 5 days)
-- ----------------------------------------------------------------------------
SELECT 
    s.id AS subscription_id,
    s.subscription_code,
    c.id AS customer_id,
    c.customer_code,
    c.company_name,
    c.contact_name,
    c.contact_email,
    p.plan_code,
    p.name AS plan_name,
    p.billing_cycle,
    s.recurring_amount AS annual_or_cycle_value,
    s.current_period_end AS renewal_date,
    s.auto_renew,
    CAST((JULIANDAY(s.current_period_end) - JULIANDAY(CURRENT_DATE)) AS INTEGER) AS days_until_renewal,
    CASE 
        WHEN s.recurring_amount >= 100000.00 THEN 'HIGH_VALUE_ACCOUNT'
        WHEN s.recurring_amount >= 40000.00 THEN 'MID_MARKET_ACCOUNT'
        ELSE 'STANDARD_ACCOUNT'
    END AS account_tier,
    CASE 
        WHEN (JULIANDAY(s.current_period_end) - JULIANDAY(CURRENT_DATE)) <= 7 THEN 'URGENT_RENEWAL_CONFIRMATION'
        ELSE 'SCHEDULE_CHECK_IN'
    END AS renewal_action
FROM subscriptions s
JOIN customers c ON s.customer_id = c.id
JOIN subscription_plans p ON s.plan_id = p.id
WHERE s.status = 'ACTIVE'
  AND s.current_period_end >= CURRENT_DATE
  AND s.current_period_end <= DATE(CURRENT_DATE, '+30 days')
ORDER BY days_until_renewal ASC, s.recurring_amount DESC;

-- ----------------------------------------------------------------------------
-- 3. ACTIVE SUBSCRIPTIONS WITH MISSING BILLING INVOICES (BILLING GAP RISK)
-- Targets: Active subscriptions where next_billing_date <= CURRENT_DATE, but NO
-- invoice exists with billing_period_start matching or covering next_billing_date.
-- Identifies: SCENARIO C (Apex Digital, SUB-2026-004, next_billing was 2 days ago, no invoice!)
-- Crucial: Does NOT flag subscriptions that already have an invoice covering that date.
-- ----------------------------------------------------------------------------
SELECT 
    s.id AS subscription_id,
    s.subscription_code,
    c.id AS customer_id,
    c.customer_code,
    c.company_name,
    c.contact_name,
    c.contact_email,
    p.plan_code,
    p.name AS plan_name,
    s.recurring_amount,
    s.next_billing_date,
    CAST((JULIANDAY(CURRENT_DATE) - JULIANDAY(s.next_billing_date)) AS INTEGER) AS days_billing_delayed,
    'MISSING_INVOICE_BILLING_FAILURE' AS anomaly_type,
    'TRIGGER_AUTOMATED_INVOICE_GENERATION' AS recommended_action
FROM subscriptions s
JOIN customers c ON s.customer_id = c.id
JOIN subscription_plans p ON s.plan_id = p.id
WHERE s.status = 'ACTIVE'
  AND s.next_billing_date <= CURRENT_DATE
  AND NOT EXISTS (
      -- Check if an active invoice already covers or starts on or after next_billing_date
      SELECT 1 
      FROM invoices i 
      WHERE i.subscription_id = s.id 
        AND i.status != 'CANCELLED'
        AND (
            i.billing_period_start >= s.next_billing_date
            OR (s.next_billing_date BETWEEN i.billing_period_start AND i.billing_period_end)
        )
  )
ORDER BY days_billing_delayed DESC;

-- ----------------------------------------------------------------------------
-- 4. CUSTOMERS WITH AGGREGATED OUTSTANDING BALANCES & EXPOSURE
-- Aggregates total balance, overdue portion, and risk rating per customer
-- ----------------------------------------------------------------------------
SELECT 
    c.id AS customer_id,
    c.customer_code,
    c.company_name,
    c.contact_email,
    COUNT(i.id) AS total_unpaid_invoices,
    SUM(i.total_amount) AS total_invoiced,
    SUM(i.amount_paid) AS total_paid,
    SUM(i.outstanding_amount) AS total_exposure,
    SUM(CASE WHEN i.due_date < CURRENT_DATE THEN i.outstanding_amount ELSE 0.00 END) AS overdue_exposure,
    MAX(CASE WHEN i.due_date < CURRENT_DATE THEN CAST((JULIANDAY(CURRENT_DATE) - JULIANDAY(i.due_date)) AS INTEGER) ELSE 0 END) AS max_days_overdue,
    CASE 
        WHEN SUM(CASE WHEN i.due_date < CURRENT_DATE THEN i.outstanding_amount ELSE 0.00 END) > 30000.00 THEN 'HIGH_CREDIT_RISK'
        WHEN SUM(CASE WHEN i.due_date < CURRENT_DATE THEN i.outstanding_amount ELSE 0.00 END) > 0.00 THEN 'MODERATE_CREDIT_RISK'
        ELSE 'CURRENT_INVOICE_DUE'
    END AS credit_risk_tier
FROM customers c
JOIN invoices i ON c.id = i.customer_id
WHERE i.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
GROUP BY c.id, c.customer_code, c.company_name, c.contact_email
HAVING SUM(i.outstanding_amount) > 0.00
ORDER BY overdue_exposure DESC, total_exposure DESC;

-- ----------------------------------------------------------------------------
-- 5. HEALTHY SUBSCRIPTIONS WITHOUT IMMEDIATE BILLING RISK
-- Targets: Active subscriptions with zero overdue invoices and next billing > 14 days
-- Identifies: SCENARIO D (CloudPulse Innovations, SUB-2026-003, perfectly healthy)
-- ----------------------------------------------------------------------------
SELECT 
    s.id AS subscription_id,
    s.subscription_code,
    c.id AS customer_id,
    c.customer_code,
    c.company_name,
    p.plan_code,
    p.name AS plan_name,
    s.recurring_amount,
    s.current_period_end,
    s.next_billing_date,
    CAST((JULIANDAY(s.next_billing_date) - JULIANDAY(CURRENT_DATE)) AS INTEGER) AS days_until_billing,
    'HEALTHY' AS account_health_status,
    'UPSELL_OR_EXPANSION_OPPORTUNITY' AS intelligence_recommendation
FROM subscriptions s
JOIN customers c ON s.customer_id = c.id
JOIN subscription_plans p ON s.plan_id = p.id
WHERE s.status = 'ACTIVE'
  -- Next billing date is comfortably in the future
  AND s.next_billing_date > DATE(CURRENT_DATE, '+14 days')
  -- Customer has zero overdue invoices
  AND NOT EXISTS (
      SELECT 1 
      FROM invoices inv 
      WHERE inv.customer_id = c.id 
        AND inv.status = 'OVERDUE'
  )
  -- Customer has no unpaid invoices past due
  AND NOT EXISTS (
      SELECT 1 
      FROM invoices inv 
      WHERE inv.customer_id = c.id 
        AND inv.due_date < CURRENT_DATE
        AND inv.outstanding_amount > 0.00
        AND inv.status != 'CANCELLED'
  )
ORDER BY s.recurring_amount DESC;

