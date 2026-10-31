-- ============================================================================
-- REVORA — Subscription Revenue Intelligence Platform
-- Component: Realistic Demo Seed Data
-- Engineer: Krishna (Database, Finance & System Engineer)
-- Dialect: ANSI SQL / SQLite 3 / PostgreSQL Compatible
-- ============================================================================

-- Ensure foreign key enforcement
PRAGMA foreign_keys = ON;

-- Clean existing demo data in reverse dependency order
DELETE FROM payments;
DELETE FROM invoice_items;
DELETE FROM invoices;
DELETE FROM subscription_items;
DELETE FROM subscriptions;
DELETE FROM quotation_items;
DELETE FROM quotations;
DELETE FROM discounts;
DELETE FROM subscription_plans;
DELETE FROM product_variants;
DELETE FROM products;
DELETE FROM customers;
DELETE FROM users;

-- ----------------------------------------------------------------------------
-- 1. USERS (5 internal users)
-- ----------------------------------------------------------------------------
INSERT INTO users (id, username, email, password_hash, full_name, role, is_active, created_at, updated_at) VALUES
(1, 'krishna.sys', 'krishna@revora.internal', '$2b$12$e8F27vR7D42H5BqkN6MhUO6HwDkJW8k1sR.78W0bI6nKzXyQa7Gme', 'Krishna V.', 'SYSTEM_ENGINEER', 1, date('now', '-60 days'), date('now', '-60 days')),
(2, 'sai.backend', 'sai@revora.internal', '$2b$12$K1d02uB8x32Q1BnmM8NhVO5IwEkKX9l2tR.89X1cJ7oLzYyRb8Hnf', 'Sai K.', 'ADMIN', 1, date('now', '-60 days'), date('now', '-60 days')),
(3, 'prasanth.intel', 'prasanth@revora.internal', '$2b$12$M2e13vC9y43R2ComO9OiWP6JxFlLY0m3uS.90Y2dK8pMzZzSc9Iog', 'Prasanth Reddy', 'INTELLIGENCE_ANALYST', 1, date('now', '-60 days'), date('now', '-60 days')),
(4, 'harshitha.ux', 'harshitha@revora.internal', '$2b$12$N3f24wD0z54S3DpnP0PjXQ7KyGmMZ1n4vT.01Z3eL9qNAAaTd0Jph', 'Harshitha M.', 'FINANCE_MANAGER', 1, date('now', '-60 days'), date('now', '-60 days')),
(5, 'sales.lead', 'sales@revora.internal', '$2b$12$O4g35xE1a65T4EqnQ1QkYR8LzHnNa2o5wU.12a4fM0rOBBbUe1Kqi', 'Rohan Verma', 'SALES_REP', 1, date('now', '-60 days'), date('now', '-60 days'));

-- ----------------------------------------------------------------------------
-- 2. CUSTOMERS (12 B2B organizations)
-- ----------------------------------------------------------------------------
INSERT INTO customers (id, customer_code, company_name, contact_name, contact_email, contact_phone, billing_address, tax_identifier, currency, status, created_at, updated_at) VALUES
(1, 'CUST-001', 'TechNova', 'Aarav Mehta', 'billing@technova.io', '+91-98110-12345', 'Plot 42, Hitec City, Hyderabad, TG 500081', '36AABCT1332L1Z2', 'INR', 'ACTIVE', date('now', '-380 days'), date('now', '-10 days')),
(2, 'CUST-002', 'BrightTech', 'Divya Sharma', 'accounts@brighttech.com', '+91-98220-23456', 'Level 4, Cyber Gateway, Whitefield, Bengaluru, KA 560066', '29AABCB4892K1Z9', 'INR', 'ACTIVE', date('now', '-180 days'), date('now', '-5 days')),
(3, 'CUST-003', 'CloudPulse Innovations', 'Siddharth Nair', 'finance@cloudpulse.tech', '+91-98330-34567', 'Tower B, DLF Cyber City, Gurugram, HR 122002', '06AABCC9921M1Z5', 'INR', 'ACTIVE', date('now', '-210 days'), date('now', '-2 days')),
(4, 'CUST-004', 'Apex Digital', 'Ananya Roy', 'payments@apexdigital.in', '+91-98440-45678', 'Salt Lake Sector V, Kolkata, WB 700091', '19AABCA7741P1ZB', 'INR', 'ACTIVE', date('now', '-120 days'), date('now', '-1 days')),
(5, 'CUST-005', 'Vertex Analytics', 'Kabir Sen', 'kabir@vertexanalytics.com', '+91-98550-56789', 'BKC G-Block, Bandra Kurla Complex, Mumbai, MH 400051', '27AABCV5512Q1ZX', 'INR', 'ACTIVE', date('now', '-150 days'), date('now', '-4 days')),
(6, 'CUST-006', 'Quantum Leap AI', 'Pooja Iyer', 'admin@quantumleap.ai', '+91-98660-67890', 'Tidel Park, Taramani, Chennai, TN 600113', '33AABCQ6634R1ZT', 'INR', 'ACTIVE', date('now', '-300 days'), date('now', '-15 days')),
(7, 'CUST-007', 'BlueSky Logistics', 'Ramesh Patel', 'accounts@blueskye.com', '+91-98770-78901', 'SG Highway, Bodakdev, Ahmedabad, GJ 380054', '24AABCB3319S1Z4', 'INR', 'ACTIVE', date('now', '-90 days'), date('now', '-12 days')),
(8, 'CUST-008', 'FinEdge Capital', 'Vikram Malhotra', 'treasury@finedge.com', '+91-98880-89012', 'Barakhamba Road, Connaught Place, New Delhi, DL 110001', '07AABCF4411T1Z1', 'INR', 'ACTIVE', date('now', '-240 days'), date('now', '-8 days')),
(9, 'CUST-009', 'Nexus Healthcare', 'Dr. Sunita Rao', 'procurement@nexushealth.org', '+91-98990-90123', 'Banjara Hills Rd 12, Hyderabad, TG 500034', '36AABCN8823U1Z8', 'INR', 'INACTIVE', date('now', '-270 days'), date('now', '-40 days')),
(10, 'CUST-010', 'Orbit Retailers', 'Manish Kapoor', 'billing@orbitretail.in', '+91-98001-01234', 'MG Road, Camp, Pune, MH 411001', '27AABCO1129V1Z3', 'INR', 'ACTIVE', date('now', '-100 days'), date('now', '-3 days')),
(11, 'CUST-011', 'CyberGuard Security', 'Alok Deshmukh', 'security-finance@cyberguard.io', '+91-98112-12340', 'Electronic City Phase 1, Bengaluru, KA 560100', '29AABCC5532W1Z7', 'INR', 'ACTIVE', date('now', '-60 days'), date('now', '-2 days')),
(12, 'CUST-012', 'Stellar Media Works', 'Neha Kulkarni', 'accounts@stellarmedia.com', '+91-98223-23451', 'Andheri West Link Rd, Mumbai, MH 400053', '27AABCS7712X1Z0', 'INR', 'ACTIVE', date('now', '-45 days'), date('now', '-1 days'));

-- ----------------------------------------------------------------------------
-- 3. PRODUCTS (6 products: 5 active, 1 inactive)
-- ----------------------------------------------------------------------------
INSERT INTO products (id, product_code, name, description, category, is_active, created_at, updated_at) VALUES
(1, 'PROD-REV-CORE', 'REVORA Core Billing Engine', 'Automated recurring billing, invoicing, and subscription state manager', 'PLATFORM', 1, date('now', '-365 days'), date('now', '-365 days')),
(2, 'PROD-REV-INTEL', 'REVORA Intelligence Suite', 'Predictive renewal intelligence, churn forecasting, and risk scoring', 'ANALYTICS', 1, date('now', '-300 days'), date('now', '-300 days')),
(3, 'PROD-REV-CONN', 'Automated ERP & Bank Connector', 'Bi-directional bank feed integration and accounting reconciliation', 'INTEGRATION', 1, date('now', '-250 days'), date('now', '-250 days')),
(4, 'PROD-REV-SUPP', 'Dedicated 24/7 Enterprise Support', 'Named solutions engineer, SLA guarantee, and emergency billing hotlines', 'SUPPORT', 1, date('now', '-200 days'), date('now', '-200 days')),
(5, 'PROD-REV-SEC', 'REVORA Advanced Compliance Guard', 'SOC2, GDPR, and automated Indian GST compliance audit trails', 'SECURITY', 1, date('now', '-180 days'), date('now', '-180 days')),
(6, 'PROD-REV-LEGACY', 'Legacy On-Premise Sync Agent', 'Deprecated desktop bridge for legacy database installations', 'INTEGRATION', 0, date('now', '-400 days'), date('now', '-90 days'));

-- ----------------------------------------------------------------------------
-- 4. PRODUCT_VARIANTS (8 variants)
-- ----------------------------------------------------------------------------
INSERT INTO product_variants (id, product_id, sku, variant_name, tier, base_price, billing_frequency, is_active, created_at, updated_at) VALUES
(1, 1, 'SKU-CORE-STR', 'Core Starter Tier', 'STARTER', 15000.00, 'MONTHLY', 1, date('now', '-365 days'), date('now', '-365 days')),
(2, 1, 'SKU-CORE-PRO', 'Core Professional Tier', 'PRO', 35000.00, 'MONTHLY', 1, date('now', '-365 days'), date('now', '-365 days')),
(3, 1, 'SKU-CORE-ENT-A', 'Core Enterprise Annual Tier', 'ENTERPRISE', 120000.00, 'ANNUAL', 1, date('now', '-365 days'), date('now', '-365 days')),
(4, 2, 'SKU-INTEL-PRO', 'Intelligence Suite Pro Tier', 'PRO', 25000.00, 'MONTHLY', 1, date('now', '-300 days'), date('now', '-300 days')),
(5, 2, 'SKU-INTEL-ENT', 'Intelligence Suite Enterprise Tier', 'ENTERPRISE', 60000.00, 'ANNUAL', 1, date('now', '-300 days'), date('now', '-300 days')),
(6, 3, 'SKU-CONN-STD', 'Standard Bank & ERP Connector', 'GROWTH', 10000.00, 'MONTHLY', 1, date('now', '-250 days'), date('now', '-250 days')),
(7, 4, 'SKU-SUPP-ENT', 'Enterprise Priority 24/7 Support', 'ENTERPRISE', 15000.00, 'MONTHLY', 1, date('now', '-200 days'), date('now', '-200 days')),
(8, 5, 'SKU-SEC-GUARD', 'Compliance & GST Shield', 'PRO', 12000.00, 'MONTHLY', 1, date('now', '-180 days'), date('now', '-180 days'));

-- ----------------------------------------------------------------------------
-- 5. SUBSCRIPTION_PLANS (6 plans: monthly, quarterly, annual)
-- ----------------------------------------------------------------------------
INSERT INTO subscription_plans (id, plan_code, name, description, billing_cycle, billing_period_days, plan_price, currency, is_active, created_at, updated_at) VALUES
(1, 'PLAN-STARTER-M', 'Starter Monthly Bundle', 'Entry tier for growing SaaS teams up to 500 subscribers', 'MONTHLY', 30, 15000.00, 'INR', 1, date('now', '-365 days'), date('now', '-365 days')),
(2, 'PLAN-PRO-M', 'Professional Monthly Bundle', 'Complete billing and reporting suite for scaling ventures', 'MONTHLY', 30, 25000.00, 'INR', 1, date('now', '-365 days'), date('now', '-365 days')),
(3, 'PLAN-ADV-M', 'Advanced Billing Monthly', 'High throughput billing engine with multi-currency support', 'MONTHLY', 30, 48000.00, 'INR', 1, date('now', '-365 days'), date('now', '-365 days')),
(4, 'PLAN-GROWTH-Q', 'Growth Quarterly Tier', 'Quarterly packaged suite with dedicated connector', 'QUARTERLY', 90, 75000.00, 'INR', 1, date('now', '-365 days'), date('now', '-365 days')),
(5, 'PLAN-ENT-ANNUAL', 'Enterprise Annual All-Access', 'Full platform, intelligence engine, ERP connector, and priority support', 'ANNUAL', 365, 120000.00, 'INR', 1, date('now', '-365 days'), date('now', '-365 days')),
(6, 'PLAN-INTEL-M', 'Pure Intelligence Monthly', 'Standalone AI predictive intelligence for external billing platforms', 'MONTHLY', 30, 35000.00, 'INR', 1, date('now', '-300 days'), date('now', '-300 days'));

-- ----------------------------------------------------------------------------
-- 6. DISCOUNTS (4 active promotional codes)
-- ----------------------------------------------------------------------------
INSERT INTO discounts (id, discount_code, name, discount_type, value, min_subtotal, max_discount_amount, valid_from, valid_until, is_active, created_at, updated_at) VALUES
(1, 'EARLYBIRD20', 'Early Bird 20% Discount', 'PERCENTAGE', 20.00, 20000.00, 10000.00, date('now', '-180 days'), date('now', '+180 days'), 1, date('now', '-180 days'), date('now', '-180 days')),
(2, 'HACKATHON10', 'Makeaton Special 10% Off', 'PERCENTAGE', 10.00, 10000.00, 5000.00, date('now', '-30 days'), date('now', '+60 days'), 1, date('now', '-30 days'), date('now', '-30 days')),
(3, 'ENTERPRISE5000', 'Enterprise Flat Concession', 'FIXED_AMOUNT', 5000.00, 50000.00, 5000.00, date('now', '-120 days'), date('now', '+120 days'), 1, date('now', '-120 days'), date('now', '-120 days')),
(4, 'STARTUPFREE2K', 'Startup Subsidy Voucher', 'FIXED_AMOUNT', 2000.00, 15000.00, 2000.00, date('now', '-90 days'), date('now', '+90 days'), 1, date('now', '-90 days'), date('now', '-90 days'));

-- ----------------------------------------------------------------------------
-- 7. QUOTATIONS (4 pre-sales proposals)
-- ----------------------------------------------------------------------------
INSERT INTO quotations (id, quotation_number, customer_id, issue_date, valid_until, subtotal, discount_amount, tax_amount, total_amount, currency, status, notes, created_by, created_at, updated_at) VALUES
(1, 'QT-2026-001', 1, date('now', '-375 days'), date('now', '-345 days'), 101694.92, 0.00, 18305.08, 120000.00, 'INR', 'ACCEPTED', 'Enterprise Annual Contract for TechNova', 5, date('now', '-375 days'), date('now', '-370 days')),
(2, 'QT-2026-002', 2, date('now', '-190 days'), date('now', '-160 days'), 40677.97, 0.00, 7322.03, 48000.00, 'INR', 'ACCEPTED', 'Advanced Billing Suite Quote for BrightTech', 5, date('now', '-190 days'), date('now', '-185 days')),
(3, 'QT-2026-003', 11, date('now', '-20 days'), date('now', '+10 days'), 29661.02, 0.00, 5338.98, 35000.00, 'INR', 'SENT', 'Pending executive review at CyberGuard Security', 5, date('now', '-20 days'), date('now', '-20 days')),
(4, 'QT-2026-004', 12, date('now', '-40 days'), date('now', '-10 days'), 12711.86, 0.00, 2288.14, 15000.00, 'INR', 'REJECTED', 'Client postponed Q4 expansion plans', 5, date('now', '-40 days'), date('now', '-15 days'));

-- Quotation Line Items
INSERT INTO quotation_items (id, quotation_id, product_id, variant_id, description, quantity, unit_price, discount_amount, tax_rate, tax_amount, line_total, created_at) VALUES
(1, 1, 1, 3, 'Core Enterprise Annual Platform License', 1, 101694.92, 0.00, 18.00, 18305.08, 120000.00, date('now', '-375 days')),
(2, 2, 1, 2, 'Core Professional Billing Package', 1, 40677.97, 0.00, 18.00, 7322.03, 48000.00, date('now', '-190 days')),
(3, 3, 2, 4, 'Intelligence Suite Pro License', 1, 29661.02, 0.00, 18.00, 5338.98, 35000.00, date('now', '-20 days')),
(4, 4, 1, 1, 'Starter Monthly Subscription License', 1, 12711.86, 0.00, 18.00, 2288.14, 15000.00, date('now', '-40 days'));

-- ----------------------------------------------------------------------------
-- 8. SUBSCRIPTIONS (10 subscriptions: active, paused, closed, past_due)
-- Scenario B: TechNova (SUB-001) expires in +5 days (Annual ₹1,20,000)
-- Scenario C: Apex Digital (SUB-004) next billing was 2 days ago (-2 days), NO invoice!
-- Scenario D: CloudPulse (SUB-003) active, next billing +25 days, perfectly healthy
-- Scenario A: BrightTech (SUB-002) has overdue invoice INV-1042
-- ----------------------------------------------------------------------------
INSERT INTO subscriptions (id, subscription_code, customer_id, plan_id, start_date, current_period_start, current_period_end, next_billing_date, end_date, cancellation_date, renewal_count, recurring_amount, currency, status, auto_renew, created_at, updated_at) VALUES
-- 1. TechNova (Scenario B: High-value renewal in 5 days, ₹1,20,000/yr)
(1, 'SUB-2026-001', 1, 5, date('now', '-360 days'), date('now', '-360 days'), date('now', '+5 days'), date('now', '+5 days'), NULL, NULL, 0, 120000.00, 'INR', 'ACTIVE', 1, date('now', '-360 days'), date('now', '-5 days')),

-- 2. BrightTech (Scenario A: Active subscription, associated with overdue invoice INV-1042)
(2, 'SUB-2026-002', 2, 3, date('now', '-150 days'), date('now', '-42 days'), date('now', '-12 days'), date('now', '-12 days'), NULL, NULL, 3, 48000.00, 'INR', 'ACTIVE', 1, date('now', '-150 days'), date('now', '-12 days')),

-- 3. CloudPulse Innovations (Scenario D: Healthy customer, active, paid, 0 overdue, next billing in +25 days)
(3, 'SUB-2026-003', 3, 2, date('now', '-180 days'), date('now', '-5 days'), date('now', '+25 days'), date('now', '+25 days'), NULL, NULL, 5, 25000.00, 'INR', 'ACTIVE', 1, date('now', '-180 days'), date('now', '-5 days')),

-- 4. Apex Digital (Scenario C: Potential billing risk! Next billing was 2 days ago, NO invoice exists for period!)
(4, 'SUB-2026-004', 4, 1, date('now', '-92 days'), date('now', '-32 days'), date('now', '-2 days'), date('now', '-2 days'), NULL, NULL, 2, 15000.00, 'INR', 'ACTIVE', 1, date('now', '-92 days'), date('now', '-2 days')),

-- 5. Vertex Analytics (Active, billing in +18 days)
(5, 'SUB-2026-005', 5, 6, date('now', '-120 days'), date('now', '-12 days'), date('now', '+18 days'), date('now', '+18 days'), NULL, NULL, 3, 35000.00, 'INR', 'ACTIVE', 1, date('now', '-120 days'), date('now', '-12 days')),

-- 6. Quantum Leap AI (Active Annual, billing in +180 days)
(6, 'SUB-2026-006', 6, 5, date('now', '-185 days'), date('now', '-185 days'), date('now', '+180 days'), date('now', '+180 days'), NULL, NULL, 0, 120000.00, 'INR', 'ACTIVE', 1, date('now', '-185 days'), date('now', '-15 days')),

-- 7. BlueSky Logistics (PAUSED subscription)
(7, 'SUB-2026-007', 7, 1, date('now', '-80 days'), date('now', '-50 days'), date('now', '-20 days'), date('now', '-20 days'), NULL, NULL, 1, 15000.00, 'INR', 'PAUSED', 0, date('now', '-80 days'), date('now', '-20 days')),

-- 8. FinEdge Capital (Active Quarterly, next billing in +40 days)
(8, 'SUB-2026-008', 8, 4, date('now', '-200 days'), date('now', '-50 days'), date('now', '+40 days'), date('now', '+40 days'), NULL, NULL, 1, 75000.00, 'INR', 'ACTIVE', 1, date('now', '-200 days'), date('now', '-10 days')),

-- 9. Nexus Healthcare (CLOSED / CANCELLED subscription)
(9, 'SUB-2026-009', 9, 2, date('now', '-240 days'), date('now', '-150 days'), date('now', '-120 days'), date('now', '-120 days'), date('now', '-120 days'), date('now', '-120 days'), 3, 25000.00, 'INR', 'CLOSED', 0, date('now', '-240 days'), date('now', '-120 days')),

-- 10. Orbit Retailers (PAST_DUE subscription)
(10, 'SUB-2026-010', 10, 1, date('now', '-90 days'), date('now', '-35 days'), date('now', '-5 days'), date('now', '-5 days'), NULL, NULL, 1, 15000.00, 'INR', 'PAST_DUE', 1, date('now', '-90 days'), date('now', '-5 days'));

-- Subscription Line Items
INSERT INTO subscription_items (id, subscription_id, product_id, variant_id, quantity, unit_price, created_at) VALUES
(1, 1, 1, 3, 1, 101694.92, date('now', '-360 days')),
(2, 2, 1, 2, 1, 40677.97, date('now', '-150 days')),
(3, 3, 1, 2, 1, 21186.44, date('now', '-180 days')),
(4, 4, 1, 1, 1, 12711.86, date('now', '-92 days')),
(5, 5, 2, 4, 1, 29661.02, date('now', '-120 days')),
(6, 6, 1, 3, 1, 101694.92, date('now', '-185 days')),
(7, 7, 1, 1, 1, 12711.86, date('now', '-80 days')),
(8, 8, 1, 2, 1, 63559.32, date('now', '-200 days')),
(9, 9, 1, 2, 1, 21186.44, date('now', '-240 days')),
(10, 10, 1, 1, 1, 12711.86, date('now', '-90 days'));

-- ----------------------------------------------------------------------------
-- 9. INVOICES (14 invoices across all statuses)
-- Scenario A: INV-1042 BrightTech, ₹48,000 total, ₹0 paid, ₹48,000 outstanding, due 12 days ago, OVERDUE
-- Scenario D: INV-1003 CloudPulse, ₹25,000 total, ₹25,000 paid, ₹0 outstanding, PAID
-- ----------------------------------------------------------------------------
INSERT INTO invoices (id, invoice_number, customer_id, subscription_id, quotation_id, billing_period_start, billing_period_end, issue_date, due_date, subtotal, discount_amount, tax_amount, total_amount, amount_paid, outstanding_amount, currency, status, notes, created_at, updated_at) VALUES
-- 1. TechNova initial annual invoice (PAID)
(1, 'INV-1001', 1, 1, 1, date('now', '-360 days'), date('now', '+5 days'), date('now', '-360 days'), date('now', '-330 days'), 101694.92, 0.00, 18305.08, 120000.00, 120000.00, 0.00, 'INR', 'PAID', 'Annual Enterprise contract paid via Wire Transfer', date('now', '-360 days'), date('now', '-335 days')),

-- 2. BrightTech prior month invoice (PAID)
(2, 'INV-1002', 2, 2, 2, date('now', '-72 days'), date('now', '-42 days'), date('now', '-72 days'), date('now', '-42 days'), 40677.97, 0.00, 7322.03, 48000.00, 48000.00, 0.00, 'INR', 'PAID', 'Prior month billing cleared', date('now', '-72 days'), date('now', '-45 days')),

-- 3. BrightTech (SCENARIO A: High-value overdue invoice INV-1042)
(3, 'INV-1042', 2, 2, NULL, date('now', '-42 days'), date('now', '-12 days'), date('now', '-42 days'), date('now', '-12 days'), 40677.97, 0.00, 7322.03, 48000.00, 0.00, 48000.00, 'INR', 'OVERDUE', 'High value invoice past due by 12 days. Dunning email triggered.', date('now', '-42 days'), date('now', '-12 days')),

-- 4. CloudPulse Innovations (SCENARIO D: Healthy customer invoice, PAID)
(4, 'INV-1003', 3, 3, NULL, date('now', '-5 days'), date('now', '+25 days'), date('now', '-5 days'), date('now', '+10 days'), 21186.44, 0.00, 3813.56, 25000.00, 25000.00, 0.00, 'INR', 'PAID', 'Auto-debited successfully via corporate card', date('now', '-5 days'), date('now', '-5 days')),

-- 5. CloudPulse prior onboarding invoice (PAID)
(5, 'INV-1012', 3, 3, NULL, date('now', '-180 days'), date('now', '-150 days'), date('now', '-180 days'), date('now', '-165 days'), 16949.15, 0.00, 3050.85, 20000.00, 20000.00, 0.00, 'INR', 'PAID', 'Initial onboarding setup fee', date('now', '-180 days'), date('now', '-170 days')),

-- 6. Apex Digital PREVIOUS cycle invoice (PAID)
-- (Notice: Apex Digital has NO invoice for period starting date('now', '-2 days'), causing SCENARIO C risk!)
(6, 'INV-1004', 4, 4, NULL, date('now', '-62 days'), date('now', '-32 days'), date('now', '-62 days'), date('now', '-32 days'), 12711.86, 0.00, 2288.14, 15000.00, 15000.00, 0.00, 'INR', 'PAID', 'Previous period cleared', date('now', '-62 days'), date('now', '-35 days')),

-- 7. Vertex Analytics invoice (PAID)
(7, 'INV-1005', 5, 5, NULL, date('now', '-12 days'), date('now', '+18 days'), date('now', '-12 days'), date('now', '+3 days'), 29661.02, 0.00, 5338.98, 35000.00, 35000.00, 0.00, 'INR', 'PAID', 'Monthly intelligence package fee', date('now', '-12 days'), date('now', '-10 days')),

-- 8. Vertex Analytics add-on module (PAID)
(8, 'INV-1013', 5, 5, NULL, date('now', '-25 days'), date('now', '+5 days'), date('now', '-25 days'), date('now', '-10 days'), 8474.58, 0.00, 1525.42, 10000.00, 10000.00, 0.00, 'INR', 'PAID', 'Additional seat expansion package', date('now', '-25 days'), date('now', '-12 days')),

-- 9. Quantum Leap AI Annual invoice (PAID)
(9, 'INV-1006', 6, 6, NULL, date('now', '-185 days'), date('now', '+180 days'), date('now', '-185 days'), date('now', '-155 days'), 101694.92, 0.00, 18305.08, 120000.00, 120000.00, 0.00, 'INR', 'PAID', 'Annual Enterprise contract cleared in full', date('now', '-185 days'), date('now', '-160 days')),

-- 10. FinEdge Capital quarterly invoice (PARTIALLY_PAID: ₹40,000 paid, ₹35,000 outstanding)
(10, 'INV-1007', 8, 8, NULL, date('now', '-50 days'), date('now', '+40 days'), date('now', '-50 days'), date('now', '+10 days'), 63559.32, 0.00, 11440.68, 75000.00, 40000.00, 35000.00, 'INR', 'PARTIALLY_PAID', 'Two milestone payments made; balance due next week', date('now', '-50 days'), date('now', '-20 days')),

-- 11. Orbit Retailers (OVERDUE: ₹15,000 total, 5 days overdue)
(11, 'INV-1008', 10, 10, NULL, date('now', '-35 days'), date('now', '-5 days'), date('now', '-35 days'), date('now', '-5 days'), 12711.86, 0.00, 2288.14, 15000.00, 0.00, 15000.00, 'INR', 'OVERDUE', 'Payment bounced; retry scheduled', date('now', '-35 days'), date('now', '-5 days')),

-- 12. CyberGuard Security (ISSUED: ₹35,000 total, due in 15 days)
(12, 'INV-1009', 11, NULL, 3, date('now', '-5 days'), date('now', '+25 days'), date('now', '-5 days'), date('now', '+15 days'), 29661.02, 0.00, 5338.98, 35000.00, 0.00, 35000.00, 'INR', 'ISSUED', 'First invoice generated following accepted quote', date('now', '-5 days'), date('now', '-5 days')),

-- 13. Stellar Media Works (DRAFT: ₹15,000 total)
(13, 'INV-1010', 12, NULL, NULL, date('now'), date('now', '+30 days'), date('now'), date('now', '+15 days'), 12711.86, 0.00, 2288.14, 15000.00, 0.00, 15000.00, 'INR', 'DRAFT', 'Draft pending internal sales approval', date('now'), date('now')),

-- 14. BlueSky Logistics (CANCELLED: ₹15,000 total, voided upon contract pause)
(14, 'INV-1011', 7, 7, NULL, date('now', '-50 days'), date('now', '-20 days'), date('now', '-50 days'), date('now', '-20 days'), 12711.86, 0.00, 2288.14, 15000.00, 0.00, 15000.00, 'INR', 'CANCELLED', 'Voided due to customer pause request', date('now', '-50 days'), date('now', '-25 days'));

-- Invoice Line Items
INSERT INTO invoice_items (id, invoice_id, product_id, variant_id, description, quantity, unit_price, discount_amount, tax_rate, tax_amount, line_total, created_at) VALUES
(1, 1, 1, 3, 'Core Enterprise Annual Platform License', 1, 101694.92, 0.00, 18.00, 18305.08, 120000.00, date('now', '-360 days')),
(2, 2, 1, 2, 'Core Professional Billing Package (Month 1)', 1, 40677.97, 0.00, 18.00, 7322.03, 48000.00, date('now', '-72 days')),
(3, 3, 1, 2, 'Core Professional Billing Package (Month 2 - SCENARIO A)', 1, 40677.97, 0.00, 18.00, 7322.03, 48000.00, date('now', '-42 days')),
(4, 4, 1, 2, 'Professional Monthly Subscription (SCENARIO D)', 1, 21186.44, 0.00, 18.00, 3813.56, 25000.00, date('now', '-5 days')),
(5, 5, 1, 1, 'Initial Implementation & Setup', 1, 16949.15, 0.00, 18.00, 3050.85, 20000.00, date('now', '-180 days')),
(6, 6, 1, 1, 'Starter Monthly Subscription License', 1, 12711.86, 0.00, 18.00, 2288.14, 15000.00, date('now', '-62 days')),
(7, 7, 2, 4, 'Intelligence Suite Pro Subscription', 1, 29661.02, 0.00, 18.00, 5338.98, 35000.00, date('now', '-12 days')),
(8, 8, 3, 6, 'Bank & ERP Connector Add-on', 1, 8474.58, 0.00, 18.00, 1525.42, 10000.00, date('now', '-25 days')),
(9, 9, 1, 3, 'Core Enterprise Annual Platform License', 1, 101694.92, 0.00, 18.00, 18305.08, 120000.00, date('now', '-185 days')),
(10, 10, 1, 2, 'Growth Quarterly Subscription Bundle', 1, 63559.32, 0.00, 18.00, 11440.68, 75000.00, date('now', '-50 days')),
(11, 11, 1, 1, 'Starter Monthly Subscription', 1, 12711.86, 0.00, 18.00, 2288.14, 15000.00, date('now', '-35 days')),
(12, 12, 2, 4, 'Intelligence Pro Initial Service Charge', 1, 29661.02, 0.00, 18.00, 5338.98, 35000.00, date('now', '-5 days')),
(13, 13, 1, 1, 'Starter Monthly Subscription (Draft)', 1, 12711.86, 0.00, 18.00, 2288.14, 15000.00, date('now')),
(14, 14, 1, 1, 'Starter Monthly Subscription (Cancelled)', 1, 12711.86, 0.00, 18.00, 2288.14, 15000.00, date('now', '-50 days'));

-- ----------------------------------------------------------------------------
-- 10. PAYMENTS (10 completed payments across invoices)
-- Notice: INV-1007 has TWO separate payments (multi-payment scenario)
-- Total Cash Collected = 120000 + 48000 + 25000 + 20000 + 15000 + 35000 + 10000 + 120000 + 20000 + 20000 = ₹4,33,000.00
-- ----------------------------------------------------------------------------
INSERT INTO payments (id, payment_reference, invoice_id, customer_id, payment_date, payment_method, amount, currency, status, transaction_id, notes, created_at, updated_at) VALUES
(1, 'PAY-2026-001', 1, 1, date('now', '-335 days'), 'BANK_TRANSFER', 120000.00, 'INR', 'COMPLETED', 'TXN_TECH_9921', 'Annual Enterprise wire payment received', date('now', '-335 days'), date('now', '-335 days')),
(2, 'PAY-2026-002', 2, 2, date('now', '-45 days'), 'BANK_TRANSFER', 48000.00, 'INR', 'COMPLETED', 'TXN_BRIGHT_1041', 'Bank transfer cleared via NEFT', date('now', '-45 days'), date('now', '-45 days')),
(3, 'PAY-2026-003', 4, 3, date('now', '-5 days'), 'CREDIT_CARD', 25000.00, 'INR', 'COMPLETED', 'TXN_CLOUDPULSE_771', 'Stripe automated card charge', date('now', '-5 days'), date('now', '-5 days')),
(4, 'PAY-2026-004', 5, 3, date('now', '-170 days'), 'CREDIT_CARD', 20000.00, 'INR', 'COMPLETED', 'TXN_CLOUDPULSE_101', 'Initial setup fee auto-pay', date('now', '-170 days'), date('now', '-170 days')),
(5, 'PAY-2026-005', 6, 4, date('now', '-35 days'), 'UPI', 15000.00, 'INR', 'COMPLETED', 'TXN_APEX_UPI_441', 'UPI payment via Razorpay', date('now', '-35 days'), date('now', '-35 days')),
(6, 'PAY-2026-006', 7, 5, date('now', '-10 days'), 'RAZORPAY', 35000.00, 'INR', 'COMPLETED', 'TXN_VERTEX_RZP_881', 'Razorpay corporate payment', date('now', '-10 days'), date('now', '-10 days')),
(7, 'PAY-2026-007', 8, 5, date('now', '-12 days'), 'UPI', 10000.00, 'INR', 'COMPLETED', 'TXN_VERTEX_UPI_331', 'UPI add-on payment', date('now', '-12 days'), date('now', '-12 days')),
(8, 'PAY-2026-008', 9, 6, date('now', '-160 days'), 'BANK_TRANSFER', 120000.00, 'INR', 'COMPLETED', 'TXN_QUANTUM_RTGS_55', 'RTGS transfer from Quantum Leap AI', date('now', '-160 days'), date('now', '-160 days')),
(9, 'PAY-2026-009', 10, 8, date('now', '-40 days'), 'BANK_TRANSFER', 20000.00, 'INR', 'COMPLETED', 'TXN_FINEDG_PART1', 'First installment for Q1 subscription', date('now', '-40 days'), date('now', '-40 days')),
(10, 'PAY-2026-010', 10, 8, date('now', '-20 days'), 'BANK_TRANSFER', 20000.00, 'INR', 'COMPLETED', 'TXN_FINEDG_PART2', 'Second installment for Q1 subscription', date('now', '-20 days'), date('now', '-20 days'));

