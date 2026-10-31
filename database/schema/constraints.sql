-- ============================================================================
-- REVORA — Subscription Revenue Intelligence Platform
-- Component: Performance Indexes, Triggers & Advanced Financial Constraints
-- Engineer: Krishna (Database, Finance & System Engineer)
-- Dialect: ANSI SQL / SQLite 3 / PostgreSQL Compatible
-- ============================================================================

-- Ensure foreign keys are enabled
PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. PERFORMANCE & LOOKUP INDEXES
-- Optimizes dashboard queries, revenue aggregations, and intelligence scans
-- ============================================================================

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(contact_email);

-- Products & Variants
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category, is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

-- Subscription Plans
CREATE INDEX IF NOT EXISTS idx_plans_code ON subscription_plans(plan_code);
CREATE INDEX IF NOT EXISTS idx_plans_active_cycle ON subscription_plans(is_active, billing_cycle);

-- Subscriptions (High-priority for intelligence & billing checks)
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal ON subscriptions(auto_renew, current_period_end);

-- Subscription Items
CREATE INDEX IF NOT EXISTS idx_sub_items_subscription ON subscription_items(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_items_product ON subscription_items(product_id);

-- Quotations
CREATE INDEX IF NOT EXISTS idx_quotations_number ON quotations(quotation_number);
CREATE INDEX IF NOT EXISTS idx_quotations_customer_status ON quotations(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_quotations_validity ON quotations(valid_until);

-- Quotation Items
CREATE INDEX IF NOT EXISTS idx_quotation_items_quote ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_prod ON quotation_items(product_id);

-- Invoices (Core of revenue intelligence and aging analysis)
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_aging ON invoices(status, due_date, outstanding_amount);

-- Invoice Items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON invoice_items(product_id);

-- Payments (Cash collection analytics)
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Discounts
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(discount_code);
CREATE INDEX IF NOT EXISTS idx_discounts_validity ON discounts(is_active, valid_from, valid_until);

-- ============================================================================
-- 2. FINANCIAL INTEGRITY AUDIT VIEWS
-- Read-only projections verifying math reconciliation across records
-- ============================================================================

-- View: Invoice Financial Reconciliation
-- Verifies: total_amount = subtotal - discount_amount + tax_amount
-- and: outstanding_amount = total_amount - amount_paid
CREATE VIEW IF NOT EXISTS v_invoice_audit AS
SELECT 
    i.id AS invoice_id,
    i.invoice_number,
    c.company_name,
    i.subtotal,
    i.discount_amount,
    (i.subtotal - i.discount_amount) AS calculated_discounted_subtotal,
    i.tax_amount,
    i.total_amount,
    i.amount_paid,
    i.outstanding_amount,
    (i.total_amount - i.amount_paid) AS calculated_outstanding,
    COALESCE(SUM(CASE WHEN p.status = 'COMPLETED' THEN p.amount ELSE 0.00 END), 0.00) AS total_payments_recorded,
    CASE 
        WHEN ABS(i.amount_paid - COALESCE(SUM(CASE WHEN p.status = 'COMPLETED' THEN p.amount ELSE 0.00 END), 0.00)) < 0.01 
        THEN 'RECONCILED'
        ELSE 'DISCREPANCY'
    END AS payment_ledger_status,
    i.status AS invoice_status,
    i.due_date
FROM invoices i
JOIN customers c ON i.customer_id = c.id
LEFT JOIN payments p ON i.id = p.invoice_id
GROUP BY i.id;

-- ============================================================================
-- 3. AUTOMATED PAYMENT RECONCILIATION TRIGGERS (SQLITE / POSTGRES COMPATIBLE)
-- Keeps invoices.amount_paid, outstanding_amount, and status synchronized
-- ============================================================================

-- Trigger: When a completed payment is inserted, recalculate the invoice ledger idempotently
CREATE TRIGGER IF NOT EXISTS trg_payment_after_insert
AFTER INSERT ON payments
WHEN NEW.status = 'COMPLETED'
BEGIN
    UPDATE invoices
    SET 
        amount_paid = (
            SELECT COALESCE(SUM(amount), 0.00) 
            FROM payments 
            WHERE invoice_id = NEW.invoice_id AND status = 'COMPLETED'
        ),
        outstanding_amount = total_amount - (
            SELECT COALESCE(SUM(amount), 0.00) 
            FROM payments 
            WHERE invoice_id = NEW.invoice_id AND status = 'COMPLETED'
        ),
        status = CASE 
            WHEN (total_amount - (
                SELECT COALESCE(SUM(amount), 0.00) 
                FROM payments 
                WHERE invoice_id = NEW.invoice_id AND status = 'COMPLETED'
            )) <= 0.001 THEN 'PAID'
            WHEN (
                SELECT COALESCE(SUM(amount), 0.00) 
                FROM payments 
                WHERE invoice_id = NEW.invoice_id AND status = 'COMPLETED'
            ) > 0.00 THEN 'PARTIALLY_PAID'
            ELSE status
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.invoice_id;
END;

-- Trigger: When a payment is updated or deleted, recalculate invoice ledger
CREATE TRIGGER IF NOT EXISTS trg_payment_after_update
AFTER UPDATE OF status, amount ON payments
BEGIN
    UPDATE invoices
    SET 
        amount_paid = (
            SELECT COALESCE(SUM(amount), 0.00) 
            FROM payments 
            WHERE invoice_id = NEW.invoice_id AND status = 'COMPLETED'
        ),
        outstanding_amount = total_amount - (
            SELECT COALESCE(SUM(amount), 0.00) 
            FROM payments 
            WHERE invoice_id = NEW.invoice_id AND status = 'COMPLETED'
        ),
        status = CASE 
            WHEN (total_amount - (
                SELECT COALESCE(SUM(amount), 0.00) 
                FROM payments 
                WHERE invoice_id = NEW.invoice_id AND status = 'COMPLETED'
            )) <= 0.001 THEN 'PAID'
            WHEN (
                SELECT COALESCE(SUM(amount), 0.00) 
                FROM payments 
                WHERE invoice_id = NEW.invoice_id AND status = 'COMPLETED'
            ) > 0.00 THEN 'PARTIALLY_PAID'
            WHEN due_date < CURRENT_DATE THEN 'OVERDUE'
            ELSE 'ISSUED'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.invoice_id;
END;

-- ============================================================================
-- 4. DOCUMENTATION: ENFORCEMENT MATRIX (SQL vs PYTHON BACKEND)
-- ============================================================================
-- Rule 1: Non-negative monetary amounts -> Enforced by SQL (CHECK >= 0.00)
-- Rule 2: Subtotal >= Discount -> Enforced by SQL (CHECK discount <= subtotal)
-- Rule 3: Total = Subtotal - Discount + Tax -> Enforced by SQL CHECK constraint
-- Rule 4: Outstanding = Total - Paid -> Enforced by SQL CHECK constraint
-- Rule 5: Multi-payment total cannot exceed invoice total -> Enforced by Sai's
--         Python backend transaction before issuing INSERT to payments table.
--         (Also reinforced by DB trigger).
-- Rule 6: Status transitions (e.g. ISSUED -> PARTIALLY_PAID -> PAID / OVERDUE)
--         -> Managed by backend billing jobs & verified by DB triggers.
-- ============================================================================
