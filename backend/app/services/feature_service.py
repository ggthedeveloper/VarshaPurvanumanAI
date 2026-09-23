"""
Feature Engineering and Transformation Service for VarshaPurvanumanAI Backend.
Constructs and validates the canonical 29-feature vector for model inference.
"""
import math
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, Tuple

from backend.app.services.model_loader import registry
from backend.app.schemas.forecast import RainfallPredictionRequest


FEATURE_COLUMNS_ORDER = [
    "nwp_rainfall",
    "log_nwp_rainfall",
    "wind_speed_ms",
    "u_wind_10m",
    "v_wind_10m",
    "temperature_2m",
    "relative_humidity_2m",
    "dew_point_depression",
    "surface_pressure",
    "cape",
    "w_max_convective",
    "month",
    "day_of_year",
    "sin_doy",
    "cos_doy",
    "sin_month",
    "cos_month",
    "is_monsoon_season",
    "is_monsoon_core",
    "is_ne_monsoon",
    "forecast_lead_time",
    "latitude",
    "longitude",
    "in_core_monsoon_zone",
    "in_western_ghats_belt",
    "in_northeast_hills",
    "dist_to_coast_approx_km",
    "nwp_rainfall_lag1",
    "nwp_rainfall_rolling3",
]


class FeatureService:
    """
    Transforms forecast input requests into aligned, scaled pandas DataFrames for inference.
    """

    @staticmethod
    def prepare_feature_dataframe(req: RainfallPredictionRequest) -> Tuple[pd.DataFrame, float]:
        """
        Processes either pre-engineered features or raw physical parameters.
        Returns:
            (df_features, raw_nwp_rainfall_mm)
        """
        # Case 1: Pre-engineered features dictionary provided
        if req.features is not None and len(req.features) > 0:
            feat_dict = req.features.copy()
            # If NWP rainfall was explicitly set in top-level request, ensure consistency
            raw_nwp_val = req.nwp_rainfall if req.nwp_rainfall is not None else feat_dict.get("nwp_rainfall")
            if raw_nwp_val is None:
                raise ValueError("Required feature 'nwp_rainfall' is missing.")

            # Validate all 29 required features exist; never silently impute
            missing_cols = [col for col in FEATURE_COLUMNS_ORDER if col not in feat_dict or feat_dict[col] is None]
            if missing_cols:
                raise ValueError(f"Incomplete features dictionary. Missing required feature(s): {', '.join(missing_cols)}")

            row = {}
            for col in FEATURE_COLUMNS_ORDER:
                val = float(feat_dict[col])
                if math.isnan(val) or math.isinf(val):
                    raise ValueError(f"Feature '{col}' contains invalid value (NaN or Infinity).")
                row[col] = val

            df = pd.DataFrame([row], columns=FEATURE_COLUMNS_ORDER)
            return df, float(raw_nwp_val)

        # Case 2: Raw meteorological parameters provided - strict validation of required physical parameters
        required_physical = [
            "nwp_rainfall",
            "wind_speed_ms",
            "u_wind_10m",
            "v_wind_10m",
            "temperature_2m",
            "relative_humidity_2m",
            "surface_pressure",
            "cape",
            "month",
            "day_of_year",
            "latitude",
            "longitude",
        ]
        missing_physical = [field for field in required_physical if getattr(req, field, None) is None]
        if missing_physical:
            raise ValueError(f"Missing required meteorological predictor(s): {', '.join(missing_physical)}. Incomplete physical inputs cannot be safely inferred.")

        provenance = registry.feature_provenance or {}
        impute = provenance.get("impute_values", {})
        scaler_means = provenance.get("scaler_means", [])
        scaler_scales = provenance.get("scaler_scale", [])

        raw_rainfall = float(req.nwp_rainfall)
        if raw_rainfall < 0.0:
            raise ValueError(f"Rainfall cannot be negative: {raw_rainfall} mm.")
        log_rainfall = math.log1p(raw_rainfall)

        month_val = int(req.month)
        doy_val = int(req.day_of_year)

        # Cyclical transformations
        sin_doy = math.sin(2.0 * math.pi * doy_val / 365.25)
        cos_doy = math.cos(2.0 * math.pi * doy_val / 365.25)
        sin_month = math.sin(2.0 * math.pi * month_val / 12.0)
        cos_month = math.cos(2.0 * math.pi * month_val / 12.0)

        # Spatial
        lat = float(req.latitude)
        lon = float(req.longitude)

        # Thermodynamical
        t2m = float(req.temperature_2m)
        rh = float(req.relative_humidity_2m)
        if not (0.0 <= rh <= 100.0):
            raise ValueError(f"Relative humidity must be between 0% and 100%, got {rh}%.")
        dp_dep = (100.0 - rh) / 5.0  # Approx dew point depression

        cape_val = float(req.cape)
        if cape_val < 0.0:
            raise ValueError(f"CAPE cannot be negative, got {cape_val} J/kg.")
        w_max = math.sqrt(2.0 * max(0.0, cape_val))

        # Wind
        wspd = float(req.wind_speed_ms)
        u10 = float(req.u_wind_10m)
        v10 = float(req.v_wind_10m)

        sp = float(req.surface_pressure)
        if not (500.0 < sp < 1100.0):
            raise ValueError(f"Surface pressure out of physical range: {sp} hPa.")
        lead = float(req.forecast_lead_time) if req.forecast_lead_time is not None else 1.0

        raw_vector = {
            "nwp_rainfall": raw_rainfall,
            "log_nwp_rainfall": log_rainfall,
            "wind_speed_ms": wspd,
            "u_wind_10m": u10,
            "v_wind_10m": v10,
            "temperature_2m": t2m,
            "relative_humidity_2m": rh,
            "dew_point_depression": dp_dep,
            "surface_pressure": sp,
            "cape": cape_val,
            "w_max_convective": w_max,
            "month": float(month_val),
            "day_of_year": float(doy_val),
            "sin_doy": sin_doy,
            "cos_doy": cos_doy,
            "sin_month": sin_month,
            "cos_month": cos_month,
            "is_monsoon_season": 1.0 if (6 <= month_val <= 9) else 0.0,
            "is_monsoon_core": 1.0 if (7 <= month_val <= 8) else 0.0,
            "is_ne_monsoon": 1.0 if (10 <= month_val <= 12) else 0.0,
            "forecast_lead_time": lead,
            "latitude": lat,
            "longitude": lon,
            "in_core_monsoon_zone": 1.0 if (18.0 <= lat <= 27.0 and 72.0 <= lon <= 88.0) else 0.0,
            "in_western_ghats_belt": 1.0 if (8.0 <= lat <= 21.0 and 72.5 <= lon <= 75.5) else 0.0,
            "in_northeast_hills": 1.0 if (23.0 <= lat <= 29.0 and 89.0 <= lon <= 97.0) else 0.0,
            "dist_to_coast_approx_km": impute.get("dist_to_coast_approx_km", 124.3),
            "nwp_rainfall_lag1": raw_rainfall,
            "nwp_rainfall_rolling3": raw_rainfall,
        }

        # Apply standard scaling if provenance scales are available
        scaled_row = {}
        if len(scaler_means) == len(FEATURE_COLUMNS_ORDER) and len(scaler_scales) == len(FEATURE_COLUMNS_ORDER):
            for i, col in enumerate(FEATURE_COLUMNS_ORDER):
                mean_i = scaler_means[i]
                scale_i = scaler_scales[i]
                val = raw_vector[col]
                scaled_row[col] = (val - mean_i) / scale_i if scale_i > 1e-8 else val
        else:
            scaled_row = raw_vector

        df = pd.DataFrame([scaled_row], columns=FEATURE_COLUMNS_ORDER)
        return df, float(raw_rainfall)
