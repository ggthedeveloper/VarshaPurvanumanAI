"""
Validator for IMD District Rainfall observations.
"""
from typing import Tuple, List
import pandas as pd


class IMDDistrictValidator:
    """Validates structured IMD district observation DataFrames."""

    REQUIRED_COLUMNS = [
        "district_name",
        "district_id",
        "observation_date",
        "actual_rainfall_mm",
        "normal_rainfall_mm",
        "departure_pct"
    ]

    @classmethod
    def validate(cls, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """Performs rigorous quality and schema validation."""
        errors = []
        if df.empty:
            return False, ["IMD District DataFrame is empty."]

        # Column check
        for col in cls.REQUIRED_COLUMNS:
            if col not in df.columns:
                errors.append(f"Missing required column '{col}'.")

        if errors:
            return False, errors

        # Check district names non-empty
        if df["district_name"].isna().any() or (df["district_name"].str.strip() == "").any():
            errors.append("Empty or null district names detected.")

        # Physical range checks on non-null actual rainfall
        valid_actual = df["actual_rainfall_mm"].dropna()
        if (valid_actual < 0.0).any():
            min_val = valid_actual.min()
            errors.append(f"Negative rainfall value detected: {min_val} mm.")
        if (valid_actual > 1500.0).any():
            max_val = valid_actual.max()
            errors.append(f"Extreme rainfall value exceeds physical limit: {max_val} mm.")

        # Range checks on normal rainfall
        valid_normal = df["normal_rainfall_mm"].dropna()
        if (valid_normal < 0.0).any():
            errors.append("Negative normal rainfall detected.")

        # Check dates are parseable
        try:
            pd.to_datetime(df["observation_date"])
        except Exception as e:
            errors.append(f"Failed to parse observation dates: {e}")

        return len(errors) == 0, errors
