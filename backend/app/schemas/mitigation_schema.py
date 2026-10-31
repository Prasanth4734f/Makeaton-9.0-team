from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class RiskMetrics(BaseModel):
    risk_score: int
    risk_level: str

class ChurnMetrics(BaseModel):
    probability: int
    level: str

class FinancialImpact(BaseModel):
    potential_revenue_impact: float
    projected_recovery: float
    projected_revenue_protected: float

class MitigationPlanDetails(BaseModel):
    plan_type: str
    recommended_action: str
    reason: str
    priority: str
    confidence: float

class MitigationPlanResponse(BaseModel):
    action_id: str
    status: str
    risk: RiskMetrics
    churn: ChurnMetrics
    signals: List[str] = Field(default_factory=list)
    financial_impact: FinancialImpact
    mitigation_plan: MitigationPlanDetails
    requires_human_approval: bool = True

class MitigationExecuteRequest(BaseModel):
    note: Optional[str] = None
    override_parameters: Optional[Dict[str, Any]] = None

class MitigationExecuteResponse(BaseModel):
    action_id: str
    status: str
    execution_status: str
    plan_type: str
    action_taken: str
    executed_at: str
    executed_by: str
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)

class ActionResolveRequest(BaseModel):
    resolution_note: Optional[str] = "Resolved by authorized operator."

class ActionResolveResponse(BaseModel):
    action_id: str
    status: str
    resolved_at: str
    resolved_by: str
    message: str

class ActionSnoozeRequest(BaseModel):
    duration_days: int = 7
    reason: Optional[str] = "Snoozed for follow-up review."

class ActionSnoozeResponse(BaseModel):
    action_id: str
    status: str
    snoozed_until: str
    snoozed_by: str
    message: str

class RecoveryMetricsResponse(BaseModel):
    total_revenue_recovered: float
    revenue_protected: float
    mitigation_success_rate: float
    active_recovery_actions: int
    total_actions_evaluated: int
    resolved_actions_count: int
    snoozed_actions_count: int

