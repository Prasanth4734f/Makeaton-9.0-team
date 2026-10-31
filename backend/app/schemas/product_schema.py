from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.database.models import ProductType, ProductStatus

class ProductVariantBase(BaseModel):
    name: str
    additional_price: float = Field(ge=0.0, default=0.0)

class ProductVariantCreate(ProductVariantBase):
    pass

class ProductVariantResponse(ProductVariantBase):
    id: int
    product_id: int

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str
    product_type: ProductType = ProductType.SERVICE
    sales_price: float = Field(ge=0.0)
    cost_price: float = Field(ge=0.0)
    description: Optional[str] = None
    status: ProductStatus = ProductStatus.ACTIVE
    variants: Optional[List[ProductVariantCreate]] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    product_type: Optional[ProductType] = None
    sales_price: Optional[float] = Field(default=None, ge=0.0)
    cost_price: Optional[float] = Field(default=None, ge=0.0)
    description: Optional[str] = None
    status: Optional[ProductStatus] = None

class ProductResponse(BaseModel):
    id: int
    name: str
    product_type: ProductType
    sales_price: float
    cost_price: float
    description: Optional[str]
    status: ProductStatus
    created_at: datetime
    updated_at: datetime
    variants: List[ProductVariantResponse] = []

    class Config:
        from_attributes = True

