"""Pydantic schemas and typed data models for Revora Intelligence Engine."""

from datetime import date
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SubscriptionStatus(str, Enum):
    DRAFT = "DRAFT"
    QUOTATION = "QUOTATION"
    CONFIRMED = "CONFIRMED"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    CLOSED = "CLOSED"
    EXPIRED = "EXPIRED"


class BillingFrequency(str, Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"


class BillingStatus(str, Enum):
    NOT_DUE = "NOT_DUE"
    DUE = "DUE"
    OVERDUE = "OVERDUE"
    READY_FOR_INVOICE = "READY_FOR_INVOICE"
    DUPLICATE_BLOCKED = "DUPLICATE_BLOCKED"
    INELIGIBLE = "INELIGIBLE"


class InvoiceStatus(str, Enum):
    DRAFT = "DRAFT"
    CONFIRMED = "CONFIRMED"
    SENT = "SENT"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"


class PaymentStatus(str, Enum):
    PAID = "PAID"
    OUTSTANDING = "OUTSTANDING"
    OVERDUE = "OVERDUE"


class DiscountType(str, Enum):
    PERCENTAGE = "PERCENTAGE"
    FIXED = "FIXED"


class PriorityLevel(str, Enum):
    CRITICAL = "CRITICAL"  # 80 - 100
    HIGH = "HIGH"          # 60 - 79
    MEDIUM = "MEDIUM"      # 30 - 59
    LOW = "LOW"            # 0 - 29


class ActionCategory(str, Enum):
    PAYMENT_RISK = "PAYMENT_RISK"
    RENEWAL_RISK = "RENEWAL_RISK"
    BILLING_RISK = "BILLING_RISK"
    REVENUE_OPPORTUNITY = "REVENUE_OPPORTUNITY"


class RenewalRiskLevel(str, Enum):
    EXPIRED = "EXPIRED"
    EXPIRES_TODAY = "EXPIRES_TODAY"
    WITHIN_3_DAYS = "WITHIN_3_DAYS"
    WITHIN_7_DAYS = "WITHIN_7_DAYS"
    WITHIN_30_DAYS = "WITHIN_30_DAYS"
    SAFE = "SAFE"


class ProductItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: Optional[str] = None
    product_name: str = "Standard Subscription"
    unit_price: float = 0.0
    quantity: float = 1.0
    variant_name: Optional[str] = None
    variant_price: float = 0.0


class DiscountRule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    discount_id: Optional[str] = None
    name: Optional[str] = None
    type: DiscountType = DiscountType.PERCENTAGE
    value: float = 0.0
    min_purchase_amount: float = 0.0
    min_quantity: float = 0.0
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    usage_limit: Optional[int] = None
    usage_count: int = 0
    applicable_products: Optional[List[str]] = None
    is_active: bool = True


class TaxRule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    tax_id: Optional[str] = "TAX-DEFAULT"
    name: str = "GST"
    rate: float = 18.0  # Percentage e.g. 18.0 for 18%


class SubscriptionRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    subscription_id: str
    customer_id: Optional[str] = None
    customer_name: str = "Unknown Customer"
    status: str = "ACTIVE"
    billing_frequency: str = "MONTHLY"
    start_date: Optional[str] = None
    next_billing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    unit_price: float = 0.0
    quantity: float = 1.0
    total_amount: float = 0.0
    products: List[ProductItem] = Field(default_factory=list)
    discount: Optional[DiscountRule] = None
    tax_rate: Optional[float] = None
    payment_terms: Optional[str] = "NET_30"
    auto_close: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)


class InvoiceRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    invoice_id: str
    invoice_number: Optional[str] = None
    subscription_id: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: str = "Unknown Customer"
    billing_period_start: Optional[str] = None
    billing_period_end: Optional[str] = None
    issue_date: Optional[str] = None
    due_date: Optional[str] = None
    status: str = "CONFIRMED"
    total_amount: float = 0.0
    paid_amount: float = 0.0
    outstanding_amount: float = 0.0
    items: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PaymentRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    payment_id: str
    invoice_id: str
    amount: float = 0.0
    payment_date: Optional[str] = None
    payment_method: str = "BANK_TRANSFER"
    notes: Optional[str] = None


class BillingInstruction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    subscription_id: str
    customer_id: Optional[str] = None
    customer_name: str
    billing_allowed: bool
    billing_status: str
    base_amount: float = 0.0
    discount_amount: float = 0.0
    discount_applied: bool = False
    discount_reason: Optional[str] = None
    taxable_amount: float = 0.0
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    total_amount: float = 0.0
    billing_period_start: Optional[str] = None
    billing_period_end: Optional[str] = None
    next_billing_date: Optional[str] = None
    reason: str


class ActionItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    priority: PriorityLevel
    score: int
    category: ActionCategory
    title: str
    reason: str
    recommended_action: str
    related_entity_type: str  # "invoice" | "subscription" | "payment" | "customer"
    related_entity_id: str
    customer_name: str
    amount: float
    created_at: str
    score_breakdown: Dict[str, int] = Field(default_factory=dict)
    reasoning: List[str] = Field(default_factory=list)


class RevenueSummary(BaseModel):
    model_config = ConfigDict(extra="ignore")
    total_actions: int = 0
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    total_revenue_at_risk: float = 0.0


class IntelligenceReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    summary: RevenueSummary
    actions: List[ActionItem]


class ChurnLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class PlanType(str, Enum):
    PAYMENT_RECOVERY = "PAYMENT_RECOVERY"
    DUNNING_NOTICE = "DUNNING_NOTICE"
    RENEWAL_RESCUE = "RENEWAL_RESCUE"
    RETENTION_OUTREACH = "RETENTION_OUTREACH"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    MONITOR = "MONITOR"


class SignalType(str, Enum):
    OVERDUE_INVOICE = "OVERDUE_INVOICE"
    PAYMENT_DELAY_PATTERN = "PAYMENT_DELAY_PATTERN"
    PAYMENT_FAILURE = "PAYMENT_FAILURE"
    EXPIRING_SUBSCRIPTION = "EXPIRING_SUBSCRIPTION"
    HIGH_VALUE_EXPOSURE = "HIGH_VALUE_EXPOSURE"
    UNBILLED_LEAKAGE = "UNBILLED_LEAKAGE"
    HEALTHY_ACTIVITY = "HEALTHY_ACTIVITY"


class RiskSignal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    type: str
    severity: str  # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    description: str
    detected_at: Optional[str] = None
    metric_value: Optional[float] = None


class FinancialImpact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    potential_revenue_impact: float = 0.0
    projected_recovery: float = 0.0
    projected_revenue_protected: float = 0.0
    currency: str = "INR"


class MitigationPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    plan_type: PlanType
    recommended_action: str
    reason: str
    priority: PriorityLevel
    confidence: float = Field(ge=0.0, le=1.0, default=0.85)
    execution_preview: Dict[str, Any] = Field(default_factory=dict)


class AgenticActionReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    action_id: str
    generated_at: str
    customer_id: Optional[str] = None
    customer_name: str
    risk: Dict[str, Any]
    churn: Dict[str, Any]
    signals: List[RiskSignal]
    financial_impact: FinancialImpact
    mitigation_plan: MitigationPlan
    requires_human_approval: bool = True
