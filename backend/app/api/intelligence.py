from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.dependencies import require_staff_or_admin
from app.database.models import User
from app.services.intelligence_service import IntelligenceAdapter

router = APIRouter(prefix="/api/intelligence", tags=["Intelligence"])

@router.get("/actions")
def get_intelligence_actions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    actions = IntelligenceAdapter.get_actionable_insights(db)
    return {
        "success": True,
        "data": {
            "actions": actions
        }
    }

