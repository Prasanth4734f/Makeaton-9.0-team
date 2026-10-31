"""Data normalization adapter for Revora Intelligence Engine.

Converts diverse data payloads from backend APIs and database queries
into clean, strongly-typed internal data representations.
"""

from datetime import date, datetime
from typing import Any, Dict, List, Optional, Union

from intelligence_engine.schemas.intelligence_schema import (
    DiscountRule,
    DiscountType,
    InvoiceRecord,
    PaymentRecord,
    ProductItem,
    SubscriptionRecord,
)


def normalize_date(value: Any) -> Optional[str]:
    """Normalize any date or datetime representation into YYYY-MM-DD string."""
    if value is None:
        return None
    if isinstance(value, (datetime, date)):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, str):
        val = value.strip()
        if not val:
            return None
        # Handle ISO strings with T or space
        if "T" in val:
            val = val.split("T")[0]
        elif " " in val:
            val = val.split(" ")[0]
        # Validate format
        try:
            parsed = datetime.strptime(val, "%Y-%m-%d").date()
            return parsed.strftime("%Y-%m-%d")
        except ValueError:
            # Try alternate common format DD-MM-YYYY or DD/MM/YYYY
            for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d"):
                try:
                    parsed = datetime.strptime(val, fmt).date()
                    return parsed.strftime("%Y-%m-%d")
                except ValueError:
                    continue
            return val
    return str(value)


def parse_date(value: Any) -> Optional[date]:
    """Parse date into standard python date object."""
    norm = normalize_date(value)
    if not norm:
        return None
    try:
        return datetime.strptime(norm, "%Y-%m-%d").date()
    except ValueError:
        return None


def get_field(data: Any, *keys: str, default: Any = None) -> Any:
    """Extract a field from dict or object trying multiple candidate key names."""
    for key in keys:
        if isinstance(data, dict):
            if key in data and data[key] is not None:
                return data[key]
        else:
            if hasattr(data, key):
                val = getattr(data, key)
                if val is not None:
                    return val
    return default


def normalize_amount(value: Any) -> float:
    """Safely cast numeric amounts to float."""
    if value is None:
        return 0.0
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0


def normalize_subscription(raw: Any) -> SubscriptionRecord:
    """Normalize subscription dictionary or object into SubscriptionRecord."""
    sub_id = str(
        get_field(raw, "subscription_id", "id", "sub_id", "code", "subscription_number")
        or "UNKNOWN-SUB"
    )
    cust_id = get_field(raw, "customer_id", "cust_id")
    cust_name = get_field(
        raw, "customer_name", "customer", "client_name", "client", default="Unknown Customer"
    )
    if isinstance(cust_name, dict):
        cust_name = cust_name.get("name", "Unknown Customer")

    status = str(get_field(raw, "status", "state", default="ACTIVE")).strip().upper()
    freq = str(
        get_field(raw, "billing_frequency", "frequency", "plan_frequency", default="MONTHLY")
    ).strip().upper()

    unit_price = normalize_amount(get_field(raw, "unit_price", "price", default=0.0))
    qty = normalize_amount(get_field(raw, "quantity", "qty", default=1.0))
    if qty <= 0:
        qty = 1.0

    tot = normalize_amount(get_field(raw, "total_amount", "amount", "recurring_amount", "subscription_value", "value"))
    if tot == 0.0 and unit_price > 0.0:
        tot = unit_price * qty

    # Products normalization
    raw_products = get_field(raw, "products", "items", "lines", default=[])
    products_list: List[ProductItem] = []
    if isinstance(raw_products, list):
        for p in raw_products:
            p_id = get_field(p, "product_id", "id")
            p_name = get_field(p, "product_name", "name", default="Product")
            p_unit = normalize_amount(get_field(p, "unit_price", "price", default=0.0))
            p_qty = normalize_amount(get_field(p, "quantity", "qty", default=1.0))
            v_name = get_field(p, "variant_name", "variant")
            v_price = normalize_amount(get_field(p, "variant_price", default=0.0))
            products_list.append(
                ProductItem(
                    product_id=p_id,
                    product_name=p_name,
                    unit_price=p_unit,
                    quantity=p_qty,
                    variant_name=v_name,
                    variant_price=v_price,
                )
            )

    # Discount normalization
    discount_obj = None
    raw_discount = get_field(raw, "discount", "discount_rule")
    if isinstance(raw_discount, dict):
        d_type_raw = str(raw_discount.get("type", "PERCENTAGE")).strip().upper()
        d_type = DiscountType.FIXED if "FIX" in d_type_raw else DiscountType.PERCENTAGE
        discount_obj = DiscountRule(
            discount_id=raw_discount.get("discount_id") or raw_discount.get("id"),
            name=raw_discount.get("name"),
            type=d_type,
            value=normalize_amount(raw_discount.get("value", 0.0)),
            min_purchase_amount=normalize_amount(raw_discount.get("min_purchase_amount", 0.0)),
            min_quantity=normalize_amount(raw_discount.get("min_quantity", 0.0)),
            start_date=normalize_date(raw_discount.get("start_date")),
            end_date=normalize_date(raw_discount.get("end_date")),
            usage_limit=raw_discount.get("usage_limit"),
            usage_count=int(raw_discount.get("usage_count", 0)),
            applicable_products=raw_discount.get("applicable_products"),
            is_active=bool(raw_discount.get("is_active", True)),
        )

    tax_rate = get_field(raw, "tax_rate", "tax_percentage")
    if tax_rate is not None:
        tax_rate = normalize_amount(tax_rate)

    return SubscriptionRecord(
        subscription_id=sub_id,
        customer_id=str(cust_id) if cust_id else None,
        customer_name=str(cust_name),
        status=status,
        billing_frequency=freq,
        start_date=normalize_date(get_field(raw, "start_date")),
        next_billing_date=normalize_date(get_field(raw, "next_billing_date", "billing_date")),
        expiry_date=normalize_date(get_field(raw, "expiry_date", "end_date")),
        unit_price=unit_price,
        quantity=qty,
        total_amount=tot,
        products=products_list,
        discount=discount_obj,
        tax_rate=tax_rate,
        payment_terms=get_field(raw, "payment_terms", default="NET_30"),
        auto_close=bool(get_field(raw, "auto_close", default=False)),
        metadata=get_field(raw, "metadata", default={}),
    )


def normalize_invoice(raw: Any) -> InvoiceRecord:
    """Normalize invoice dictionary or object into InvoiceRecord."""
    inv_id = str(get_field(raw, "invoice_id", "id", "inv_id", "invoice_number") or "UNKNOWN-INV")
    inv_number = get_field(raw, "invoice_number", "number", default=inv_id)
    sub_id = get_field(raw, "subscription_id", "sub_id")
    cust_id = get_field(raw, "customer_id", "cust_id")
    cust_name = get_field(
        raw, "customer_name", "customer", "client_name", "client", default="Unknown Customer"
    )
    if isinstance(cust_name, dict):
        cust_name = cust_name.get("name", "Unknown Customer")

    status = str(get_field(raw, "status", "state", default="CONFIRMED")).strip().upper()
    tot = normalize_amount(get_field(raw, "total_amount", "amount", "total", default=0.0))
    paid = normalize_amount(get_field(raw, "paid_amount", "paid", "amount_paid", default=0.0))

    outstanding = get_field(raw, "outstanding_amount", "balance", "due_amount")
    if outstanding is not None:
        out_amt = normalize_amount(outstanding)
    else:
        out_amt = max(0.0, tot - paid)

    # Status auto-refinement if unpaid and past due or fully paid
    if status == "PAID":
        out_amt = 0.0
        if paid == 0.0 and tot > 0:
            paid = tot
    elif paid >= tot and tot > 0:
        status = "PAID"
        out_amt = 0.0

    return InvoiceRecord(
        invoice_id=inv_id,
        invoice_number=str(inv_number),
        subscription_id=str(sub_id) if sub_id else None,
        customer_id=str(cust_id) if cust_id else None,
        customer_name=str(cust_name),
        billing_period_start=normalize_date(get_field(raw, "billing_period_start", "period_start")),
        billing_period_end=normalize_date(get_field(raw, "billing_period_end", "period_end")),
        issue_date=normalize_date(get_field(raw, "issue_date", "date", "created_at")),
        due_date=normalize_date(get_field(raw, "due_date")),
        status=status,
        total_amount=tot,
        paid_amount=paid,
        outstanding_amount=out_amt,
        items=get_field(raw, "items", "lines", default=[]),
        metadata=get_field(raw, "metadata", default={}),
    )


def normalize_payment(raw: Any) -> PaymentRecord:
    """Normalize payment dictionary or object into PaymentRecord."""
    pmt_id = str(get_field(raw, "payment_id", "id", "pmt_id") or "UNKNOWN-PMT")
    inv_id = str(get_field(raw, "invoice_id", "inv_id") or "UNKNOWN-INV")
    amt = normalize_amount(get_field(raw, "amount", "paid_amount", default=0.0))

    return PaymentRecord(
        payment_id=pmt_id,
        invoice_id=inv_id,
        amount=amt,
        payment_date=normalize_date(get_field(raw, "payment_date", "date", "created_at")),
        payment_method=str(get_field(raw, "payment_method", "method", default="BANK_TRANSFER")),
        notes=get_field(raw, "notes", "note"),
    )


class DataAdapter:
    """Master adapter to parse and normalize complete business datasets."""

    @staticmethod
    def normalize_payload(payload: Union[Dict[str, Any], List[Any]]) -> Dict[str, List[Any]]:
        """Normalize a dictionary containing subscriptions, invoices, and payments."""
        if not isinstance(payload, dict):
            return {"subscriptions": [], "invoices": [], "payments": []}

        raw_subs = payload.get("subscriptions") or []
        raw_invs = payload.get("invoices") or []
        raw_pmts = payload.get("payments") or []

        normalized_subs = [normalize_subscription(s) for s in raw_subs]
        normalized_invs = [normalize_invoice(i) for i in raw_invs]
        normalized_pmts = [normalize_payment(p) for p in raw_pmts]

        return {
            "subscriptions": normalized_subs,
            "invoices": normalized_invs,
            "payments": normalized_pmts,
        }
