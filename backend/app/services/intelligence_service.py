from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database.models import Invoice, InvoiceStatus, Subscription, SubscriptionStatus

class IntelligenceAdapter:
    """
    Adapter interface to consume output from Prasanth's Revenue Intelligence Engine.
    If external service/module is not yet plugged in, provides standard deterministic
    heuristics based on actual invoice and subscription state.
    """
    @staticmethod
    def get_actionable_insights(db: Session) -> List[Dict[str, Any]]:
        actions = []
        now = datetime.utcnow()

        # 1. Identify High-Value Overdue Invoices
        overdue_invoices = db.query(Invoice).filter(
            Invoice.status.in_([InvoiceStatus.OVERDUE, InvoiceStatus.OUTSTANDING]),
            Invoice.due_date < now
        ).order_by(Invoice.outstanding_amount.desc()).all()

        action_idx = 1
        for inv in overdue_invoices:
            days_overdue = (now - inv.due_date).days
            score = min(100, 50 + days_overdue * 2 + int(inv.outstanding_amount / 500))
            priority = "CRITICAL" if (days_overdue > 7 or inv.outstanding_amount > 5000) else "HIGH"

            actions.append({
                "id": f"ACT-{action_idx:03d}",
                "priority": priority,
                "score": score,
                "title": f"High-value payment overdue: {inv.invoice_number}",
                "reason": f"Invoice overdue for {days_overdue} days with outstanding balance ₹{inv.outstanding_amount}",
                "recommended_action": "Follow up immediately with customer to secure payment",
                "related_entity_type": "invoice",
                "related_entity_id": inv.invoice_number
            })
            action_idx += 1

        # 2. Identify Stale Paused Subscriptions (Churn risk)
        paused_subs = db.query(Subscription).filter(
            Subscription.status == SubscriptionStatus.PAUSED
        ).all()

        for sub in paused_subs:
            actions.append({
                "id": f"ACT-{action_idx:03d}",
                "priority": "MEDIUM",
                "score": 65,
                "title": f"Subscription #{sub.id} paused - Churn risk",
                "reason": f"Subscription #{sub.id} is currently paused",
                "recommended_action": "Engage customer with retention offer or plan review",
                "related_entity_type": "subscription",
                "related_entity_id": str(sub.id)
            })
            action_idx += 1

        return actions

