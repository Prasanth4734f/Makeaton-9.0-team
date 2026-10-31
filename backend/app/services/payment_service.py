from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.database.models import Payment, PaymentStatus, Invoice, InvoiceStatus, User, UserRole
from app.schemas.payment_schema import PaymentCreate

class PaymentService:
    @staticmethod
    def get_payments(db: Session, current_user: User, invoice_id: Optional[int] = None) -> List[Payment]:
        query = db.query(Payment)
        if invoice_id:
            query = query.filter(Payment.invoice_id == invoice_id)

        if current_user.role == UserRole.CUSTOMER:
            # Join invoice to filter by customer_id
            query = query.join(Invoice).filter(Invoice.customer_id == current_user.id)

        return query.all()

    @staticmethod
    def get_payment_by_id(db: Session, payment_id: int, current_user: User) -> Payment:
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found")

        invoice = db.query(Invoice).filter(Invoice.id == payment.invoice_id).first()
        if current_user.role == UserRole.CUSTOMER and invoice.customer_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access to this payment is forbidden")

        return payment

    @staticmethod
    def record_payment(db: Session, payment_in: PaymentCreate, current_user: User) -> Payment:
        # Atomic transaction to keep payment and invoice updates consistent
        if payment_in.amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment amount must be greater than zero"
            )

        invoice = db.query(Invoice).filter(Invoice.id == payment_in.invoice_id).with_for_update().first()
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

        if invoice.status == InvoiceStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot record payment against a cancelled invoice"
            )

        if invoice.status == InvoiceStatus.PAID or invoice.outstanding_amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invoice is already fully paid"
            )

        # Prevent payments from exceeding the remaining balance
        # Rounding comparison to avoid floating precision discrepancies
        rounded_amount = round(payment_in.amount, 2)
        if rounded_amount > round(invoice.outstanding_amount, 2):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment amount ({rounded_amount}) exceeds outstanding invoice balance ({round(invoice.outstanding_amount, 2)})"
            )

        # Create payment record
        payment = Payment(
            invoice_id=invoice.id,
            payment_method=payment_in.payment_method,
            amount=rounded_amount,
            notes=payment_in.notes,
            status=PaymentStatus.SUCCESS,
            payment_date=datetime.utcnow()
        )
        db.add(payment)

        # Update invoice amounts
        invoice.paid_amount = round(invoice.paid_amount + rounded_amount, 2)
        invoice.outstanding_amount = round(invoice.total - invoice.paid_amount, 2)

        # Update invoice status
        if invoice.outstanding_amount <= 0.001:
            invoice.outstanding_amount = 0.0
            invoice.status = InvoiceStatus.PAID
        else:
            now = datetime.utcnow()
            if invoice.due_date < now:
                invoice.status = InvoiceStatus.OVERDUE
            else:
                invoice.status = InvoiceStatus.OUTSTANDING

        db.commit()
        db.refresh(payment)
        return payment
