from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.dependencies import get_current_user, require_staff_or_admin
from app.database.models import User, PlanStatus
from app.schemas.plan_schema import PlanCreate, PlanUpdate, PlanResponse
from app.services.plan_service import PlanService

router = APIRouter(prefix="/api/plans", tags=["Subscription Plans"])

@router.get("")
def list_plans(
    status: Optional[PlanStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plans = PlanService.get_plans(db, status_filter=status)
    return {
        "success": True,
        "data": [PlanResponse.model_validate(p).model_dump() for p in plans]
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_plan(
    plan_in: PlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    plan = PlanService.create_plan(db, plan_in)
    return {
        "success": True,
        "data": PlanResponse.model_validate(plan).model_dump()
    }

@router.get("/{plan_id}")
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan = PlanService.get_plan_by_id(db, plan_id)
    return {
        "success": True,
        "data": PlanResponse.model_validate(plan).model_dump()
    }

@router.put("/{plan_id}")
def update_plan(
    plan_id: int,
    plan_in: PlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    plan = PlanService.update_plan(db, plan_id, plan_in)
    return {
        "success": True,
        "data": PlanResponse.model_validate(plan).model_dump()
    }

@router.delete("/{plan_id}")
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    result = PlanService.delete_plan(db, plan_id)
    return {
        "success": True,
        "data": result
    }
