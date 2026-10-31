# REVORA Relational Data Dictionary

**System**: REVORA — Subscription Revenue Intelligence Platform  
**Engineer**: Krishna (Database, Finance & System Engineer)  
**Standard**: Comprehensive Column-Level Data Dictionary for All 13 Tables  

---

## 1. Table: `users`
Internal system users, operators, administrators, and analysts.

| Column Name | Data Type | Purpose | Constraints | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INTEGER | System surrogate identifier | PRIMARY KEY AUTOINCREMENT | `1` |
| `username` | VARCHAR(50) | Unique system handle | NOT NULL, UNIQUE | `'krishna.sys'` |
| `email` | VARCHAR(100) | Operational email address | NOT NULL, UNIQUE | `'krishna@revora.internal'` |
| `password_hash`| VARCHAR(255) | Secure salted password hash | NOT NULL | `'$2b$12$e8F27vR7D42...'` |
| `full_name` | VARCHAR(100) | Full legal or display name | NOT NULL | `'Krishna V.'` |
| `role` | VARCHAR(50) | Access control role | CHECK IN ('ADMIN', 'FINANCE_MANAGER', 'SALES_REP', 'SYSTEM_ENGINEER', 'INTELLIGENCE_ANALYST') | `'SYSTEM_ENGINEER'` |
| `is_active` | INTEGER | Active status flag (1=True, 0=False)| NOT NULL, DEFAULT 1, CHECK IN (0, 1) | `1` |
| `created_at` | TIMESTAMP | Record creation timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2026-08-31 10:00:00'` |
| `updated_at` | TIMESTAMP | Last record update timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2026-08-31 10:00:00'` |

---

## 2. Table: `customers`
B2B client organizations purchasing subscriptions and services.

| Column Name | Data Type | Purpose | Constraints | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INTEGER | Customer surrogate identifier | PRIMARY KEY AUTOINCREMENT | `1` |
| `customer_code`| VARCHAR(50) | Natural business code | NOT NULL, UNIQUE | `'CUST-001'` |
| `company_name` | VARCHAR(150) | Registered company name | NOT NULL | `'TechNova'` |
| `contact_name` | VARCHAR(100) | Primary account representative | NOT NULL | `'Aarav Mehta'` |
| `contact_email`| VARCHAR(100) | Accounts/billing email | NOT NULL, UNIQUE | `'billing@technova.io'` |
| `contact_phone`| VARCHAR(30) | Billing contact telephone | NULLABLE | `'+91-98110-12345'` |
| `billing_address`| TEXT | Full physical/postal address | NULLABLE | `'Plot 42, Hitec City, Hyderabad'` |
| `tax_identifier`| VARCHAR(50) | GSTIN, PAN, or VAT registration | NULLABLE | `'36AABCT1332L1Z2'` |
| `currency` | VARCHAR(3) | Billing currency code | NOT NULL, DEFAULT 'INR', LENGTH=3 | `'INR'` |
| `status` | VARCHAR(20) | Customer lifecycle status | CHECK IN ('ACTIVE', 'INACTIVE', 'CHURNED', 'SUSPENDED') | `'ACTIVE'` |
| `created_at` | TIMESTAMP | Creation timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2025-10-15 09:30:00'` |
| `updated_at` | TIMESTAMP | Modification timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2026-10-20 14:15:00'` |

---

## 3. Table: `products`
Catalog of software capabilities, modules, and platform offerings.

| Column Name | Data Type | Purpose | Constraints | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INTEGER | Product surrogate identifier | PRIMARY KEY AUTOINCREMENT | `1` |
| `product_code` | VARCHAR(50) | Natural product identifier | NOT NULL, UNIQUE | `'PROD-REV-CORE'` |
| `name` | VARCHAR(100) | Commercial module name | NOT NULL | `'REVORA Core Billing Engine'` |
| `description` | TEXT | Detailed functional description | NULLABLE | `'Automated recurring billing engine'` |
| `category` | VARCHAR(50) | Product domain category | CHECK IN ('PLATFORM', 'ANALYTICS', 'INTEGRATION', 'SUPPORT', 'SECURITY') | `'PLATFORM'` |
| `is_active` | INTEGER | Availability flag | NOT NULL, DEFAULT 1, CHECK IN (0, 1) | `1` |
| `created_at` | TIMESTAMP | Creation timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2025-11-01 00:00:00'` |
| `updated_at` | TIMESTAMP | Modification timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2025-11-01 00:00:00'` |

---

## 4. Table: `product_variants`
Editions, packaging tiers, and SKU offerings for products.

| Column Name | Data Type | Purpose | Constraints | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INTEGER | Variant surrogate identifier | PRIMARY KEY AUTOINCREMENT | `3` |
| `product_id` | INTEGER | Associated parent product | NOT NULL, FK -> products(id) ON DELETE RESTRICT | `1` |
| `sku` | VARCHAR(50) | Unique Stock Keeping Unit | NOT NULL, UNIQUE | `'SKU-CORE-ENT-A'` |
| `variant_name` | VARCHAR(100) | Commercial SKU title | NOT NULL | `'Core Enterprise Annual Tier'`|
| `tier` | VARCHAR(30) | Service tier classification | CHECK IN ('STARTER', 'GROWTH', 'PRO', 'ENTERPRISE') | `'ENTERPRISE'` |
| `base_price` | DECIMAL(12, 2)| Baseline listing price | NOT NULL, CHECK (base_price >= 0.00)| `120000.00` |
| `billing_frequency`| VARCHAR(20)| Standard billing period | CHECK IN ('MONTHLY', 'QUARTERLY', 'ANNUAL') | `'ANNUAL'` |
| `is_active` | INTEGER | Variant availability flag | NOT NULL, DEFAULT 1, CHECK IN (0, 1) | `1` |
| `created_at` | TIMESTAMP | Creation timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2025-11-01 00:00:00'` |
| `updated_at` | TIMESTAMP | Modification timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2025-11-01 00:00:00'` |

---

## 5. Table: `subscription_plans`
Packaged subscription pricing schedules.

| Column Name | Data Type | Purpose | Constraints | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INTEGER | Plan surrogate identifier | PRIMARY KEY AUTOINCREMENT | `5` |
| `plan_code` | VARCHAR(50) | Plan natural code | NOT NULL, UNIQUE | `'PLAN-ENT-ANNUAL'` |
| `name` | VARCHAR(100) | Marketing plan name | NOT NULL | `'Enterprise Annual All-Access'`|
| `description` | TEXT | Plan scope & features | NULLABLE | `'Full platform and AI suite'` |
| `billing_cycle`| VARCHAR(20) | Contract renewal cadence | CHECK IN ('MONTHLY', 'QUARTERLY', 'ANNUAL') | `'ANNUAL'` |
| `billing_period_days`| INTEGER | Duration of cycle in days | NOT NULL, CHECK (billing_period_days > 0) | `365` |
| `plan_price` | DECIMAL(12, 2)| Standard cycle contract price | NOT NULL, CHECK (plan_price >= 0.00)| `120000.00` |
| `currency` | VARCHAR(3) | ISO-4217 currency | NOT NULL, DEFAULT 'INR', LENGTH=3 | `'INR'` |
| `is_active` | INTEGER | Catalog availability flag | NOT NULL, DEFAULT 1, CHECK IN (0, 1) | `1` |
| `created_at` | TIMESTAMP | Creation timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2025-11-01 00:00:00'` |
| `updated_at` | TIMESTAMP | Modification timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2025-11-01 00:00:00'` |

---

## 6. Table: `discounts`
Promotional codes and enterprise pricing concessions.

| Column Name | Data Type | Purpose | Constraints | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INTEGER | Discount identifier | PRIMARY KEY AUTOINCREMENT | `1` |
| `discount_code`| VARCHAR(50) | Coupon code identifier | NOT NULL, UNIQUE | `'EARLYBIRD20'` |
| `name` | VARCHAR(100) | Policy / promotion title | NOT NULL | `'Early Bird 20% Discount'` |
| `discount_type`| VARCHAR(20) | Discount calculation type | CHECK IN ('PERCENTAGE', 'FIXED_AMOUNT') | `'PERCENTAGE'` |
| `value` | DECIMAL(12, 2)| Rate (%) or flat amount (₹) | NOT NULL, CHECK (value >= 0.00) | `20.00` |
| `min_subtotal` | DECIMAL(12, 2)| Minimum order subtotal | NOT NULL, DEFAULT 0.00, CHECK >= 0.00 | `20000.00` |
| `max_discount_amount`| DECIMAL(12, 2)| Ceiling cap on percentage off| NULLABLE | `10000.00` |
| `valid_from` | DATE | Activation start date | NOT NULL | `'2026-05-01'` |
| `valid_until` | DATE | Expiry cutoff date | NOT NULL, CHECK (valid_until >= valid_from) | `'2027-05-01'` |
| `is_active` | INTEGER | Policy status flag | NOT NULL, DEFAULT 1, CHECK IN (0, 1) | `1` |
| `created_at` | TIMESTAMP | Creation timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2026-05-01 00:00:00'` |
| `updated_at` | TIMESTAMP | Modification timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2026-05-01 00:00:00'` |

---

## 7. Table: `quotations`
Pre-sales proposals issued to accounts.

| Column Name | Data Type | Purpose | Constraints | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INTEGER | Quotation identifier | PRIMARY KEY AUTOINCREMENT | `1` |
| `quotation_number`| VARCHAR(50) | Natural quote reference | NOT NULL, UNIQUE | `'QT-2026-001'` |
| `customer_id` | INTEGER | Intended client account | NOT NULL, FK -> customers(id) ON DELETE RESTRICT | `1` |
| `issue_date` | DATE | Date proposal was generated | NOT NULL | `'2025-10-20'` |
| `valid_until` | DATE | Proposal expiration deadline | NOT NULL, CHECK (valid_until >= issue_date) | `'2025-11-20'` |
| `subtotal` | DECIMAL(12, 2)| Gross item sum before discounts| NOT NULL, DEFAULT 0.00, CHECK >= 0.00 | `101694.92` |
| `discount_amount`| DECIMAL(12, 2)| Total discount deduction | NOT NULL, DEFAULT 0.00, CHECK (discount_amount <= subtotal) | `0.00` |
| `tax_amount` | DECIMAL(12, 2)| Total calculated GST/tax | NOT NULL, DEFAULT 0.00, CHECK >= 0.00 | `18305.08` |
| `total_amount` | DECIMAL(12, 2)| Net payable quote sum | CHECK (total_amount = subtotal - discount_amount + tax_amount) | `120000.00` |
| `currency` | VARCHAR(3) | Proposal currency | NOT NULL, DEFAULT 'INR', LENGTH=3 | `'INR'` |
| `status` | VARCHAR(20) | Proposal pipeline status | CHECK IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED') | `'ACCEPTED'` |
| `notes` | TEXT | Commercial terms / notes | NULLABLE | `'Annual Enterprise Quote'` |
| `created_by` | INTEGER | Sales representative | FK -> users(id) ON DELETE SET NULL | `5` |
| `created_at` | TIMESTAMP | Creation timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2025-10-20 10:00:00'` |
| `updated_at` | TIMESTAMP | Modification timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2025-10-25 12:00:00'` |

---

## 8. Table: `quotation_items`
Individual product line items within a quotation.

| Column Name | Data Type | Purpose | Constraints | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INTEGER | Line item identifier | PRIMARY KEY AUTOINCREMENT | `1` |
| `quotation_id` | INTEGER | Parent proposal | NOT NULL, FK -> quotations(id) ON DELETE CASCADE | `1` |
| `product_id` | INTEGER | Catalog product | NOT NULL, FK -> products(id) ON DELETE RESTRICT | `1` |
| `variant_id` | INTEGER | Specific product SKU | NULLABLE, FK -> product_variants(id) | `3` |
| `description` | VARCHAR(255)| Line item description | NULLABLE | `'Core Enterprise License'` |
| `quantity` | INTEGER | Number of licenses / seats | NOT NULL, DEFAULT 1, CHECK (quantity > 0) | `1` |
| `unit_price` | DECIMAL(12, 2)| Unit price before discount | NOT NULL, CHECK (unit_price >= 0.00) | `101694.92` |
| `discount_amount`| DECIMAL(12, 2)| Line item discount | NOT NULL, DEFAULT 0.00, CHECK <= (quantity * unit_price) | `0.00` |
| `tax_rate` | DECIMAL(5, 2)| GST / Tax percentage rate | NOT NULL, DEFAULT 18.00, CHECK (0.00 - 100.00) | `18.00` |
| `tax_amount` | DECIMAL(12, 2)| Line item tax component | NOT NULL, DEFAULT 0.00, CHECK >= 0.00 | `18305.08` |
| `line_total` | DECIMAL(12, 2)| Final item amount | NOT NULL, CHECK (line_total >= 0.00) | `120000.00` |
| `created_at` | TIMESTAMP | Creation timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2025-10-20 10:00:00'` |

---

## 9. Table: `subscriptions`
Recurring service contracts and automated renewal lifecycle states.

| Column Name | Data Type | Purpose | Constraints | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INTEGER | Subscription identifier | PRIMARY KEY AUTOINCREMENT | `1` |
| `subscription_code`| VARCHAR(50)| Natural contract code | NOT NULL, UNIQUE | `'SUB-2026-001'` |
| `customer_id` | INTEGER | Subscribing account | NOT NULL, FK -> customers(id) ON DELETE RESTRICT | `1` |
| `plan_id` | INTEGER | Packaged pricing tier | NOT NULL, FK -> subscription_plans(id) | `5` |
| `start_date` | DATE | Original subscription start | NOT NULL | `'2025-11-05'` |
| `current_period_start`| DATE | Start of active billing cycle | NOT NULL | `'2025-11-05'` |
| `current_period_end`| DATE | End of active billing cycle | NOT NULL, CHECK (current_period_end >= current_period_start) | `'2026-11-05'` |
| `next_billing_date`| DATE | Date for next invoice trigger | NOT NULL | `'2026-11-05'` |
| `end_date` | DATE | Final expiration (if non-renewing)| NULLABLE | `NULL` |
| `cancellation_date`| DATE | Date customer cancelled | NULLABLE | `NULL` |
| `renewal_count`| INTEGER | Number of times renewed | NOT NULL, DEFAULT 0, CHECK (renewal_count >= 0) | `0` |
| `recurring_amount`| DECIMAL(12, 2)| Value billed per renewal cycle | NOT NULL, CHECK (recurring_amount >= 0.00) | `120000.00` |
| `currency` | VARCHAR(3) | Contract billing currency | NOT NULL, DEFAULT 'INR', LENGTH=3 | `'INR'` |
| `status` | VARCHAR(20) | Active state machine status | CHECK IN ('TRIALING', 'ACTIVE', 'PAUSED', 'PAST_DUE', 'CANCELLED', 'CLOSED') | `'ACTIVE'` |
| `auto_renew` | INTEGER | Auto-renewal enabled (1=True)| NOT NULL, DEFAULT 1, CHECK IN (0, 1) | `1` |
| `created_at` | TIMESTAMP | Creation timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2025-11-05 00:00:00'` |
| `updated_at` | TIMESTAMP | Modification timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2026-10-26 00:00:00'` |

---

## 10. Table: `subscription_items`
Component items, add-on modules, and seat allocations in a subscription.

| Column Name | Data Type | Purpose | Constraints | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INTEGER | Subscription item identifier | PRIMARY KEY AUTOINCREMENT | `1` |
| `subscription_id`| INTEGER | Parent subscription | NOT NULL, FK -> subscriptions(id) ON DELETE CASCADE | `1` |
| `product_id` | INTEGER | Catalog product module | NOT NULL, FK -> products(id) ON DELETE RESTRICT | `1` |
| `variant_id` | INTEGER | Selected SKU | NULLABLE, FK -> product_variants(id) | `3` |
| `quantity` | INTEGER | Provisioned quantity/seats | NOT NULL, DEFAULT 1, CHECK (quantity > 0) | `1` |
| `unit_price` | DECIMAL(12, 2)| Base recurring unit price | NOT NULL, CHECK (unit_price >= 0.00) | `101694.92` |
| `created_at` | TIMESTAMP | Creation timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2025-11-05 00:00:00'` |

---

## 11. Table: `invoices`
Formal accounting billing statements demanding cash settlement.

| Column Name | Data Type | Purpose | Constraints | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INTEGER | Invoice surrogate identifier | PRIMARY KEY AUTOINCREMENT | `3` |
| `invoice_number`| VARCHAR(50) | Official billing number | NOT NULL, UNIQUE | `'INV-1042'` |
| `customer_id` | INTEGER | Billed client account | NOT NULL, FK -> customers(id) ON DELETE RESTRICT | `2` |
| `subscription_id`| INTEGER | Associated contract (if any) | NULLABLE, FK -> subscriptions(id) ON DELETE SET NULL | `2` |
| `quotation_id` | INTEGER | Converted quote (if any) | NULLABLE, FK -> quotations(id) ON DELETE SET NULL | `NULL` |
| `billing_period_start`| DATE | Start date of billed coverage | NOT NULL | `'2026-09-19'` |
| `billing_period_end`| DATE | End date of billed coverage | NOT NULL, CHECK (billing_period_end >= billing_period_start) | `'2026-10-19'` |
| `issue_date` | DATE | Date invoice was published | NOT NULL | `'2026-09-19'` |
| `due_date` | DATE | Payment deadline date | NOT NULL, CHECK (due_date >= issue_date) | `'2026-10-19'` |
| `subtotal` | DECIMAL(12, 2)| Gross amount before discounts | NOT NULL, CHECK (subtotal >= 0.00) | `40677.97` |
| `discount_amount`| DECIMAL(12, 2)| Deducted discount concessions | NOT NULL, DEFAULT 0.00, CHECK (discount_amount <= subtotal) | `0.00` |
| `tax_amount` | DECIMAL(12, 2)| Total GST / Tax applied | NOT NULL, DEFAULT 0.00, CHECK (tax_amount >= 0.00) | `7322.03` |
| `total_amount` | DECIMAL(12, 2)| Total invoice demand | CHECK (total_amount = subtotal - discount_amount + tax_amount) | `48000.00` |
| `amount_paid` | DECIMAL(12, 2)| Settled cash from payments | NOT NULL, DEFAULT 0.00, CHECK (amount_paid <= total_amount) | `0.00` |
| `outstanding_amount`| DECIMAL(12, 2)| Unsettled balance due | CHECK (outstanding_amount = total_amount - amount_paid) | `48000.00` |
| `currency` | VARCHAR(3) | Currency denomination | NOT NULL, DEFAULT 'INR', LENGTH=3 | `'INR'` |
| `status` | VARCHAR(20) | Accounting settlement status | CHECK IN ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED') | `'OVERDUE'` |
| `notes` | TEXT | Payment instructions / notes | NULLABLE | `'High-value invoice overdue'` |
| `created_at` | TIMESTAMP | Creation timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2026-09-19 10:00:00'` |
| `updated_at` | TIMESTAMP | Modification timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2026-10-19 12:00:00'` |

---

## 12. Table: `invoice_items`
Billed line items detailing products, quantities, tax rates, and line totals.

| Column Name | Data Type | Purpose | Constraints | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INTEGER | Line item identifier | PRIMARY KEY AUTOINCREMENT | `3` |
| `invoice_id` | INTEGER | Parent invoice | NOT NULL, FK -> invoices(id) ON DELETE CASCADE | `3` |
| `product_id` | INTEGER | Catalog product | NOT NULL, FK -> products(id) ON DELETE RESTRICT | `1` |
| `variant_id` | INTEGER | Specific SKU | NULLABLE, FK -> product_variants(id) | `2` |
| `description` | VARCHAR(255)| Invoice line description | NOT NULL | `'Core Professional Package'` |
| `quantity` | INTEGER | Billed quantity | NOT NULL, DEFAULT 1, CHECK (quantity > 0) | `1` |
| `unit_price` | DECIMAL(12, 2)| Billed unit rate | NOT NULL, CHECK (unit_price >= 0.00) | `40677.97` |
| `discount_amount`| DECIMAL(12, 2)| Line item discount | NOT NULL, DEFAULT 0.00, CHECK <= (quantity * unit_price) | `0.00` |
| `tax_rate` | DECIMAL(5, 2)| Applied GST rate (%) | NOT NULL, DEFAULT 18.00, CHECK (0.00 - 100.00) | `18.00` |
| `tax_amount` | DECIMAL(12, 2)| Calculated GST amount | NOT NULL, DEFAULT 0.00, CHECK (tax_amount >= 0.00) | `7322.03` |
| `line_total` | DECIMAL(12, 2)| Line item gross total | NOT NULL, CHECK (line_total >= 0.00) | `48000.00` |
| `created_at` | TIMESTAMP | Creation timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2026-09-19 10:00:00'` |

---

## 13. Table: `payments`
Cash collection transactions recorded against invoices.

| Column Name | Data Type | Purpose | Constraints | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INTEGER | Payment surrogate identifier | PRIMARY KEY AUTOINCREMENT | `1` |
| `payment_reference`| VARCHAR(100)| Unique transaction receipt | NOT NULL, UNIQUE | `'PAY-2026-001'` |
| `invoice_id` | INTEGER | Settle target invoice | NOT NULL, FK -> invoices(id) ON DELETE RESTRICT | `1` |
| `customer_id` | INTEGER | Paying client account | NOT NULL, FK -> customers(id) ON DELETE RESTRICT | `1` |
| `payment_date`| TIMESTAMP | Date & time funds received | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2025-11-30 11:22:33'` |
| `payment_method`| VARCHAR(30) | Payment channel | CHECK IN ('BANK_TRANSFER', 'CREDIT_CARD', 'UPI', 'ACH', 'STRIPE', 'RAZORPAY') | `'BANK_TRANSFER'` |
| `amount` | DECIMAL(12, 2)| Settled cash amount | NOT NULL, CHECK (amount > 0.00) | `120000.00` |
| `currency` | VARCHAR(3) | Settlement currency | NOT NULL, DEFAULT 'INR', LENGTH=3 | `'INR'` |
| `status` | VARCHAR(20) | Transaction settlement status | CHECK IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') | `'COMPLETED'` |
| `transaction_id`| VARCHAR(100)| Gateway / Bank reference ID | NULLABLE | `'TXN_TECH_9921'` |
| `notes` | TEXT | Remittance details / memo | NULLABLE | `'Annual Enterprise wire payment'` |
| `created_at` | TIMESTAMP | Record creation timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2025-11-30 11:22:33'` |
| `updated_at` | TIMESTAMP | Last update timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2025-11-30 11:22:33'` |



---

## 14. Table: `action_records`
Persistent intelligence action center items and churn defense alerts.

| Column Name | Data Type | Purpose | Constraints | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INTEGER | Surrogate primary identifier | PRIMARY KEY AUTOINCREMENT | `1` |
| `action_id` | VARCHAR(100) | Unique human/business action code | NOT NULL, UNIQUE, INDEXED | `'ACT-001'` |
| `action_type` | VARCHAR(50) | Risk category classification | NOT NULL, DEFAULT 'PAYMENT_RISK' | `'PAYMENT_RISK'` |
| `title` | VARCHAR(255) | Brief summary title of risk event | NOT NULL | `'Overdue Invoice: INV-1042'` |
| `description` | TEXT | Detailed reasoning / context | NULLABLE | `'12 days past due date'` |
| `priority` | VARCHAR(20) | Triage urgency level | CHECK IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW') | `'CRITICAL'` |
| `risk_score` | INTEGER | Algorithmic risk score (0-100) | CHECK (risk_score >= 0 AND <= 100) | `92` |
| `status` | VARCHAR(20) | Operational lifecycle state | CHECK IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'SNOOZED') | `'OPEN'` |
| `customer_id` | INTEGER | Subscribing account user | NULLABLE, FK -> users(id) | `2` |
| `customer_name` | VARCHAR(255) | Denormalized company name | NULLABLE | `'BrightTech Enterprise'` |
| `invoice_id` | INTEGER | Associated overdue invoice | NULLABLE, FK -> invoices(id) | `3` |
| `subscription_id`| INTEGER | Associated recurring subscription| NULLABLE, FK -> subscriptions(id) | `2` |
| `related_entity_type` | VARCHAR(50)| Type of entity involved | NULLABLE | `'invoice'` |
| `related_entity_id` | VARCHAR(100)| Natural key of related entity | NULLABLE | `'INV-1042'` |
| `recommended_action` | TEXT | Suggested mitigation playbook | NULLABLE | `'Execute Smart Dunning Sequence'`|
| `potential_revenue_impact` | DECIMAL(12,2) | Total monetary exposure at risk | NOT NULL, DEFAULT 0.00, CHECK >= 0.00 | `48000.00` |
| `created_at` | TIMESTAMP | Record creation timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2026-10-31 09:00:00'` |
| `updated_at` | TIMESTAMP | Last update timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2026-10-31 09:00:00'` |
| `resolved_at` | TIMESTAMP | Timestamp of resolution | NULLABLE | `NULL` |
| `resolved_by` | INTEGER | User who resolved or executed | NULLABLE, FK -> users(id) | `1` |
| `resolution_notes` | TEXT | Resolution audit commentary | NULLABLE | `'Customer paid via bank wire'` |
| `snoozed_until` | TIMESTAMP | Active snooze expiration deadline | NULLABLE, INDEXED | `'2026-11-03 00:00:00'` |
| `snoozed_at` | TIMESTAMP | Timestamp when snooze initiated | NULLABLE | `'2026-10-31 10:15:00'` |
| `snoozed_by` | INTEGER | User who snoozed the action | NULLABLE, FK -> users(id) | `1` |
| `snooze_reason` | TEXT | Justification for snooze window | NULLABLE | `'Waiting on client board review'` |

---

## 15. Table: `recovery_execution_logs`
Persistent audit log of executed mitigation playbooks and financial recovery outcomes.

| Column Name | Data Type | Purpose | Constraints | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INTEGER | Surrogate primary identifier | PRIMARY KEY AUTOINCREMENT | `1` |
| `execution_id` | VARCHAR(100) | Unique execution audit reference | NOT NULL, UNIQUE, INDEXED | `'EXEC-2026-001'` |
| `action_id` | INTEGER | Parent risk action record | NOT NULL, FK -> action_records(id) | `1` |
| `plan_type` | VARCHAR(100) | Mitigation playbook executed | NOT NULL | `'DUNNING_NOTICE'` |
| `execution_status`| VARCHAR(20) | Execution dispatch status | CHECK IN ('SUCCESS', 'PENDING', 'FAILED') | `'SUCCESS'` |
| `executed_by` | INTEGER | User or system agent executor | NULLABLE, FK -> users(id) | `1` |
| `executed_at` | TIMESTAMP | Execution timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2026-10-31 10:30:00'` |
| `financial_amount` | DECIMAL(12,2) | Base financial exposure involved | NOT NULL, DEFAULT 0.00, CHECK >= 0.00 | `48000.00` |
| `projected_recovery` | DECIMAL(12,2) | Modeled expected recovery amount | NOT NULL, DEFAULT 0.00, CHECK >= 0.00 | `45600.00` |
| `actual_recovered_amount` | DECIMAL(12,2) | Actual settled cash recovered | NOT NULL, DEFAULT 0.00, CHECK >= 0.00 | `48000.00` |
| `channel` | VARCHAR(100) | Communication rail used | NULLABLE, DEFAULT 'OMNICHANNEL' | `'OMNICHANNEL'` |
| `notes` | TEXT | Execution notes / dispatch detail | NULLABLE | `'Dispatched via Email & WhatsApp'` |
| `signals` | TEXT | JSON string of detected signals | NULLABLE | `'[\"Overdue > 12 days\"]'` |
| `created_at` | TIMESTAMP | Record creation timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | `'2026-10-31 10:30:00'` |
