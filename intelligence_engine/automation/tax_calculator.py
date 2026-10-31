"""Tax calculator component.

Computes configurable taxes (e.g. GST, VAT) on taxable amounts
without hardcoded global assumptions.
"""

from typing import Any, Dict, Optional, Union

from intelligence_engine.schemas.intelligence_schema import TaxRule


class TaxCalculator:
    """Calculates tax amounts and gross invoice totals with configurable rates."""

    DEFAULT_TAX_RATE = 18.0  # Standard GST baseline if none specified
    DEFAULT_TAX_NAME = "GST"

    @classmethod
    def calculate(
        cls,
        taxable_amount: float,
        tax_rate: Optional[float] = None,
        tax_rule: Optional[Union[Dict[str, Any], TaxRule]] = None,
    ) -> Dict[str, Any]:
        """Calculate tax on the taxable amount.

        Args:
            taxable_amount: Net amount subject to taxation after discounts.
            tax_rate: Explicit tax percentage rate (e.g. 18.0).
            tax_rule: Optional TaxRule object or dict specifying name and rate.

        Returns:
            Dict containing taxable_amount, tax_name, tax_rate, tax_amount, and final_amount.
        """
        taxable = max(0.0, float(taxable_amount))

        name = cls.DEFAULT_TAX_NAME
        rate = cls.DEFAULT_TAX_RATE

        if tax_rate is not None:
            rate = float(tax_rate)
        elif tax_rule:
            if isinstance(tax_rule, dict):
                rate = float(tax_rule.get("rate", cls.DEFAULT_TAX_RATE))
                name = str(tax_rule.get("name", cls.DEFAULT_TAX_NAME))
            else:
                rate = float(getattr(tax_rule, "rate", cls.DEFAULT_TAX_RATE))
                name = str(getattr(tax_rule, "name", cls.DEFAULT_TAX_NAME))

        # Ensure rate is non-negative
        rate = max(0.0, rate)

        tax_amount = round(taxable * (rate / 100.0), 2)
        final_amount = round(taxable + tax_amount, 2)

        return {
            "taxable_amount": round(taxable, 2),
            "tax_name": name,
            "tax_rate": rate,
            "tax_amount": tax_amount,
            "final_amount": final_amount,
        }


def calculate_tax(
    taxable_amount: float,
    tax_rate: Optional[float] = None,
    tax_rule: Optional[Union[Dict[str, Any], TaxRule]] = None,
) -> Dict[str, Any]:
    """Functional convenience wrapper for TaxCalculator.calculate."""
    return TaxCalculator.calculate(
        taxable_amount=taxable_amount,
        tax_rate=tax_rate,
        tax_rule=tax_rule,
    )
