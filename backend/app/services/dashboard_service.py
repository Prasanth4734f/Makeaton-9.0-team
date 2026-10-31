import json
from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.models import (
    Subscription, SubscriptionStatus, Invoice, InvoiceStatus, Payment, PaymentStatus
)

class DashboardService:
    @staticmethod
    def get_summary(db: Session) -> Dict[str, Any]:
        now = datetime.utcnow()

        # 1. Active subscriptions count
        active_subscriptions = db.query(Subscription).filter(
            Subscription.status == SubscriptionStatus.ACTIVE
        ).count()

        # 2. Total revenue (sum of successful payments)
        total_revenue_res = db.query(func.sum(Payment.amount)).filter(
            Payment.status == PaymentStatus.SUCCESS
        ).scalar()
        total_revenue = round(total_revenue_res or 0.0, 2)

        # 3. Invoices analysis
        invoices = db.query(Invoice).filter(Invoice.status != InvoiceStatus.CANCELLED).all()
        outstanding_amount = 0.0
        overdue_amount = 0.0
        overdue_invoice_count = 0

        for inv in invoices:
            # Check overdue dynamically
            if inv.outstanding_amount > 0:
                outstanding_amount += inv.outstanding_amount
                if inv.due_date < now or inv.status == InvoiceStatus.OVERDUE:
                    overdue_amount += inv.outstanding_amount
                    overdue_invoice_count += 1

        outstanding_amount = round(outstanding_amount, 2)
        overdue_amount = round(overdue_amount, 2)

        # 4. Recent invoices (last 5)
        recent_inv_records = db.query(Invoice).order_by(Invoice.created_at.desc()).limit(5).all()
        recent_invoices = [
            {
                "id": inv.id,
                "invoice_number": inv.invoice_number,
                "customer_id": inv.customer_id,
                "total": inv.total,
                "paid_amount": inv.paid_amount,
                "outstanding_amount": inv.outstanding_amount,
                "status": inv.status.value,
                "due_date": inv.due_date.isoformat() if inv.due_date else None,
                "issue_date": inv.issue_date.isoformat() if inv.issue_date else None
            }
            for inv in recent_inv_records
        ]

        # 5. Upcoming renewals (active subscriptions whose next_billing_date is within 30 days)
        thirty_days_later = now + timedelta(days=30)
        upcoming_subs = db.query(Subscription).filter(
            Subscription.status == SubscriptionStatus.ACTIVE,
            Subscription.next_billing_date >= now,
            Subscription.next_billing_date <= thirty_days_later
        ).order_by(Subscription.next_billing_date.asc()).limit(5).all()

        upcoming_renewals = [
            {
                "id": sub.id,
                "customer_id": sub.customer_id,
                "plan_id": sub.plan_id,
                "price": sub.price,
                "billing_frequency": sub.billing_frequency.value,
                "next_billing_date": sub.next_billing_date.isoformat() if sub.next_billing_date else None
            }
            for sub in upcoming_subs
        ]

        # 6. Recent payments (last 5)
        recent_pmt_records = db.query(Payment).order_by(Payment.payment_date.desc()).limit(5).all()
        recent_payments = [
            {
                "id": p.id,
                "invoice_id": p.invoice_id,
                "amount": p.amount,
                "payment_method": p.payment_method,
                "payment_date": p.payment_date.isoformat() if p.payment_date else None,
                "status": p.status.value
            }
            for p in recent_pmt_records
        ]

        return {
            "active_subscriptions": active_subscriptions,
            "total_revenue": total_revenue,
            "outstanding_amount": outstanding_amount,
            "overdue_amount": overdue_amount,
            "overdue_invoice_count": overdue_invoice_count,
            "recent_invoices": recent_invoices,
            "upcoming_renewals": upcoming_renewals,
            "recent_payments": recent_payments
        }

