"""Demo dataset and standalone demonstration runner for Revora Intelligence Engine.

Demonstrates connected, realistic business scenarios:
1. BrightTech: Critical unpaid invoice (₹48,000, 12 days overdue) -> [CRITICAL]
2. TechNova: High-value subscription expiring in 5 days (₹1,20,000) -> [HIGH]
3. CloudWorks: Unbilled active subscription (10 days past billing date) -> [MEDIUM]
4. RetailPro: Automated billing pipeline execution with discounts and taxes -> [READY FOR INVOICE]

Can be executed independently via:
    python -m intelligence_engine.demo.demo_data
"""

import sys
from pathlib import Path
from typing import Any, Dict

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure project root is on sys.path for direct script execution
_project_root = Path(__file__).resolve().parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from intelligence_engine.automation.billing_processor import process_billing
from intelligence_engine.services.intelligence_service import analyze_revenue

# Deterministic demo reference date
DEMO_REFERENCE_DATE = "2026-10-31"

# -----------------------------------------------------------------------------
# Connected Business Demo Data
# -----------------------------------------------------------------------------

DEMO_SUBSCRIPTIONS = [
    # 1. TechNova: High-Value Annual Subscription Expiring in 5 Days
    {
        "subscription_id": "SUB-TN-101",
        "customer_id": "CUST-002",
        "customer_name": "TechNova Solutions",
        "status": "ACTIVE",
        "billing_frequency": "YEARLY",
        "start_date": "2025-11-05",
        "next_billing_date": "2026-11-05",
        "expiry_date": "2026-11-05",  # 5 days from 2026-10-31
        "unit_price": 10000.0,
        "quantity": 12.0,
        "total_amount": 120000.0,
        "products": [
            {
                "product_id": "PROD-ENT",
                "product_name": "Enterprise Cloud ERP Platform",
                "unit_price": 9500.0,
                "quantity": 12.0,
                "variant_name": "Enterprise Multi-Region (+500)",
                "variant_price": 500.0,
            }
        ],
        "payment_terms": "NET_30",
    },
    # 2. BrightTech: Active Subscription with Overdue Invoice
    {
        "subscription_id": "SUB-BT-202",
        "customer_id": "CUST-001",
        "customer_name": "BrightTech Innovations",
        "status": "ACTIVE",
        "billing_frequency": "MONTHLY",
        "start_date": "2026-01-01",
        "next_billing_date": "2026-11-01",
        "expiry_date": "2027-01-01",
        "unit_price": 48000.0,
        "quantity": 1.0,
        "total_amount": 48000.0,
        "payment_terms": "NET_15",
    },
    # 3. CloudWorks: Active Subscription with Missed Billing (10 Days Overdue, No Invoice)
    {
        "subscription_id": "SUB-CW-303",
        "customer_id": "CUST-003",
        "customer_name": "CloudWorks Infrastructure",
        "status": "ACTIVE",
        "billing_frequency": "MONTHLY",
        "start_date": "2026-06-21",
        "next_billing_date": "2026-10-21",  # Passed 10 days ago! No invoice generated!
        "expiry_date": "2027-06-21",
        "unit_price": 25000.0,
        "quantity": 1.0,
        "total_amount": 25000.0,
        "products": [
            {
                "product_id": "PROD-INFRA",
                "product_name": "Dedicated Managed Cluster",
                "unit_price": 25000.0,
                "quantity": 1.0,
                "variant_name": "Standard Managed",
                "variant_price": 0.0,
            }
        ],
        "payment_terms": "NET_30",
    },
    # 4. RetailPro: Subscription Due for Automated Billing Today with Eligible 10% Discount
    {
        "subscription_id": "SUB-RP-404",
        "customer_id": "CUST-004",
        "customer_name": "RetailPro Commerce",
        "status": "ACTIVE",
        "billing_frequency": "MONTHLY",
        "start_date": "2026-09-30",
        "next_billing_date": "2026-10-31",  # Due today!
        "expiry_date": "2027-09-30",
        "unit_price": 10000.0,
        "quantity": 1.0,
        "total_amount": 10000.0,
        "products": [
            {
                "product_id": "PROD-POS",
                "product_name": "Omnichannel Point-of-Sale Core",
                "unit_price": 10000.0,
                "quantity": 1.0,
                "variant_name": "Omnichannel Premium",
                "variant_price": 0.0,
            }
        ],
        "discount": {
            "discount_id": "DISC-GROWTH-10",
            "name": "Q4 Growth Partner 10%",
            "type": "PERCENTAGE",
            "value": 10.0,
            "min_purchase_amount": 5000.0,
            "min_quantity": 1.0,
            "start_date": "2026-10-01",
            "end_date": "2026-12-31",
            "is_active": True,
        },
        "tax_rate": 18.0,
        "payment_terms": "NET_30",
    },
]

DEMO_INVOICES = [
    # BrightTech Overdue High-Value Invoice (Due 12 days ago on 2026-10-19)
    {
        "invoice_id": "INV-1042",
        "invoice_number": "INV-2026-1042",
        "subscription_id": "SUB-BT-202",
        "customer_id": "CUST-001",
        "customer_name": "BrightTech Innovations",
        "billing_period_start": "2026-09-01",
        "billing_period_end": "2026-09-30",
        "issue_date": "2026-10-01",
        "due_date": "2026-10-19",  # 12 days overdue as of 2026-10-31
        "status": "OVERDUE",
        "total_amount": 48000.0,
        "paid_amount": 0.0,
        "outstanding_amount": 48000.0,
    },
    # TechNova Previous Settled Invoice (Fully Paid)
    {
        "invoice_id": "INV-1001",
        "invoice_number": "INV-2025-1001",
        "subscription_id": "SUB-TN-101",
        "customer_id": "CUST-002",
        "customer_name": "TechNova Solutions",
        "billing_period_start": "2025-11-05",
        "billing_period_end": "2026-11-04",
        "issue_date": "2025-11-05",
        "due_date": "2025-12-05",
        "status": "PAID",
        "total_amount": 120000.0,
        "paid_amount": 120000.0,
        "outstanding_amount": 0.0,
    },
    # RetailPro Previous Month Settled Invoice
    {
        "invoice_id": "INV-0988",
        "invoice_number": "INV-2026-0988",
        "subscription_id": "SUB-RP-404",
        "customer_id": "CUST-004",
        "customer_name": "RetailPro Commerce",
        "billing_period_start": "2026-09-30",
        "billing_period_end": "2026-10-30",
        "issue_date": "2026-09-30",
        "due_date": "2026-10-15",
        "status": "PAID",
        "total_amount": 10620.0,
        "paid_amount": 10620.0,
        "outstanding_amount": 0.0,
    },
]

DEMO_PAYMENTS = [
    {
        "payment_id": "PMT-001",
        "invoice_id": "INV-1001",
        "amount": 120000.0,
        "payment_date": "2025-11-20",
        "payment_method": "BANK_TRANSFER",
        "notes": "Annual upfront contract settlement",
    },
    {
        "payment_id": "PMT-002",
        "invoice_id": "INV-0988",
        "amount": 10620.0,
        "payment_date": "2026-10-10",
        "payment_method": "UPI_AUTO_DEBIT",
        "notes": "Settled automatically",
    },
]


def get_demo_dataset() -> Dict[str, Any]:
    """Retrieve full demo dataset bundle."""
    return {
        "subscriptions": list(DEMO_SUBSCRIPTIONS),
        "invoices": list(DEMO_INVOICES),
        "payments": list(DEMO_PAYMENTS),
    }


def run_demo() -> None:
    """Execute complete revenue intelligence report and billing automation demonstration."""
    print("=" * 72)
    print("  REVORA -- SUBSCRIPTION REVENUE INTELLIGENCE PLATFORM")
    print("  Revenue Action Center & Billing Automation Demonstration")
    print(f"  Reference Date: {DEMO_REFERENCE_DATE}")
    print("=" * 72)

    demo_data = get_demo_dataset()

    # 1. Run Revenue Intelligence Analysis
    print("\n[+] Running Revenue Intelligence Engine analysis...")
    report = analyze_revenue(demo_data, reference_date=DEMO_REFERENCE_DATE)
    summary = report["summary"]
    actions = report["actions"]

    print("\n" + "=" * 72)
    print("  FINANCE REVENUE INTELLIGENCE SUMMARY")
    print("=" * 72)
    print(f"  Total Actionable Items : {summary['total_actions']}")
    print(f"  [CRITICAL] Priority    : {summary['critical']}")
    print(f"  [HIGH] Priority        : {summary['high']}")
    print(f"  [MEDIUM] Priority      : {summary['medium']}")
    print(f"  [LOW] Priority         : {summary['low']}")
    print(f"  Total Revenue at Risk  : Rs. {summary['total_revenue_at_risk']:,.2f}")
    print("=" * 72)

    print("\n" + "=" * 72)
    print("  REVENUE ACTION CENTER -- WHAT NEEDS ATTENTION NOW & WHY")
    print("=" * 72)

    tier_labels = {
        "CRITICAL": "[CRITICAL]",
        "HIGH": "[HIGH]    ",
        "MEDIUM": "[MEDIUM]  ",
        "LOW": "[LOW]     ",
    }

    for act in actions:
        tier_label = tier_labels.get(act["priority"], act["priority"])
        print(f"\n[{act['id']}] {tier_label} | Score: {act['score']}/100 | {act['category']}")
        print(f"  Target Customer   : {act['customer_name']} ({act['related_entity_type']}: {act['related_entity_id']})")
        print(f"  Revenue Exposure  : Rs. {act['amount']:,.2f}")
        print(f"  Title             : {act['title']}")
        print(f"  WHY               : {act['reason']}")
        print(f"  ACTION            : {act['recommended_action']}")
        print("  Score Breakdown   :", act["score_breakdown"])

    print("\n" + "=" * 72)
    print("  SYSTEM 1 -- AUTOMATED BILLING ENGINE IN ACTION")
    print("=" * 72)
    print("  Evaluating RetailPro Commerce (SUB-RP-404) due for billing today:")

    retail_sub = next(s for s in DEMO_SUBSCRIPTIONS if s["subscription_id"] == "SUB-RP-404")
    billing_instruction = process_billing(
        subscription=retail_sub,
        existing_invoices=DEMO_INVOICES,
        reference_date=DEMO_REFERENCE_DATE,
    )

    print(f"  Subscription ID   : {billing_instruction['subscription_id']}")
    print(f"  Customer          : {billing_instruction['customer_name']}")
    print(f"  Billing Allowed   : {billing_instruction['billing_allowed']}")
    print(f"  Billing Status    : {billing_instruction['billing_status']}")
    print(f"  Base Amount       : Rs. {billing_instruction['base_amount']:,.2f}")
    print(f"  Discount (10%)    : -Rs. {billing_instruction['discount_amount']:,.2f} ({billing_instruction['discount_reason']})")
    print(f"  Taxable Amount    : Rs. {billing_instruction['taxable_amount']:,.2f}")
    print(f"  Tax ({billing_instruction['tax_rate']}% GST) : +Rs. {billing_instruction['tax_amount']:,.2f}")
    print(f"  FINAL TOTAL       : Rs. {billing_instruction['total_amount']:,.2f}")
    print(f"  Billing Period    : {billing_instruction['billing_period_start']} to {billing_instruction['billing_period_end']}")
    print(f"  Next Billing Date : {billing_instruction['next_billing_date']}")
    print(f"  Reason            : {billing_instruction['reason']}")

    # Also demonstrate duplicate prevention
    print("\n  [Testing Duplicate Prevention]")
    print("  Simulating attempt to re-bill RetailPro for the same period:")
    invoices_with_generated = list(DEMO_INVOICES) + [
        {
            "invoice_id": "INV-2026-RP01",
            "subscription_id": "SUB-RP-404",
            "billing_period_start": billing_instruction["billing_period_start"],
            "billing_period_end": billing_instruction["billing_period_end"],
            "status": "DRAFT",
            "total_amount": billing_instruction["total_amount"],
        }
    ]
    duplicate_instruction = process_billing(
        subscription=retail_sub,
        existing_invoices=invoices_with_generated,
        reference_date=DEMO_REFERENCE_DATE,
    )
    print(f"  Re-bill Allowed   : {duplicate_instruction['billing_allowed']}")
    print(f"  Status Result     : {duplicate_instruction['billing_status']}")
    print(f"  Guard Reason      : {duplicate_instruction['reason']}")

    print("\n" + "=" * 72)
    print("  SUCCESS: ALL SYSTEMS FUNCTIONING DETERMINISTICALLY")
    print("=" * 72 + "\n")


if __name__ == "__main__":
    run_demo()
