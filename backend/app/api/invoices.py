import json
from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.dependencies import get_current_user, require_staff_or_admin
from app.database.models import User, InvoiceStatus
from app.schemas.invoice_schema import InvoiceCreate, InvoiceUpdate, InvoiceResponse
from app.services.invoice_service import InvoiceService

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])

def _format_invoice_resp(inv):
    return {
        "id": inv.id,
        "invoice_number": inv.invoice_number,
        "customer_id": inv.customer_id,
        "subscription_id": inv.subscription_id,
        "billing_period_start": inv.billing_period_start,
        "billing_period_end": inv.billing_period_end,
        "items": json.loads(inv.items) if inv.items else [],
        "subtotal": inv.subtotal,
        "discount": inv.discount,
        "tax": inv.tax,
        "total": inv.total,
        "paid_amount": inv.paid_amount,
        "outstanding_amount": inv.outstanding_amount,
        "issue_date": inv.issue_date,
        "due_date": inv.due_date,
        "status": inv.status,
        "created_at": inv.created_at,
        "updated_at": inv.updated_at
    }

@router.get("")
def list_invoices(
    status: Optional[InvoiceStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoices = InvoiceService.get_invoices(db, current_user, status_filter=status)
    return {
        "success": True,
        "data": [_format_invoice_resp(i) for i in invoices]
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    inv = InvoiceService.create_invoice(db, invoice_in)
    return {
        "success": True,
        "data": _format_invoice_resp(inv)
    }

@router.get("/{invoice_id}")
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = InvoiceService.get_invoice_by_id(db, invoice_id, current_user)
    return {
        "success": True,
        "data": _format_invoice_resp(inv)
    }

@router.put("/{invoice_id}")
def update_invoice(
    invoice_id: int,
    invoice_in: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    inv = InvoiceService.update_invoice(db, invoice_id, invoice_in, current_user)
    return {
        "success": True,
        "data": _format_invoice_resp(inv)
    }

@router.post("/{invoice_id}/confirm")
def confirm_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    inv = InvoiceService.confirm_invoice(db, invoice_id, current_user)
    return {
        "success": True,
        "data": _format_invoice_resp(inv)
    }

@router.post("/{invoice_id}/send")
def send_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    inv = InvoiceService.send_invoice(db, invoice_id, current_user)
    return {
        "success": True,
        "data": _format_invoice_resp(inv)
    }

@router.post("/{invoice_id}/cancel")
def cancel_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    inv = InvoiceService.cancel_invoice(db, invoice_id, current_user)
    return {
        "success": True,
        "data": _format_invoice_resp(inv)
    }
