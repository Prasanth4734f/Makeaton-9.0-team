from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.dependencies import get_current_user, require_staff_or_admin
from app.database.models import User
from app.schemas.payment_schema import PaymentCreate, PaymentResponse
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/api/payments", tags=["Payments"])

@router.get("")
def list_payments(
    invoice_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payments = PaymentService.get_payments(db, current_user, invoice_id=invoice_id)
    return {
        "success": True,
        "data": [PaymentResponse.model_validate(p).model_dump() for p in payments]
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def record_payment(
    payment_in: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    payment = PaymentService.record_payment(db, payment_in, current_user)
    return {
        "success": True,
        "data": PaymentResponse.model_validate(payment).model_dump()
    }

@router.get("/{payment_id}")
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment = PaymentService.get_payment_by_id(db, payment_id, current_user)
    return {
        "success": True,
        "data": PaymentResponse.model_validate(payment).model_dump()
    }
