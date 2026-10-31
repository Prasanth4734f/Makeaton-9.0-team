import json
from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.dependencies import get_current_user
from app.database.models import User, QuotationStatus
from app.schemas.quotation_schema import QuotationCreate, QuotationUpdate, QuotationResponse
from app.services.quotation_service import QuotationService

router = APIRouter(prefix="/api/quotations", tags=["Quotations"])

def _format_quote_resp(quote):
    return {
        "id": quote.id,
        "customer_id": quote.customer_id,
        "plan_id": quote.plan_id,
        "items": json.loads(quote.items) if quote.items else [],
        "subtotal": quote.subtotal,
        "discount": quote.discount,
        "tax": quote.tax,
        "total": quote.total,
        "valid_until": quote.valid_until,
        "status": quote.status,
        "created_at": quote.created_at,
        "updated_at": quote.updated_at
    }

@router.get("")
def list_quotations(
    status: Optional[QuotationStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quotes = QuotationService.get_quotations(db, current_user, status_filter=status)
    return {
        "success": True,
        "data": [_format_quote_resp(q) for q in quotes]
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_quotation(
    quote_in: QuotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quote = QuotationService.create_quotation(db, quote_in, current_user)
    return {
        "success": True,
        "data": _format_quote_resp(quote)
    }

@router.get("/{quotation_id}")
def get_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quote = QuotationService.get_quotation_by_id(db, quotation_id, current_user)
    return {
        "success": True,
        "data": _format_quote_resp(quote)
    }

@router.put("/{quotation_id}")
def update_quotation(
    quotation_id: int,
    quote_in: QuotationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quote = QuotationService.update_quotation(db, quotation_id, quote_in, current_user)
    return {
        "success": True,
        "data": _format_quote_resp(quote)
    }
