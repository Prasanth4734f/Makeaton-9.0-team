from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.database.models import Plan, PlanStatus, Subscription
from app.schemas.plan_schema import PlanCreate, PlanUpdate

class PlanService:
    @staticmethod
    def get_plans(db: Session, status_filter: Optional[PlanStatus] = None) -> List[Plan]:
        query = db.query(Plan)
        if status_filter:
            query = query.filter(Plan.status == status_filter)
        return query.all()

    @staticmethod
    def get_plan_by_id(db: Session, plan_id: int) -> Plan:
        plan = db.query(Plan).filter(Plan.id == plan_id).first()
        if not plan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription plan not found")
        return plan

    @staticmethod
    def create_plan(db: Session, plan_in: PlanCreate) -> Plan:
        new_plan = Plan(
            name=plan_in.name,
            billing_frequency=plan_in.billing_frequency,
            price=plan_in.price,
            minimum_quantity=plan_in.minimum_quantity,
            available_from=plan_in.available_from,
            available_until=plan_in.available_until,
            status=plan_in.status
        )
        db.add(new_plan)
        db.commit()
        db.refresh(new_plan)
        return new_plan

    @staticmethod
    def update_plan(db: Session, plan_id: int, plan_in: PlanUpdate) -> Plan:
        plan = PlanService.get_plan_by_id(db, plan_id)
        update_data = plan_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(plan, key, value)
        db.commit()
        db.refresh(plan)
        return plan

    @staticmethod
    def delete_plan(db: Session, plan_id: int) -> dict:
        plan = PlanService.get_plan_by_id(db, plan_id)
        # Check if plan is associated with any subscriptions
        sub_count = db.query(Subscription).filter(Subscription.plan_id == plan_id).count()
        if sub_count > 0:
            # Cannot hard delete if active records rely on it; soft delete/archive safely
            plan.status = PlanStatus.ARCHIVED
            db.commit()
            return {"message": f"Plan {plan_id} archived because it has {sub_count} associated subscription(s)"}
        
        # Safe archive
        plan.status = PlanStatus.ARCHIVED
        db.commit()
        return {"message": f"Plan {plan_id} archived successfully"}
