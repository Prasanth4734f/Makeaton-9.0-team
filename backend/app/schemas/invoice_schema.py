from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from app.database.models import InvoiceStatus

class InvoiceItem(BaseModel):
    description: str
    quantity: int = Field(gt=0, default=1)
    unit_price: float = Field(ge=0.0)

class InvoiceCreate(BaseModel):
    customer_id: int
    subscription_id: Optional[int] = None
    billing_period_start: Optional[datetime] = None
    billing_period_end: Optional[datetime] = None
    items: List[InvoiceItem]
    discount: float = Field(default=0.0, ge=0.0)
    tax_rate: float = Field(default=0.18, ge=0.0)
    due_date: datetime

class InvoiceUpdate(BaseModel):
    due_date: Optional[datetime] = None
    status: Optional[InvoiceStatus] = None

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    customer_id: int
    subscription_id: Optional[int]
    billing_period_start: Optional[datetime]
    billing_period_end: Optional[datetime]
    items: List[Any]
    subtotal: float
    discount: float
    tax: float
    total: float
    paid_amount: float
    outstanding_amount: float
    issue_date: datetime
    due_date: datetime
    status: InvoiceStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

