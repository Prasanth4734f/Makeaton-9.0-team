from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.database.models import SubscriptionStatus, BillingFrequency

class SubscriptionCreate(BaseModel):
    customer_id: int
    plan_id: int
    quotation_id: Optional[int] = None
    quantity: int = Field(default=1, ge=1)
    status: Optional[SubscriptionStatus] = SubscriptionStatus.DRAFT

class SubscriptionUpdate(BaseModel):
    quantity: Optional[int] = Field(default=None, ge=1)
    plan_id: Optional[int] = None

class SubscriptionResponse(BaseModel):
    id: int
    customer_id: int
    plan_id: int
    quotation_id: Optional[int]
    status: SubscriptionStatus
    billing_frequency: BillingFrequency
    price: float
    quantity: int
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    next_billing_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

