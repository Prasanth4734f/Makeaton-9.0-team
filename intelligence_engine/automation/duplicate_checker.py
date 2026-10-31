"""Duplicate billing checker.

Prevents duplicate invoice generation for the same subscription
and billing period.
"""

from typing import Any, Dict, List, Optional, Union

from intelligence_engine.adapters.data_adapter import normalize_date


class DuplicateChecker:
    """Verifies that no active or confirmed invoice already exists for the cycle."""

    # Invoices in these statuses represent active or finalized billing
    VALID_INVOICE_STATUSES = {"DRAFT", "CONFIRMED", "SENT", "PAID", "OVERDUE"}

    @classmethod
    def check_duplicate(
        cls,
        subscription_id: str,
        billing_period_start: Optional[Union[str, Any]] = None,
        billing_period_end: Optional[Union[str, Any]] = None,
        existing_invoices: Optional[List[Union[Dict[str, Any], Any]]] = None,
    ) -> Dict[str, Any]:
        """Check whether a valid invoice already exists for the subscription and period.

        Args:
            subscription_id: Unique subscription ID.
            billing_period_start: Target billing cycle start date (YYYY-MM-DD).
            billing_period_end: Target billing cycle end date (YYYY-MM-DD).
            existing_invoices: List of all existing invoice dicts or records.

        Returns:
            Dict containing is_duplicate, existing_invoice_id, and reason.
        """
        if not existing_invoices:
            return {
                "is_duplicate": False,
                "existing_invoice_id": None,
                "reason": "No valid invoice exists for the current billing period",
            }

        norm_start = normalize_date(billing_period_start)
        norm_end = normalize_date(billing_period_end)

        for inv in existing_invoices:
            inv_sub_id = (
                inv.get("subscription_id")
                if isinstance(inv, dict)
                else getattr(inv, "subscription_id", None)
            )
            if not inv_sub_id or str(inv_sub_id) != str(subscription_id):
                continue

            inv_status = (
                inv.get("status")
                if isinstance(inv, dict)
                else getattr(inv, "status", "CONFIRMED")
            )
            inv_status_upper = str(inv_status).strip().upper()

            # Ignore cancelled or voided invoices
            if inv_status_upper not in cls.VALID_INVOICE_STATUSES:
                continue

            inv_start = normalize_date(
                inv.get("billing_period_start")
                if isinstance(inv, dict)
                else getattr(inv, "billing_period_start", None)
            )
            inv_end = normalize_date(
                inv.get("billing_period_end")
                if isinstance(inv, dict)
                else getattr(inv, "billing_period_end", None)
            )
            inv_issue = normalize_date(
                inv.get("issue_date")
                if isinstance(inv, dict)
                else getattr(inv, "issue_date", None)
            )
            inv_id = (
                inv.get("invoice_id") or inv.get("id")
                if isinstance(inv, dict)
                else getattr(inv, "invoice_id", getattr(inv, "id", "UNKNOWN"))
            )

            # Match criteria 1: Same start and end period
            if norm_start and norm_end and inv_start == norm_start and inv_end == norm_end:
                return {
                    "is_duplicate": True,
                    "existing_invoice_id": str(inv_id),
                    "reason": f"Invoice {inv_id} already exists for period {norm_start} to {norm_end} (Status: {inv_status_upper})",
                }

            # Match criteria 2: Same start period (if end date omitted)
            if norm_start and inv_start == norm_start:
                return {
                    "is_duplicate": True,
                    "existing_invoice_id": str(inv_id),
                    "reason": f"Invoice {inv_id} already exists starting {norm_start} (Status: {inv_status_upper})",
                }

            # Match criteria 3: Target billing date matches invoice issue date
            if norm_start and inv_issue == norm_start:
                return {
                    "is_duplicate": True,
                    "existing_invoice_id": str(inv_id),
                    "reason": f"Invoice {inv_id} already issued on date {norm_start} (Status: {inv_status_upper})",
                }

        return {
            "is_duplicate": False,
            "existing_invoice_id": None,
            "reason": "No valid invoice exists for the current billing period",
        }


def check_duplicate_billing(
    subscription_id: str,
    billing_period_start: Optional[Union[str, Any]] = None,
    billing_period_end: Optional[Union[str, Any]] = None,
    existing_invoices: Optional[List[Union[Dict[str, Any], Any]]] = None,
) -> Dict[str, Any]:
    """Functional convenience wrapper for DuplicateChecker.check_duplicate."""
    return DuplicateChecker.check_duplicate(
        subscription_id=subscription_id,
        billing_period_start=billing_period_start,
        billing_period_end=billing_period_end,
        existing_invoices=existing_invoices,
    )
