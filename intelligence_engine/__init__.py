"""Revora Intelligence Engine.

Billing Automation & Revenue Intelligence Brain.
Built by Prasanth (Billing Automation & Revenue Intelligence Engineer).
"""

__version__ = "1.0.0"

from intelligence_engine.services.intelligence_service import (
    analyze_revenue,
    process_subscription_billing,
)

__all__ = ["analyze_revenue", "process_subscription_billing", "__version__"]
