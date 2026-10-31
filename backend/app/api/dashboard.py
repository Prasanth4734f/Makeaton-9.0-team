from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.dependencies import require_staff_or_admin
from app.database.models import User
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    summary = DashboardService.get_summary(db)
    return {
        "success": True,
        "data": summary
    }

