# REVORA Database Migrations

This directory stores ordered database migration scripts for REVORA schema versioning.

## Migration Convention
- Format: `NNN_description.sql` (e.g. `001_initial_schema.sql`, `002_add_audit_log.sql`)
- Each migration must be idempotent (`CREATE TABLE IF NOT EXISTS`, etc.) or include roll-forward safeguards.
- Sai's Python backend can use **Alembic** or a lightweight Python migration runner to apply migrations sequentially.

## Current Migrations
- `001_initial_schema.sql`: Baseline table definitions and relationship constraints for all 13 core tables.

