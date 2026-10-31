"""Autonomous Revenue Recovery & Churn Defense Agent for Revora.

Implements the controlled 7-stage Agentic Decision Intelligence Workflow:
1. OBSERVE: Ingest and normalize telemetry (invoices, subscriptions, payments).
2. ANALYZE: Compute multidimensional risk factors and historical health patterns.
3. DETECT SIGNALS: Extract structured risk signals with severities and explanations.
4. ESTIMATE IMPACT: Project immediate exposure, protected ARR, and expected recovery.
5. MITIGATE: Formulate Next Best Action and structured execution strategy.
6. EXPLAIN: Synthesize transparent reasoning for human reviewers.
7. AWAIT HUMAN APPROVAL: Enforce mandatory human-in-the-loop governance (requires_human_approval=True).
"""

import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Union

from intelligence_engine.adapters.data_adapter import (
    normalize_invoice,
    normalize_subscription,
    parse_date,
)
from intelligence_engine.engine.churn_predictor import ChurnPredictor
from intelligence_engine.engine.mitigation_engine import MitigationEngine
from intelligence_engine.engine.priority_scoring import classify_priority
from intelligence_engine.schemas.intelligence_schema import (
    AgenticActionReport,
    FinancialImpact,
    InvoiceRecord,
    MitigationPlan,
    PaymentRecord,
    RiskSignal,
    SubscriptionRecord,
)


class AutonomousRecoveryAgent:
    """Autonomous agentic orchestrator for churn prevention and revenue recovery."""

    @classmethod
    def run(
        cls,
        customer: Optional[Union[Dict[str, Any], Any]] = None,
        invoices: Optional[List[Union[Dict[str, Any], InvoiceRecord]]] = None,
        payments: Optional[List[Union[Dict[str, Any], PaymentRecord]]] = None,
        subscriptions: Optional[List[Union[Dict[str, Any], SubscriptionRecord]]] = None,
        reference_date: Optional[Union[str, date]] = None,
    ) -> Dict[str, Any]:
        """Execute full autonomous recovery intelligence cycle for a single customer.

        Args:
            customer: Customer record or dictionary.
            invoices: All invoices for this customer.
            payments: All payments associated with this customer.
            subscriptions: All subscriptions for this customer.
            reference_date: Contextual evaluation date.

        Returns:
            Structured dictionary conforming to AgenticActionReport schema.
        """
        ref_dt = parse_date(reference_date) or date.today()
        ref_str = ref_dt.strftime("%Y-%m-%d")

        # ---------------------------------------------------------------------
        # 1. OBSERVE: Normalize inputs
        # ---------------------------------------------------------------------
        cust_dict = customer if isinstance(customer, dict) else (
            {"id": getattr(customer, "id", None), "name": getattr(customer, "name", "Customer")}
            if customer else {}
        )
        cust_id = str(cust_dict.get("id") or cust_dict.get("customer_id") or "1")
        cust_name = str(cust_dict.get("name") or cust_dict.get("customer_name") or f"Customer #{cust_id}")

        inv_list: List[InvoiceRecord] = [
            item if isinstance(item, InvoiceRecord) else normalize_invoice(item)
            for item in (invoices or [])
        ]
        sub_list: List[SubscriptionRecord] = [
            item if isinstance(item, SubscriptionRecord) else normalize_subscription(item)
            for item in (subscriptions or [])
        ]

        # ---------------------------------------------------------------------
        # 2. ANALYZE & DETECT SIGNALS: Churn Predictor
        # ---------------------------------------------------------------------
        churn_assessment = ChurnPredictor.evaluate(
            customer=cust_dict,
            invoices=inv_list,
            payments=payments,
            subscriptions=sub_list,
            reference_date=ref_dt,
        )

        # ---------------------------------------------------------------------
        # 3. MITIGATE & ESTIMATE IMPACT: Mitigation Engine
        # ---------------------------------------------------------------------
        mitigation_result = MitigationEngine.generate_plan(
            churn_assessment=churn_assessment,
            subscriptions=sub_list,
            invoices=inv_list,
            reference_date=ref_dt,
        )

        plan_dict = mitigation_result["mitigation_plan"]
        impact_dict = mitigation_result["financial_impact"]

        # ---------------------------------------------------------------------
        # 4. EXPLAIN & SYNTHESIZE RISK CONTEXT
        # ---------------------------------------------------------------------
        priority_val = plan_dict["priority"]
        signals_list = churn_assessment.get("signals", [])

        # Build comprehensive explainability narrative
        reasons = [plan_dict["reason"]]
        for s in signals_list:
            reasons.append(f"[{s.get('severity')}] {s.get('description')}")

        risk_context = {
            "priority": priority_val,
            "overall_score": churn_assessment["probability"],
            "factor_breakdown": churn_assessment["score_breakdown"],
            "reasoning": reasons,
            "primary_driver": signals_list[0]["type"] if signals_list else "HEALTHY",
        }

        action_id = f"act_rec_{uuid.uuid4().hex[:10]}"

        report = AgenticActionReport(
            action_id=action_id,
            generated_at=f"{ref_str}T00:00:00Z",
            customer_id=cust_id,
            customer_name=cust_name,
            risk=risk_context,
            churn={
                "probability": churn_assessment["probability"],
                "level": churn_assessment["level"],
                "score_breakdown": churn_assessment["score_breakdown"],
                "metrics": churn_assessment["metrics"],
            },
            signals=[RiskSignal(**s) for s in signals_list],
            financial_impact=FinancialImpact(**impact_dict),
            mitigation_plan=MitigationPlan(**plan_dict),
            requires_human_approval=True,  # Hard governance boundary
        )

        return report.model_dump()

    @classmethod
    def rank_portfolio(
        cls,
        customers: List[Dict[str, Any]],
        invoices: Optional[List[Union[Dict[str, Any], InvoiceRecord]]] = None,
        payments: Optional[List[Union[Dict[str, Any], PaymentRecord]]] = None,
        subscriptions: Optional[List[Union[Dict[str, Any], SubscriptionRecord]]] = None,
        reference_date: Optional[Union[str, date]] = None,
    ) -> List[Dict[str, Any]]:
        """Run agent across a portfolio of customers and rank actions by urgency and impact.

        Sorting formula: Priority Tier (CRITICAL > HIGH > MEDIUM > LOW) ->
        Total Revenue At Risk (descending) -> Churn Probability (descending).
        """
        ref_dt = parse_date(reference_date) or date.today()
        inv_list = invoices or []
        pmt_list = payments or []
        sub_list = subscriptions or []

        # Index records by customer_id
        invs_by_cust: Dict[str, List[Any]] = {}
        for inv in inv_list:
            cid = str(getattr(inv, "customer_id", None) or (inv.get("customer_id") if isinstance(inv, dict) else None) or "1")
            invs_by_cust.setdefault(cid, []).append(inv)

        subs_by_cust: Dict[str, List[Any]] = {}
        for sub in sub_list:
            cid = str(getattr(sub, "customer_id", None) or (sub.get("customer_id") if isinstance(sub, dict) else None) or "1")
            subs_by_cust.setdefault(cid, []).append(sub)

        reports: List[Dict[str, Any]] = []
        for cust in customers:
            cid = str(cust.get("id") or cust.get("customer_id") or "1")
            c_invs = invs_by_cust.get(cid, [])
            c_subs = subs_by_cust.get(cid, [])
            # filter payments if they map to invoice ids
            c_inv_ids = {str(getattr(i, "id", None) or i.get("id", "")) for i in c_invs}
            c_pmts = [p for p in pmt_list if str(getattr(p, "invoice_id", None) or (p.get("invoice_id") if isinstance(p, dict) else "")) in c_inv_ids]

            rep = cls.run(
                customer=cust,
                invoices=c_invs,
                payments=c_pmts,
                subscriptions=c_subs,
                reference_date=ref_dt,
            )
            reports.append(rep)

        # Multi-factor priority ranking:
        # Tier weights: CRITICAL=4, HIGH=3, MEDIUM=2, LOW=1
        priority_weights = {
            "CRITICAL": 4,
            "HIGH": 3,
            "MEDIUM": 2,
            "LOW": 1,
        }

        def sort_key(item: Dict[str, Any]) -> tuple:
            p_str = item["mitigation_plan"]["priority"]
            p_weight = priority_weights.get(p_str, 0)
            fin_impact = item["financial_impact"]["potential_revenue_impact"]
            churn_prob = item["churn"]["probability"]
            return (-p_weight, -fin_impact, -churn_prob)

        reports.sort(key=sort_key)
        return reports

