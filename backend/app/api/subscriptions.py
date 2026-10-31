from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.dependencies import get_current_user
from app.database.models import User, SubscriptionStatus
from app.schemas.subscription_schema import (
    SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse
)
from app.services.subscription_service import SubscriptionService

router = APIRouter(prefix="/api/subscriptions", tags=["Subscriptions"])

@router.get("")
def list_subscriptions(
    status: Optional[SubscriptionStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subs = SubscriptionService.get_subscriptions(db, current_user, status_filter=status)
    return {
        "success": True,
        "data": [SubscriptionResponse.model_validate(s).model_dump() for s in subs]
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_subscription(
    sub_in: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = SubscriptionService.create_subscription(db, sub_in, current_user)
    return {
        "success": True,
        "data": SubscriptionResponse.model_validate(sub).model_dump()
    }

@router.get("/{subscription_id}")
def get_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = SubscriptionService.get_subscription_by_id(db, subscription_id, current_user)
    return {
        "success": True,
        "data": SubscriptionResponse.model_validate(sub).model_dump()
    }

@router.put("/{subscription_id}")
def update_subscription(
    subscription_id: int,
    sub_in: SubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = SubscriptionService.update_subscription(db, subscription_id, sub_in, current_user)
    return {
        "success": True,
        "data": SubscriptionResponse.model_validate(sub).model_dump()
    }

@router.post("/{subscription_id}/activate")
def activate_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = SubscriptionService.activate_subscription(db, subscription_id, current_user)
    return {
        "success": True,
        "data": SubscriptionResponse.model_validate(sub).model_dump()
    }

@router.post("/{subscription_id}/pause")
def pause_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = SubscriptionService.pause_subscription(db, subscription_id, current_user)
    return {
        "success": True,
        "data": SubscriptionResponse.model_validate(sub).model_dump()
    }

@router.post("/{subscription_id}/resume")
def resume_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = SubscriptionService.resume_subscription(db, subscription_id, current_user)
    return {
        "success": True,
        "data": SubscriptionResponse.model_validate(sub).model_dump()
    }

@router.post("/{subscription_id}/renew")
def renew_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = SubscriptionService.renew_subscription(db, subscription_id, current_user)
    return {
        "success": True,
        "data": SubscriptionResponse.model_validate(sub).model_dump()
    }

@router.post("/{subscription_id}/close")
def close_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = SubscriptionService.close_subscription(db, subscription_id, current_user)
    return {
        "success": True,
        "data": SubscriptionResponse.model_validate(sub).model_dump()
    }
