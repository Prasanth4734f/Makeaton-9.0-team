"""Overdue and outstanding payment detector component.

Identifies unpaid, outstanding, and overdue invoices, calculating
exact overdue days and financial exposure.
"""

from datetime import date
from typing import Any, Dict, List, Optional, Union

from intelligence_engine.adapters.data_adapter import (
    normalize_invoice,
    parse_date,
)
from intelligence_engine.schemas.intelligence_schema import InvoiceRecord


class OverdueDetector:
    """Analyzes invoices to detect overdue balances and revenue at risk."""

    EXCLUDED_STATUSES = {"CANCELLED", "VOID"}

    @classmethod
    def detect(
        cls,
        invoices: List[Union[Dict[str, Any], InvoiceRecord]],
        reference_date: Optional[Union[str, date]] = None,
    ) -> List[Dict[str, Any]]:
        """Detect outstanding and overdue invoices.

        Args:
            invoices: List of invoice dicts or records.
            reference_date: Context date for comparison (default: today).

        Returns:
            List of detected overdue invoice evaluation dicts.
        """
        ref_dt = parse_date(reference_date) or date.today()
        results: List[Dict[str, Any]] = []

        for item in invoices:
            inv = item if isinstance(item, InvoiceRecord) else normalize_invoice(item)

            if inv.status.upper() in cls.EXCLUDED_STATUSES:
                continue

            outstanding = float(inv.outstanding_amount)
            if outstanding <= 0.0:
                continue

            due_dt = parse_date(inv.due_date)
            is_overdue = False
            days_overdue = 0

            if due_dt:
                delta = (ref_dt - due_dt).days
                if delta > 0:
                    is_overdue = True
                    days_overdue = delta
            else:
                # If no due date is provided, check if issue date + 30 days passed
                issue_dt = parse_date(inv.issue_date)
                if issue_dt:
                    default_due_days = (ref_dt - issue_dt).days - 30
                    if default_due_days > 0:
                        is_overdue = True
                        days_overdue = default_due_days

            results.append(
                {
                    "invoice_id": inv.invoice_id,
                    "invoice_number": inv.invoice_number,
                    "subscription_id": inv.subscription_id,
                    "customer_id": inv.customer_id,
                    "customer_name": inv.customer_name,
                    "total_amount": inv.total_amount,
                    "paid_amount": inv.paid_amount,
                    "outstanding_amount": outstanding,
                    "due_date": inv.due_date,
                    "is_overdue": is_overdue,
                    "days_overdue": days_overdue,
                    "status": "OVERDUE" if is_overdue else inv.status,
                }
            )

        return results


def detect_overdue_invoices(
    invoices: List[Union[Dict[str, Any], InvoiceRecord]],
    reference_date: Optional[Union[str, date]] = None,
) -> List[Dict[str, Any]]:
    """Functional convenience wrapper for OverdueDetector.detect."""
    return OverdueDetector.detect(invoices, reference_date)
