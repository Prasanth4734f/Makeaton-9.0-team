-- ============================================================================
-- REVORA — Subscription Revenue Intelligence Platform
-- Component: Core Relational Database Schema
-- Engineer: Krishna (Database, Finance & System Engineer)
-- Dialect: ANSI SQL-92 / SQLite 3 / PostgreSQL Compatible
-- ============================================================================

-- Ensure foreign key enforcement is active in SQLite environments
PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. USERS
-- Internal operators, finance managers, system administrators, and analysts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'ADMIN',
        'FINANCE_MANAGER',
        'SALES_REP',
        'SYSTEM_ENGINEER',
        'INTELLIGENCE_ANALYST'
    )),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. CUSTOMERS
-- B2B client organizations purchasing subscriptions and services
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_code VARCHAR(50) NOT NULL UNIQUE,
    company_name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100) NOT NULL UNIQUE,
    contact_phone VARCHAR(30),
    billing_address TEXT,
    tax_identifier VARCHAR(50), -- GSTIN / VAT / PAN
    currency VARCHAR(3) NOT NULL DEFAULT 'INR' CHECK (LENGTH(currency) = 3),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN (
        'ACTIVE',
        'INACTIVE',
        'CHURNED',
        'SUSPENDED'
    )),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. PRODUCTS
-- Catalog of software modules, platforms, and recurring services
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'PLATFORM',
        'ANALYTICS',
        'INTEGRATION',
        'SUPPORT',
        'SECURITY'
    )),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. PRODUCT_VARIANTS
-- Specific tiers, packages, or SKUs associated with products
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    sku VARCHAR(50) NOT NULL UNIQUE,
    variant_name VARCHAR(100) NOT NULL,
    tier VARCHAR(30) NOT NULL CHECK (tier IN (
        'STARTER',
        'GROWTH',
        'PRO',
        'ENTERPRISE'
    )),
    base_price DECIMAL(12, 2) NOT NULL CHECK (base_price >= 0.00),
    billing_frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY' CHECK (billing_frequency IN (
        'MONTHLY',
        'QUARTERLY',
        'ANNUAL'
    )),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. SUBSCRIPTION_PLANS
-- Standard packaged pricing bundles available for subscription contracts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN (
        'MONTHLY',
        'QUARTERLY',
        'ANNUAL'
    )),
    billing_period_days INTEGER NOT NULL CHECK (billing_period_days > 0),
    plan_price DECIMAL(12, 2) NOT NULL CHECK (plan_price >= 0.00),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR' CHECK (LENGTH(currency) = 3),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 6. DISCOUNTS
-- Promotional codes, negotiated deductions, and enterprise price concessions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS discounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discount_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN (
        'PERCENTAGE',
        'FIXED_AMOUNT'
    )),
    value DECIMAL(12, 2) NOT NULL CHECK (value >= 0.00),
    min_subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (min_subtotal >= 0.00),
    max_discount_amount DECIMAL(12, 2),
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (valid_until >= valid_from)
);

-- ----------------------------------------------------------------------------
-- 7. QUOTATIONS
-- Commercial proposals issued to prospective or existing clients
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quotation_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    issue_date DATE NOT NULL,
    valid_until DATE NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0.00),
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0.00),
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0.00),
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0.00),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR' CHECK (LENGTH(currency) = 3),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT',
        'SENT',
        'ACCEPTED',
        'REJECTED',
        'EXPIRED'
    )),
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (valid_until >= issue_date),
    CHECK (discount_amount <= subtotal),
    CHECK (total_amount = subtotal - discount_amount + tax_amount)
);

-- ----------------------------------------------------------------------------
-- 8. QUOTATION_ITEMS
-- Granular line items detailing products, variants, and quantities in a quote
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotation_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    description VARCHAR(255),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0.00),
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0.00),
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 18.00 CHECK (tax_rate >= 0.00 AND tax_rate <= 100.00),
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0.00),
    line_total DECIMAL(12, 2) NOT NULL CHECK (line_total >= 0.00),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (discount_amount <= (quantity * unit_price))
);

-- ----------------------------------------------------------------------------
-- 9. SUBSCRIPTIONS
-- Recurring contracts binding customers to plans with billing lifecycle states
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_code VARCHAR(50) NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    start_date DATE NOT NULL,
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    next_billing_date DATE NOT NULL,
    end_date DATE,
    cancellation_date DATE,
    renewal_count INTEGER NOT NULL DEFAULT 0 CHECK (renewal_count >= 0),
    recurring_amount DECIMAL(12, 2) NOT NULL CHECK (recurring_amount >= 0.00),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR' CHECK (LENGTH(currency) = 3),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN (
        'TRIALING',
        'ACTIVE',
        'PAUSED',
        'PAST_DUE',
        'CANCELLED',
        'CLOSED'
    )),
    auto_renew INTEGER NOT NULL DEFAULT 1 CHECK (auto_renew IN (0, 1)),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (current_period_end >= current_period_start)
);

-- ----------------------------------------------------------------------------
-- 10. SUBSCRIPTION_ITEMS
-- Product components, seat allocations, or module entitlements in a subscription
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0.00),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 11. INVOICES
-- Billing statements generated against subscriptions or direct client charges
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL ON UPDATE CASCADE,
    quotation_id INTEGER REFERENCES quotations(id) ON DELETE SET NULL ON UPDATE CASCADE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0.00),
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0.00),
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0.00),
    total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0.00),
    amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0.00),
    outstanding_amount DECIMAL(12, 2) NOT NULL CHECK (outstanding_amount >= 0.00),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR' CHECK (LENGTH(currency) = 3),
    status VARCHAR(20) NOT NULL DEFAULT 'ISSUED' CHECK (status IN (
        'DRAFT',
        'ISSUED',
        'PARTIALLY_PAID',
        'PAID',
        'OVERDUE',
        'CANCELLED'
    )),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (due_date >= issue_date),
    CHECK (billing_period_end >= billing_period_start),
    CHECK (discount_amount <= subtotal),
    CHECK (total_amount = subtotal - discount_amount + tax_amount),
    CHECK (amount_paid <= total_amount),
    CHECK (outstanding_amount = total_amount - amount_paid)
);

-- ----------------------------------------------------------------------------
-- 12. INVOICE_ITEMS
-- Billed line items linked directly to invoices and product catalog items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE ON UPDATE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0.00),
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0.00),
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 18.00 CHECK (tax_rate >= 0.00 AND tax_rate <= 100.00),
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0.00),
    line_total DECIMAL(12, 2) NOT NULL CHECK (line_total >= 0.00),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (discount_amount <= (quantity * unit_price))
);

-- ----------------------------------------------------------------------------
-- 13. PAYMENTS
-- Financial transactions recorded against invoices (supports multi-payments)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_reference VARCHAR(100) NOT NULL UNIQUE,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN (
        'BANK_TRANSFER',
        'CREDIT_CARD',
        'UPI',
        'ACH',
        'STRIPE',
        'RAZORPAY'
    )),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0.00),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR' CHECK (LENGTH(currency) = 3),
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN (
        'PENDING',
        'COMPLETED',
        'FAILED',
        'REFUNDED'
    )),
    transaction_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

