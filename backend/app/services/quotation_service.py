import json
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.database.models import Quotation, QuotationStatus, User, UserRole, Plan, Product
from app.schemas.quotation_schema import QuotationCreate, QuotationUpdate, QuotationItem

class QuotationService:
    @staticmethod
    def calculate_totals(items: List[QuotationItem], discount: float, tax_rate: float):
        subtotal = sum(item.quantity * item.unit_price for item in items)
        subtotal = round(subtotal, 2)
        
        discount_val = min(discount, subtotal)
        after_discount = subtotal - discount_val
        tax_val = round(after_discount * tax_rate, 2)
        total = round(after_discount + tax_val, 2)
        return subtotal, discount_val, tax_val, total

    @staticmethod
    def get_quotations(db: Session, current_user: User, status_filter: Optional[QuotationStatus] = None) -> List[Quotation]:
        query = db.query(Quotation)
        # Prevent customers from accessing another customer's data
        if current_user.role == UserRole.CUSTOMER:
            query = query.filter(Quotation.customer_id == current_user.id)
        if status_filter:
            query = query.filter(Quotation.status == status_filter)
        return query.all()

    @staticmethod
    def get_quotation_by_id(db: Session, quotation_id: int, current_user: User) -> Quotation:
        quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
        if not quotation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found")
        # Customer isolation
        if current_user.role == UserRole.CUSTOMER and quotation.customer_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access to this quotation is forbidden")
        return quotation

    @staticmethod
    def create_quotation(db: Session, quote_in: QuotationCreate, current_user: User) -> Quotation:
        # Validate customer
        customer = db.query(User).filter(User.id == quote_in.customer_id).first()
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target customer does not exist")

        # If current user is customer, they can only create for themselves
        if current_user.role == UserRole.CUSTOMER and quote_in.customer_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot create quotation for another customer")

        # Validate plan if provided
        if quote_in.plan_id:
            plan = db.query(Plan).filter(Plan.id == quote_in.plan_id).first()
            if not plan:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specified plan does not exist")

        # Validate items and products
        if not quote_in.items:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quotation must contain at least one item")

        for item in quote_in.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product {item.product_id} not found")

        # Calculate backend-authoritative totals
        subtotal, discount_val, tax_val, total = QuotationService.calculate_totals(
            quote_in.items, quote_in.discount, quote_in.tax_rate
        )

        items_json = json.dumps([item.model_dump() for item in quote_in.items])

        new_quote = Quotation(
            customer_id=quote_in.customer_id,
            plan_id=quote_in.plan_id,
            items=items_json,
            subtotal=subtotal,
            discount=discount_val,
            tax=tax_val,
            total=total,
            valid_until=quote_in.valid_until,
            status=QuotationStatus.DRAFT
        )
        db.add(new_quote)
        db.commit()
        db.refresh(new_quote)
        return new_quote

    @staticmethod
    def update_quotation(db: Session, quotation_id: int, quote_in: QuotationUpdate, current_user: User) -> Quotation:
        quote = QuotationService.get_quotation_by_id(db, quotation_id, current_user)
        
        # Customers can only view, staff/admin can modify or customer can accept
        if current_user.role == UserRole.CUSTOMER:
            if quote_in.status == QuotationStatus.ACCEPTED and quote.status == QuotationStatus.SENT:
                quote.status = QuotationStatus.ACCEPTED
                db.commit()
                db.refresh(quote)
                return quote
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customers cannot arbitrarily modify quotations")

        if quote_in.status:
            quote.status = quote_in.status

        if quote_in.valid_until:
            quote.valid_until = quote_in.valid_until

        if quote_in.items:
            items_to_calc = quote_in.items
            disc_to_calc = quote_in.discount if quote_in.discount is not None else quote.discount
            tax_rate_to_calc = quote_in.tax_rate if quote_in.tax_rate is not None else 0.18
            subtotal, discount_val, tax_val, total = QuotationService.calculate_totals(
                items_to_calc, disc_to_calc, tax_rate_to_calc
            )
            quote.subtotal = subtotal
            quote.discount = discount_val
            quote.tax = tax_val
            quote.total = total
            quote.items = json.dumps([item.model_dump() for item in items_to_calc])

        db.commit()
        db.refresh(quote)
        return quote
