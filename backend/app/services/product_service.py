from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.database.models import Product, ProductVariant, ProductStatus
from app.schemas.product_schema import ProductCreate, ProductUpdate

class ProductService:
    @staticmethod
    def get_products(db: Session, status_filter: Optional[ProductStatus] = None) -> List[Product]:
        query = db.query(Product)
        if status_filter:
            query = query.filter(Product.status == status_filter)
        return query.all()

    @staticmethod
    def get_product_by_id(db: Session, product_id: int) -> Product:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return product

    @staticmethod
    def create_product(db: Session, product_in: ProductCreate) -> Product:
        new_product = Product(
            name=product_in.name,
            product_type=product_in.product_type,
            sales_price=product_in.sales_price,
            cost_price=product_in.cost_price,
            description=product_in.description,
            status=product_in.status
        )
        db.add(new_product)
        db.flush()

        if product_in.variants:
            for variant_data in product_in.variants:
                variant = ProductVariant(
                    product_id=new_product.id,
                    name=variant_data.name,
                    additional_price=variant_data.additional_price
                )
                db.add(variant)

        db.commit()
        db.refresh(new_product)
        return new_product

    @staticmethod
    def update_product(db: Session, product_id: int, product_in: ProductUpdate) -> Product:
        product = ProductService.get_product_by_id(db, product_id)
        update_data = product_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(product, key, value)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def delete_product(db: Session, product_id: int) -> dict:
        product = ProductService.get_product_by_id(db, product_id)
        # Safe deactivation to preserve financial historical records and subscription integrity
        product.status = ProductStatus.ARCHIVED
        db.commit()
        return {"message": f"Product {product_id} archived safely to preserve data integrity"}
