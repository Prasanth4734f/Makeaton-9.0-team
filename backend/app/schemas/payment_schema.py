from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.database.models import PaymentStatus

class PaymentCreate(BaseModel):
    invoice_id: int
    payment_method: str = Field(description="e.g. CARD, BANK_TRANSFER, UPI, CASH")
    amount: float = Field(gt=0.0, description="Amount must be positive")
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    invoice_id: int
    payment_method: str
    amount: float
    payment_date: datetime
    notes: Optional[str]
    status: PaymentStatus
    created_at: datetime

    class Config:
        from_attributes = True

