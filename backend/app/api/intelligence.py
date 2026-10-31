from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.dependencies import require_staff_or_admin
from app.database.models import User
from app.services.intelligence_service import IntelligenceAdapter
from app.services.mitigation_service import MitigationService
from app.schemas.mitigation_schema import (
    MitigationPlanResponse,
    MitigationExecuteRequest,
    MitigationExecuteResponse,
    ActionResolveRequest,
    ActionResolveResponse,
    ActionSnoozeRequest,
    ActionSnoozeResponse,
    RecoveryMetricsResponse,
)

router = APIRouter(prefix="/api/intelligence", tags=["Intelligence"])

@router.get("/actions")
def get_intelligence_actions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    """
    Existing Action Center endpoint.
    Maintains 100% backward compatibility while using integrated intelligence.
    """
    actions = IntelligenceAdapter.get_actionable_insights(db)
    return {
        "success": True,
        "data": {
            "actions": actions
        }
    }

@router.get("/actions/{id}/mitigation-plan")
def get_mitigation_plan(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    """
    API 1: Retrieve structured mitigation plan for a specific risk action item.
    Invokes Prasanth's intelligence engine to generate deterministic recommendations.
    """
    plan = MitigationService.generate_mitigation_plan(db, id)
    return {
        "success": True,
        "data": plan
    }

@router.post("/actions/{id}/execute")
def execute_mitigation(
    id: str,
    request: MitigationExecuteRequest = MitigationExecuteRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    """
    API 2: Explicit human execution of mitigation strategy.
    Strictly requires authenticated operator trigger (no unconfirmed execution).
    """
    result = MitigationService.execute_mitigation(db, id, current_user, note=request.note)
    return {
        "success": True,
        "data": result
    }

@router.post("/actions/{id}/resolve")
def resolve_action(
    id: str,
    request: ActionResolveRequest = ActionResolveRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    """
    API 3: Mark an intelligence action as resolved.
    Records operator audit and transitions action state.
    """
    result = MitigationService.resolve_action(db, id, current_user, note=request.resolution_note)
    return {
        "success": True,
        "data": result
    }

@router.post("/actions/{id}/snooze")
def snooze_action(
    id: str,
    request: ActionSnoozeRequest = ActionSnoozeRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    """
    API 4: Temporarily snooze an action for a given duration.
    Persists snooze window and audit details.
    """
    result = MitigationService.snooze_action(
        db, id, current_user, duration_days=request.duration_days, reason=request.reason
    )
    return {
        "success": True,
        "data": result
    }

@router.get("/recovery-metrics")
def get_recovery_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    """
    API 5: Retrieve real aggregated metrics on revenue recovered, revenue protected,
    and mitigation success rate from the persistence layer.
    """
    metrics = MitigationService.get_recovery_metrics(db)
    return {
        "success": True,
        "data": metrics
    }
