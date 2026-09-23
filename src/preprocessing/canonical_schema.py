"""
Canonical internal data schema definition and validation for SIH26080.
"""
from typing import Tuple, List, Optional
import pandas as pd
import numpy as np


class CanonicalSchemaValidator:
    """Enforces the canonical meteorological paired data schema across the pipeline."""

    MANDATORY_COLUMNS = [
        "timestamp",
        "latitude",
        "longitude",
        "forecast_initialization",
        "forecast_valid_time",
        "forecast_lead_time",
        "nwp_rainfall",
        "observed_rainfall"
    ]

    ALLOWED_ATMOSPHERIC_PREDICTORS = [
        "temperature_2m",
        "relative_humidity_2m",
        "surface_pressure",
        "wind_speed_10m",
        "wind_direction_10m",
        "cape",
        "cape_max"
    ]

    @classmethod
    def validate(cls, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """Validates that a DataFrame strictly adheres to the canonical schema."""
        errors = []
        if df.empty:
            return False, ["Canonical DataFrame is empty."]

        # Check mandatory columns
        for col in cls.MANDATORY_COLUMNS:
            if col not in df.columns:
                errors.append(f"Missing mandatory canonical column '{col}'.")

        if errors:
            return False, errors

        # Verify coordinates
        if not (-90.0 <= df["latitude"].min() and df["latitude"].max() <= 90.0):
            errors.append("Latitude values out of valid range [-90, 90].")
        if not (-180.0 <= df["longitude"].min() and df["longitude"].max() <= 180.0):
            errors.append("Longitude values out of valid range [-180, 180].")

        # Verify rainfall physical bounds (allow NaN for missing observations, but non-null must be >= 0)
        valid_nwp = df["nwp_rainfall"].dropna()
        if (valid_nwp < 0.0).any():
            errors.append(f"Negative NWP rainfall values detected: min = {valid_nwp.min()} mm.")

        valid_obs = df["observed_rainfall"].dropna()
        if (valid_obs < 0.0).any():
            errors.append(f"Negative observed rainfall values detected: min = {valid_obs.min()} mm.")

        # Verify lead time >= 0
        if (df["forecast_lead_time"] < 0).any():
            errors.append("Negative forecast lead time detected.")

        return len(errors) == 0, errors

    @classmethod
    def standardize_dataframe(
        cls,
        df: pd.DataFrame,
        district_name: Optional[str] = None
    ) -> pd.DataFrame:
        """Ensures exact canonical column order and types."""
        cols_present = [c for c in cls.MANDATORY_COLUMNS if c in df.columns]
        extra_cols = [c for c in cls.ALLOWED_ATMOSPHERIC_PREDICTORS if c in df.columns]
        optional_id_cols = [c for c in ["district_name", "district_id"] if c in df.columns]

        ordered_cols = cols_present + optional_id_cols + extra_cols
        res = df[ordered_cols].copy()

        # Enforce types
        res["nwp_rainfall"] = res["nwp_rainfall"].astype(float)
        res["observed_rainfall"] = res["observed_rainfall"].astype(float)
        res["forecast_lead_time"] = res["forecast_lead_time"].astype(int)

        return res
