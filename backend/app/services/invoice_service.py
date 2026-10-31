import json
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.database.models import Invoice, InvoiceStatus, User, UserRole, Subscription
from app.schemas.invoice_schema import InvoiceCreate, InvoiceUpdate

class InvoiceService:
    @staticmethod
    def generate_invoice_number() -> str:
        unique_suffix = uuid.uuid4().hex[:6].upper()
        now_str = datetime.utcnow().strftime("%Y%m%d")
        return f"INV-{now_str}-{unique_suffix}"

    @staticmethod
    def check_and_update_overdue(invoice: Invoice) -> Invoice:
        now = datetime.utcnow()
        if invoice.status in [InvoiceStatus.OUTSTANDING, InvoiceStatus.SENT, InvoiceStatus.CONFIRMED]:
            if invoice.due_date < now and invoice.outstanding_amount > 0:
                invoice.status = InvoiceStatus.OVERDUE
        return invoice

    @staticmethod
    def get_invoices(db: Session, current_user: User, status_filter: Optional[InvoiceStatus] = None) -> List[Invoice]:
        query = db.query(Invoice)
        if current_user.role == UserRole.CUSTOMER:
            query = query.filter(Invoice.customer_id == current_user.id)
        if status_filter:
            query = query.filter(Invoice.status == status_filter)
        
        invoices = query.all()
        # Automatically update overdue statuses
        for inv in invoices:
            InvoiceService.check_and_update_overdue(inv)
        db.commit()
        return invoices

    @staticmethod
    def get_invoice_by_id(db: Session, invoice_id: int, current_user: User) -> Invoice:
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
        if current_user.role == UserRole.CUSTOMER and invoice.customer_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access to this invoice is forbidden")

        InvoiceService.check_and_update_overdue(invoice)
        db.commit()
        return invoice

    @staticmethod
    def create_invoice(db: Session, invoice_in: InvoiceCreate) -> Invoice:
        customer = db.query(User).filter(User.id == invoice_in.customer_id).first()
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target customer does not exist")

        if invoice_in.subscription_id:
            sub = db.query(Subscription).filter(Subscription.id == invoice_in.subscription_id).first()
            if not sub:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specified subscription does not exist")
            
            # Check duplicate invoice for billing period
            if invoice_in.billing_period_start:
                existing = db.query(Invoice).filter(
                    Invoice.subscription_id == invoice_in.subscription_id,
                    Invoice.billing_period_start == invoice_in.billing_period_start
                ).first()
                if existing:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="An invoice already exists for this subscription and billing period"
                    )

        if not invoice_in.items:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invoice must contain at least one item")

        subtotal = round(sum(item.quantity * item.unit_price for item in invoice_in.items), 2)
        discount_val = min(invoice_in.discount, subtotal)
        after_discount = subtotal - discount_val
        tax_val = round(after_discount * invoice_in.tax_rate, 2)
        total = round(after_discount + tax_val, 2)

        inv = Invoice(
            invoice_number=InvoiceService.generate_invoice_number(),
            customer_id=invoice_in.customer_id,
            subscription_id=invoice_in.subscription_id,
            billing_period_start=invoice_in.billing_period_start,
            billing_period_end=invoice_in.billing_period_end,
            items=json.dumps([item.model_dump() for item in invoice_in.items]),
            subtotal=subtotal,
            discount=discount_val,
            tax=tax_val,
            total=total,
            paid_amount=0.0,
            outstanding_amount=total,
            issue_date=datetime.utcnow(),
            due_date=invoice_in.due_date,
            status=InvoiceStatus.DRAFT
        )
        db.add(inv)
        db.commit()
        db.refresh(inv)
        return inv

    @staticmethod
    def update_invoice(db: Session, invoice_id: int, invoice_in: InvoiceUpdate, current_user: User) -> Invoice:
        invoice = InvoiceService.get_invoice_by_id(db, invoice_id, current_user)
        if invoice.status == InvoiceStatus.CANCELLED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot update a cancelled invoice")

        if invoice_in.due_date:
            invoice.due_date = invoice_in.due_date
        if invoice_in.status:
            invoice.status = invoice_in.status

        db.commit()
        db.refresh(invoice)
        return invoice

    @staticmethod
    def confirm_invoice(db: Session, invoice_id: int, current_user: User) -> Invoice:
        invoice = InvoiceService.get_invoice_by_id(db, invoice_id, current_user)
        if invoice.status != InvoiceStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only DRAFT invoices can be confirmed, current status is {invoice.status}"
            )
        invoice.status = InvoiceStatus.CONFIRMED
        db.commit()
        db.refresh(invoice)
        return invoice

    @staticmethod
    def send_invoice(db: Session, invoice_id: int, current_user: User) -> Invoice:
        invoice = InvoiceService.get_invoice_by_id(db, invoice_id, current_user)
        if invoice.status not in [InvoiceStatus.DRAFT, InvoiceStatus.CONFIRMED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot send invoice with status {invoice.status}"
            )
        invoice.status = InvoiceStatus.SENT
        db.commit()
        db.refresh(invoice)
        return invoice

    @staticmethod
    def cancel_invoice(db: Session, invoice_id: int, current_user: User) -> Invoice:
        invoice = InvoiceService.get_invoice_by_id(db, invoice_id, current_user)
        if invoice.status == InvoiceStatus.PAID:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel a fully paid invoice"
            )
        if invoice.paid_amount > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel an invoice with recorded payments. Refund or adjust payments first."
            )
        invoice.status = InvoiceStatus.CANCELLED
        db.commit()
        db.refresh(invoice)
        return invoice
