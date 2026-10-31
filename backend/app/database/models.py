import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, 
    Text, Enum as SQLEnum, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database.connection import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"
    CUSTOMER = "CUSTOMER"

class ProductType(str, enum.Enum):
    PRODUCT = "PRODUCT"
    SERVICE = "SERVICE"

class ProductStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ARCHIVED = "ARCHIVED"

class BillingFrequency(str, enum.Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"

class PlanStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ARCHIVED = "ARCHIVED"

class QuotationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    ACCEPTED = "ACCEPTED"
    EXPIRED = "EXPIRED"

class SubscriptionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    QUOTATION = "QUOTATION"
    CONFIRMED = "CONFIRMED"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    CLOSED = "CLOSED"

class InvoiceStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    CONFIRMED = "CONFIRMED"
    SENT = "SENT"
    PAID = "PAID"
    OUTSTANDING = "OUTSTANDING"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"

class PaymentStatus(str, enum.Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    PENDING = "PENDING"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    quotations = relationship("Quotation", back_populates="customer")
    subscriptions = relationship("Subscription", back_populates="customer")
    invoices = relationship("Invoice", back_populates="customer")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    product_type = Column(SQLEnum(ProductType), default=ProductType.SERVICE, nullable=False)
    sales_price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(ProductStatus), default=ProductStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    name = Column(String(255), nullable=False)
    additional_price = Column(Float, default=0.0, nullable=False)

    product = relationship("Product", back_populates="variants")

class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    billing_frequency = Column(SQLEnum(BillingFrequency), nullable=False)
    price = Column(Float, nullable=False)
    minimum_quantity = Column(Integer, default=1, nullable=False)
    available_from = Column(DateTime, nullable=True)
    available_until = Column(DateTime, nullable=True)
    status = Column(SQLEnum(PlanStatus), default=PlanStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    quotations = relationship("Quotation", back_populates="plan")
    subscriptions = relationship("Subscription", back_populates="plan")

class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True)
    items = Column(Text, nullable=False) # JSON encoded string
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0, nullable=False)
    tax = Column(Float, default=0.0, nullable=False)
    total = Column(Float, nullable=False)
    valid_until = Column(DateTime, nullable=True)
    status = Column(SQLEnum(QuotationStatus), default=QuotationStatus.DRAFT, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    customer = relationship("User", back_populates="quotations")
    plan = relationship("Plan", back_populates="quotations")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=True)
    status = Column(SQLEnum(SubscriptionStatus), default=SubscriptionStatus.DRAFT, nullable=False)
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    next_billing_date = Column(DateTime, nullable=True)
    billing_frequency = Column(SQLEnum(BillingFrequency), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    customer = relationship("User", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
    invoices = relationship("Invoice", back_populates="subscription")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)
    billing_period_start = Column(DateTime, nullable=True)
    billing_period_end = Column(DateTime, nullable=True)
    items = Column(Text, nullable=False) # JSON encoded string
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0, nullable=False)
    tax = Column(Float, default=0.0, nullable=False)
    total = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0, nullable=False)
    outstanding_amount = Column(Float, nullable=False)
    issue_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    due_date = Column(DateTime, nullable=False)
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('subscription_id', 'billing_period_start', name='uq_sub_billing_period'),
    )

    customer = relationship("User", back_populates="invoices")
    subscription = relationship("Subscription", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    payment_method = Column(String(50), nullable=False) # e.g. "CARD", "BANK_TRANSFER", "CASH", "UPI"
    amount = Column(Float, nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.SUCCESS, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    invoice = relationship("Invoice", back_populates="payments")


# ============================================================================
# PERSISTENT ACTION & RECOVERY LEDGER (Autonomous Revenue & Churn Defense)
# Engineer: Krishna (Database & Persistence Engineer)
# ============================================================================

class ActionStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    SNOOZED = "SNOOZED"


class ActionPriority(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ExecutionStatus(str, enum.Enum):
    SUCCESS = "SUCCESS"
    PENDING = "PENDING"
    FAILED = "FAILED"


class ActionRecord(Base):
    """
    Persistent Action Record for Action Center intelligence items.
    Ensures that risk detections, mitigation proposals, and lifecycle states
    are reliably stored in the database rather than frontend ephemeral memory.
    """
    __tablename__ = "action_records"

    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. "ACT-001"
    action_type = Column(String(50), nullable=False, default="PAYMENT_RISK") # PAYMENT_RISK, RENEWAL_RISK, BILLING_RISK, CHURN_RISK, UPSELL
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True) # Context / reason
    priority = Column(SQLEnum(ActionPriority), default=ActionPriority.HIGH, nullable=False)
    risk_score = Column(Integer, default=50, nullable=False) # 0 - 100
    status = Column(SQLEnum(ActionStatus), default=ActionStatus.OPEN, nullable=False, index=True)

    # Entity References
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    customer_name = Column(String(255), nullable=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True, index=True)

    # Reference metadata
    related_entity_type = Column(String(50), nullable=True) # "invoice", "subscription", "customer"
    related_entity_id = Column(String(100), nullable=True)
    recommended_action = Column(Text, nullable=True)

    # Financial Exposure (Distinguished from projected & actual recovery)
    potential_revenue_impact = Column(Float, default=0.0, nullable=False) # Base amount at risk

    # Audit & Lifecycle Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution_notes = Column(Text, nullable=True)

    # Persistent Snooze Support
    snoozed_until = Column(DateTime, nullable=True, index=True)
    snoozed_at = Column(DateTime, nullable=True)
    snoozed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    snooze_reason = Column(Text, nullable=True)

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id])
    invoice = relationship("Invoice", foreign_keys=[invoice_id])
    subscription = relationship("Subscription", foreign_keys=[subscription_id])
    resolver = relationship("User", foreign_keys=[resolved_by])
    snoozer = relationship("User", foreign_keys=[snoozed_by])
    recovery_logs = relationship("RecoveryExecutionLog", back_populates="action", cascade="all, delete-orphan")


class RecoveryExecutionLog(Base):
    """
    Persistent Recovery Execution Log recording every human-confirmed or agentic
    mitigation plan executed against a risk action item.
    """
    __tablename__ = "recovery_execution_logs"

    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. "EXEC-2026-001"
    action_id = Column(Integer, ForeignKey("action_records.id"), nullable=False, index=True)
    plan_type = Column(String(100), nullable=False) # DUNNING_NOTICE, RENEWAL_RESCUE_OFFER, TIER_UPGRADE_OPTIMIZATION
    execution_status = Column(SQLEnum(ExecutionStatus), default=ExecutionStatus.SUCCESS, nullable=False)

    executed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    executed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Financial Outcome Tracking (Clear distinction)
    financial_amount = Column(Float, default=0.0, nullable=False) # Base exposure involved
    projected_recovery = Column(Float, default=0.0, nullable=False) # Modeled expected recovery
    actual_recovered_amount = Column(Float, default=0.0, nullable=False) # Cash actually recovered

    channel = Column(String(100), nullable=True, default="OMNICHANNEL") # EMAIL, WHATSAPP, IN_APP, OMNICHANNEL
    notes = Column(Text, nullable=True) # Execution details / outcome notes
    signals = Column(Text, nullable=True) # JSON encoded string of detected risk signals
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    action = relationship("ActionRecord", back_populates="recovery_logs")
    executor = relationship("User", foreign_keys=[executed_by])


# Aliases for flexible teammate imports
ActionItem = ActionRecord
ActionItemModel = ActionRecord
RecoveryLog = RecoveryExecutionLog
