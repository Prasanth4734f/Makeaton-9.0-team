from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from app.database.models import QuotationStatus

class QuotationItem(BaseModel):
    product_id: int
    product_name: str
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0.0)

class QuotationCreate(BaseModel):
    customer_id: int
    plan_id: Optional[int] = None
    items: List[QuotationItem]
    discount: float = Field(default=0.0, ge=0.0)
    tax_rate: float = Field(default=0.18, ge=0.0) # default 18% GST/tax
    valid_until: Optional[datetime] = None

class QuotationUpdate(BaseModel):
    items: Optional[List[QuotationItem]] = None
    discount: Optional[float] = Field(default=None, ge=0.0)
    tax_rate: Optional[float] = Field(default=None, ge=0.0)
    valid_until: Optional[datetime] = None
    status: Optional[QuotationStatus] = None

class QuotationResponse(BaseModel):
    id: int
    customer_id: int
    plan_id: Optional[int]
    items: List[Any]
    subtotal: float
    discount: float
    tax: float
    total: float
    valid_until: Optional[datetime]
    status: QuotationStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

