from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.dependencies import get_current_user, require_staff_or_admin
from app.database.models import User, ProductStatus
from app.schemas.product_schema import ProductCreate, ProductUpdate, ProductResponse
from app.services.product_service import ProductService

router = APIRouter(prefix="/api/products", tags=["Products"])

@router.get("")
def list_products(
    status: Optional[ProductStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    products = ProductService.get_products(db, status_filter=status)
    return {
        "success": True,
        "data": [ProductResponse.model_validate(p).model_dump() for p in products]
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    product = ProductService.create_product(db, product_in)
    return {
        "success": True,
        "data": ProductResponse.model_validate(product).model_dump()
    }

@router.get("/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = ProductService.get_product_by_id(db, product_id)
    return {
        "success": True,
        "data": ProductResponse.model_validate(product).model_dump()
    }

@router.put("/{product_id}")
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    product = ProductService.update_product(db, product_id, product_in)
    return {
        "success": True,
        "data": ProductResponse.model_validate(product).model_dump()
    }

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    result = ProductService.delete_product(db, product_id)
    return {
        "success": True,
        "data": result
    }
