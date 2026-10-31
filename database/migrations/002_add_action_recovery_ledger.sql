-- ============================================================================
-- Migration: 002_add_action_recovery_ledger.sql
-- Description: Persistent Action Record & Recovery Execution Ledger for
--              Autonomous Revenue Recovery & Churn Defense Agent
-- Engineer: Krishna (Database & Persistence Engineer)
-- Dialect: ANSI SQL / SQLite 3 / PostgreSQL Compatible
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ACTION_RECORDS
-- Persistent store for intelligence action center items and lifecycle states
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS action_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id VARCHAR(100) NOT NULL UNIQUE,
    action_type VARCHAR(50) NOT NULL DEFAULT 'PAYMENT_RISK',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'HIGH' CHECK (priority IN (
        'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    )),
    risk_score INTEGER NOT NULL DEFAULT 50 CHECK (risk_score >= 0 AND risk_score <= 100),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN (
        'OPEN', 'IN_PROGRESS', 'RESOLVED', 'SNOOZED'
    )),
    
    -- Entity references
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
    
    -- Reference metadata
    related_entity_type VARCHAR(50),
    related_entity_id VARCHAR(100),
    recommended_action TEXT,
    
    -- Financial Impact
    potential_revenue_impact DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (potential_revenue_impact >= 0.00),
    
    -- Audit & Lifecycle Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    
    -- Snooze Persistence
    snoozed_until TIMESTAMP,
    snoozed_at TIMESTAMP,
    snoozed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    snooze_reason TEXT
);

-- ----------------------------------------------------------------------------
-- 2. RECOVERY_EXECUTION_LOGS
-- Persistent audit log of all human-confirmed or autonomous mitigations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recovery_execution_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    execution_id VARCHAR(100) NOT NULL UNIQUE,
    action_id INTEGER NOT NULL REFERENCES action_records(id) ON DELETE CASCADE,
    plan_type VARCHAR(100) NOT NULL,
    execution_status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' CHECK (execution_status IN (
        'SUCCESS', 'PENDING', 'FAILED'
    )),
    executed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Financial Outcome Tracking (Clear separation)
    financial_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (financial_amount >= 0.00),
    projected_recovery DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (projected_recovery >= 0.00),
    actual_recovered_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (actual_recovered_amount >= 0.00),
    
    channel VARCHAR(100) DEFAULT 'OMNICHANNEL',
    notes TEXT,
    signals TEXT, -- JSON string of detected signals
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. INDEXES FOR HIGH-THROUGHPUT AGENT QUERIES & SNOOZE RESOLUTION
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_action_records_code ON action_records(action_id);
CREATE INDEX IF NOT EXISTS idx_action_records_status ON action_records(status);
CREATE INDEX IF NOT EXISTS idx_action_records_priority ON action_records(priority);
CREATE INDEX IF NOT EXISTS idx_action_records_snooze ON action_records(snoozed_until);
CREATE INDEX IF NOT EXISTS idx_action_records_customer ON action_records(customer_id);

CREATE INDEX IF NOT EXISTS idx_recovery_logs_exec_id ON recovery_execution_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_recovery_logs_action ON recovery_execution_logs(action_id);
CREATE INDEX IF NOT EXISTS idx_recovery_logs_status ON recovery_execution_logs(execution_status);
CREATE INDEX IF NOT EXISTS idx_recovery_logs_date ON recovery_execution_logs(executed_at);

