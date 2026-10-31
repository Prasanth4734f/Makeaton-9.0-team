from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator
from app.database.models import BillingFrequency, PlanStatus

class PlanCreate(BaseModel):
    name: str
    billing_frequency: BillingFrequency
    price: float = Field(ge=0.0)
    minimum_quantity: int = Field(default=1, ge=1)
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    status: PlanStatus = PlanStatus.ACTIVE

    @model_validator(mode="after")
    def validate_dates(self):
        if self.available_from and self.available_until:
            if self.available_from >= self.available_until:
                raise ValueError("available_until must be strictly after available_from")
        return self

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    billing_frequency: Optional[BillingFrequency] = None
    price: Optional[float] = Field(default=None, ge=0.0)
    minimum_quantity: Optional[int] = Field(default=None, ge=1)
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    status: Optional[PlanStatus] = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.available_from and self.available_until:
            if self.available_from >= self.available_until:
                raise ValueError("available_until must be strictly after available_from")
        return self

class PlanResponse(BaseModel):
    id: int
    name: str
    billing_frequency: BillingFrequency
    price: float
    minimum_quantity: int
    available_from: Optional[datetime]
    available_until: Optional[datetime]
    status: PlanStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

