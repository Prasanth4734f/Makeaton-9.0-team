import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.database.models import Subscription, SubscriptionStatus, Invoice, InvoiceStatus
from app.services.invoice_service import InvoiceService
from app.services.subscription_service import SubscriptionService

class BillingEngineAdapter:
    """
    Adapter interface connecting with Prasanth's Billing Automation Engine.
    Handles duplicate prevention, eligibility checks, and billing execution.
    """
    @staticmethod
    def identify_due_subscriptions(db: Session) -> List[Subscription]:
        """Find active subscriptions whose next_billing_date is today or in the past."""
        now = datetime.utcnow()
        return db.query(Subscription).filter(
            Subscription.status == SubscriptionStatus.ACTIVE,
            Subscription.next_billing_date <= now
        ).all()

    @staticmethod
    def bill_subscription_period(db: Session, subscription_id: int) -> Invoice:
        """
        Safely generate a single recurring invoice for the due billing period.
        Guarantees idempotency and duplicate prevention.
        """
        # Fetch subscription with write lock
        sub = db.query(Subscription).filter(Subscription.id == subscription_id).with_for_update().first()
        if not sub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")

        if sub.status != SubscriptionStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Subscription is not eligible for billing. Current status: {sub.status}"
            )

        now = datetime.utcnow()
        billing_start = sub.current_period_start or now
        billing_end = sub.current_period_end or SubscriptionService.calculate_period_end(billing_start, sub.billing_frequency)

        # Duplicate check against existing invoice for this period
        existing_invoice = db.query(Invoice).filter(
            Invoice.subscription_id == sub.id,
            Invoice.billing_period_start == billing_start
        ).first()

        if existing_invoice:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Invoice already generated for subscription {sub.id} and period starting {billing_start.isoformat()}"
            )

        items = [
            {
                "description": f"Subscription #{sub.id} - Plan #{sub.plan_id} ({sub.billing_frequency.value})",
                "quantity": sub.quantity,
                "unit_price": round(sub.price / sub.quantity, 2)
            }
        ]

        subtotal = round(sub.price, 2)
        tax = round(subtotal * 0.18, 2) # Standard GST
        total = round(subtotal + tax, 2)
        due_date = now + timedelta(days=7) # Net-7 payment terms

        # Create Invoice
        invoice = Invoice(
            invoice_number=InvoiceService.generate_invoice_number(),
            customer_id=sub.customer_id,
            subscription_id=sub.id,
            billing_period_start=billing_start,
            billing_period_end=billing_end,
            items=json.dumps(items),
            subtotal=subtotal,
            discount=0.0,
            tax=tax,
            total=total,
            paid_amount=0.0,
            outstanding_amount=total,
            issue_date=now,
            due_date=due_date,
            status=InvoiceStatus.CONFIRMED
        )
        db.add(invoice)

        # Advance subscription period to next cycle
        next_start = billing_end
        next_end = SubscriptionService.calculate_period_end(next_start, sub.billing_frequency)
        sub.current_period_start = next_start
        sub.current_period_end = next_end
        sub.next_billing_date = next_end

        db.commit()
        db.refresh(invoice)
        db.refresh(sub)
        return invoice
