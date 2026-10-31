from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.database.models import Subscription, SubscriptionStatus, BillingFrequency, Plan, User, UserRole
from app.schemas.subscription_schema import SubscriptionCreate, SubscriptionUpdate

class SubscriptionService:
    @staticmethod
    def calculate_period_end(start_date: datetime, frequency: BillingFrequency) -> datetime:
        if frequency == BillingFrequency.DAILY:
            return start_date + timedelta(days=1)
        elif frequency == BillingFrequency.WEEKLY:
            return start_date + timedelta(weeks=1)
        elif frequency == BillingFrequency.MONTHLY:
            return start_date + timedelta(days=30)
        elif frequency == BillingFrequency.YEARLY:
            return start_date + timedelta(days=365)
        return start_date + timedelta(days=30)

    @staticmethod
    def get_subscriptions(db: Session, current_user: User, status_filter: Optional[SubscriptionStatus] = None) -> List[Subscription]:
        query = db.query(Subscription)
        if current_user.role == UserRole.CUSTOMER:
            query = query.filter(Subscription.customer_id == current_user.id)
        if status_filter:
            query = query.filter(Subscription.status == status_filter)
        return query.all()

    @staticmethod
    def get_subscription_by_id(db: Session, subscription_id: int, current_user: User) -> Subscription:
        sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
        if not sub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
        if current_user.role == UserRole.CUSTOMER and sub.customer_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access to this subscription is forbidden")
        return sub

    @staticmethod
    def create_subscription(db: Session, sub_in: SubscriptionCreate, current_user: User) -> Subscription:
        # Check customer
        customer = db.query(User).filter(User.id == sub_in.customer_id).first()
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target customer does not exist")
        if current_user.role == UserRole.CUSTOMER and sub_in.customer_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot create subscription for another customer")

        plan = db.query(Plan).filter(Plan.id == sub_in.plan_id).first()
        if not plan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan does not exist")

        if sub_in.quantity < plan.minimum_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Minimum quantity required for this plan is {plan.minimum_quantity}"
            )

        new_sub = Subscription(
            customer_id=sub_in.customer_id,
            plan_id=sub_in.plan_id,
            quotation_id=sub_in.quotation_id,
            status=sub_in.status or SubscriptionStatus.DRAFT,
            billing_frequency=plan.billing_frequency,
            price=plan.price * sub_in.quantity,
            quantity=sub_in.quantity
        )
        db.add(new_sub)
        db.commit()
        db.refresh(new_sub)
        return new_sub

    @staticmethod
    def update_subscription(db: Session, subscription_id: int, sub_in: SubscriptionUpdate, current_user: User) -> Subscription:
        sub = SubscriptionService.get_subscription_by_id(db, subscription_id, current_user)
        if sub.status == SubscriptionStatus.CLOSED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot update a closed subscription")

        if sub_in.plan_id:
            plan = db.query(Plan).filter(Plan.id == sub_in.plan_id).first()
            if not plan:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan does not exist")
            sub.plan_id = plan.id
            sub.billing_frequency = plan.billing_frequency
            qty = sub_in.quantity if sub_in.quantity is not None else sub.quantity
            if qty < plan.minimum_quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Minimum quantity required for this plan is {plan.minimum_quantity}"
                )
            sub.price = plan.price * qty

        if sub_in.quantity is not None and not sub_in.plan_id:
            plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
            if sub_in.quantity < plan.minimum_quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Minimum quantity required for this plan is {plan.minimum_quantity}"
                )
            sub.quantity = sub_in.quantity
            sub.price = plan.price * sub_in.quantity

        db.commit()
        db.refresh(sub)
        return sub

    @staticmethod
    def activate_subscription(db: Session, subscription_id: int, current_user: User) -> Subscription:
        sub = SubscriptionService.get_subscription_by_id(db, subscription_id, current_user)
        if sub.status == SubscriptionStatus.ACTIVE:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subscription is already active")
        if sub.status == SubscriptionStatus.CLOSED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A closed subscription cannot be activated")

        # Allowed transitions to ACTIVE: DRAFT, QUOTATION, CONFIRMED
        if sub.status not in [SubscriptionStatus.DRAFT, SubscriptionStatus.QUOTATION, SubscriptionStatus.CONFIRMED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot activate subscription from status: {sub.status}. Use resume if paused."
            )

        now = datetime.utcnow()
        period_end = SubscriptionService.calculate_period_end(now, sub.billing_frequency)
        sub.status = SubscriptionStatus.ACTIVE
        sub.current_period_start = now
        sub.current_period_end = period_end
        sub.next_billing_date = period_end

        db.commit()
        db.refresh(sub)
        return sub

    @staticmethod
    def pause_subscription(db: Session, subscription_id: int, current_user: User) -> Subscription:
        sub = SubscriptionService.get_subscription_by_id(db, subscription_id, current_user)
        if sub.status == SubscriptionStatus.CLOSED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A closed subscription cannot be paused")
        if sub.status == SubscriptionStatus.PAUSED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subscription is already paused")
        if sub.status != SubscriptionStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only ACTIVE subscriptions can be paused, current status is {sub.status}"
            )

        sub.status = SubscriptionStatus.PAUSED
        db.commit()
        db.refresh(sub)
        return sub

    @staticmethod
    def resume_subscription(db: Session, subscription_id: int, current_user: User) -> Subscription:
        sub = SubscriptionService.get_subscription_by_id(db, subscription_id, current_user)
        if sub.status == SubscriptionStatus.CLOSED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A closed subscription cannot be resumed")
        if sub.status != SubscriptionStatus.PAUSED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only PAUSED subscriptions can be resumed, current status is {sub.status}"
            )

        now = datetime.utcnow()
        # If the period expired while paused, re-establish billing period from now
        if not sub.current_period_end or sub.current_period_end < now:
            period_end = SubscriptionService.calculate_period_end(now, sub.billing_frequency)
            sub.current_period_start = now
            sub.current_period_end = period_end
            sub.next_billing_date = period_end

        sub.status = SubscriptionStatus.ACTIVE
        db.commit()
        db.refresh(sub)
        return sub

    @staticmethod
    def renew_subscription(db: Session, subscription_id: int, current_user: User) -> Subscription:
        sub = SubscriptionService.get_subscription_by_id(db, subscription_id, current_user)
        if sub.status == SubscriptionStatus.CLOSED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A closed subscription cannot be renewed")
        if sub.status not in [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only ACTIVE or PAUSED subscriptions are eligible for renewal, current status is {sub.status}"
            )

        # Extend period from current_period_end or now
        now = datetime.utcnow()
        base_start = sub.current_period_end if (sub.current_period_end and sub.current_period_end > now) else now
        new_end = SubscriptionService.calculate_period_end(base_start, sub.billing_frequency)

        sub.status = SubscriptionStatus.ACTIVE
        sub.current_period_start = base_start
        sub.current_period_end = new_end
        sub.next_billing_date = new_end

        db.commit()
        db.refresh(sub)
        return sub

    @staticmethod
    def close_subscription(db: Session, subscription_id: int, current_user: User) -> Subscription:
        sub = SubscriptionService.get_subscription_by_id(db, subscription_id, current_user)
        if sub.status == SubscriptionStatus.CLOSED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subscription is already closed")

        sub.status = SubscriptionStatus.CLOSED
        db.commit()
        db.refresh(sub)
        return sub
