"""
Pydantic schemas for Rainfall Correction and Probability of Exceedance endpoints.
"""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, field_validator, model_validator
import math


class RainfallPredictionRequest(BaseModel):
    """
    Input forecast predictors for rainfall bias-correction.
    """
    features: Optional[Dict[str, float]] = Field(
        default=None,
        description="Optional pre-engineered 29-feature dictionary matching training matrix."
    )
    nwp_rainfall: Optional[float] = Field(
        default=None,
        ge=0.0,
        description="Forecast 24h cumulative rainfall from NWP model (mm)."
    )
    wind_speed_ms: Optional[float] = Field(default=None, ge=0.0, description="10m wind speed (m/s).")
    u_wind_10m: Optional[float] = Field(default=None, description="Zonal wind component (m/s).")
    v_wind_10m: Optional[float] = Field(default=None, description="Meridional wind component (m/s).")
    temperature_2m: Optional[float] = Field(default=None, description="2m air temperature (°C).")
    relative_humidity_2m: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="2m relative humidity (%).")
    surface_pressure: Optional[float] = Field(default=None, gt=500.0, lt=1100.0, description="Surface pressure (hPa).")
    cape: Optional[float] = Field(default=None, ge=0.0, description="Convective Available Potential Energy (J/kg).")
    month: Optional[int] = Field(default=None, ge=1, le=12, description="Month of forecast (1-12).")
    day_of_year: Optional[int] = Field(default=None, ge=1, le=366, description="Day of year (1-366).")
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0, description="WGS84 Latitude.")
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0, description="WGS84 Longitude.")
    forecast_lead_time: Optional[float] = Field(default=1.0, ge=0.0, description="Forecast lead time in days.")

    @field_validator("features")
    @classmethod
    def validate_features(cls, v: Optional[Dict[str, float]]) -> Optional[Dict[str, float]]:
        if v is not None:
            for k, val in v.items():
                if val is None or math.isnan(val) or math.isinf(val):
                    raise ValueError(f"Feature '{k}' contains invalid value (NaN or Infinity).")
            forbidden = ["observed", "obs_rain", "target", "label", "true_regime"]
            for k in v.keys():
                for f_term in forbidden:
                    if f_term in k.lower():
                        raise ValueError(f"Forbidden target/leakage term '{k}' present in forecast features.")
        return v

    @model_validator(mode="after")
    def check_inputs(self):
        # Case 1: Pre-engineered features provided
        if self.features is not None:
            if len(self.features) == 0:
                raise ValueError("The 'features' dictionary cannot be empty. Provide all 29 canonical features or physical predictors.")
            canonical_29 = [
                "nwp_rainfall", "log_nwp_rainfall", "wind_speed_ms", "u_wind_10m", "v_wind_10m",
                "temperature_2m", "relative_humidity_2m", "dew_point_depression", "surface_pressure",
                "cape", "w_max_convective", "month", "day_of_year", "sin_doy", "cos_doy", "sin_month",
                "cos_month", "is_monsoon_season", "is_monsoon_core", "is_ne_monsoon", "forecast_lead_time",
                "latitude", "longitude", "in_core_monsoon_zone", "in_western_ghats_belt",
                "in_northeast_hills", "dist_to_coast_approx_km", "nwp_rainfall_lag1", "nwp_rainfall_rolling3"
            ]
            missing_cols = [col for col in canonical_29 if col not in self.features or self.features[col] is None]
            if missing_cols:
                raise ValueError(f"Incomplete features dictionary. Missing required feature(s): {', '.join(missing_cols)}")
            return self

        # Case 2: Raw meteorological parameters provided
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
        missing = [f for f in required_physical if getattr(self, f, None) is None]
        if missing:
            raise ValueError(f"Missing required meteorological predictor(s): {', '.join(missing)}. Incomplete physical inputs cannot be safely inferred.")
        return self


class RainfallPredictionResponse(BaseModel):
    """
    Standardized response for deterministic point rainfall bias-correction.
    """
    raw_nwp_rainfall_mm: float = Field(ge=0.0, description="Raw NWP input rainfall (mm).")
    predicted_regime: str = Field(description="Operational synoptic regime used for routing.")
    regime_probabilities: Dict[str, float] = Field(description="Posterior probabilities per regime.")
    selected_model: str = Field(description="Model selected by operational routing (dedicated or fallback).")
    corrected_rainfall_mm: float = Field(ge=0.0, description="Physically bounded non-negative rainfall forecast (mm).")
    model_version: str = Field(default="v1.0.0-phase6", description="Regime-aware model version.")
    data_status: str = Field(default="HISTORICAL_BENCHMARK", description="Data provenance status.")
    prediction_source: str = Field(default="verified_model_artifacts", description="Source of prediction.")
    timestamp: str = Field(description="ISO timestamp of inference.")


class ProbabilityThresholdItem(BaseModel):
    """
    Probability of exceedance for a verified rainfall threshold.
    """
    threshold_mm: float = Field(description="Rainfall threshold in mm/day.")
    threshold_name: str = Field(description="IMD or experimental threshold name.")
    category: str = Field(description="OPERATIONAL vs EXPERIMENTAL.")
    exceedance_probability: float = Field(ge=0.0, le=1.0, description="Estimated calibrated exceedance probability.")
    decision_threshold_tau: float = Field(description="Validation-tuned operational warning threshold.")
    advisory_status: str = Field(description="NORMAL_ADVISORY or ELEVATED_RISK based on tau.")


class ProbabilityPredictionResponse(BaseModel):
    """
    Standardized response for multi-threshold probability of exceedance.
    """
    probabilities: List[ProbabilityThresholdItem] = Field(description="Exceedance probabilities for all verified thresholds.")
    disclaimer: str = Field(
        default="MODEL EXCEEDANCE PROBABILITIES ARE SCIENTIFIC NUMERICAL ESTIMATES AND DO NOT CONSTITUTE OFFICIAL IMD WEATHER WARNINGS.",
        description="Statutory distinction from official IMD warnings."
    )
    model_version: str = Field(default="v1.0.0-phase7", description="Probability model version.")
    data_status: str = Field(default="HISTORICAL_BENCHMARK", description="Data provenance status.")
    timestamp: str = Field(description="ISO timestamp of inference.")


class CombinedForecastResponse(BaseModel):
    """
    Consolidated operational forecast response combining deterministic and probabilistic layers.
    """
    raw_nwp_rainfall_mm: float = Field(ge=0.0, description="Raw NWP input rainfall (mm).")
    predicted_regime: str = Field(description="Operational synoptic regime classification.")
    regime_probabilities: Dict[str, float] = Field(description="Regime posterior probabilities.")
    selected_model: str = Field(description="Post-processing model utilized.")
    corrected_rainfall_mm: float = Field(ge=0.0, description="Corrected point rainfall forecast (mm).")
    heavy_rainfall_probabilities: List[ProbabilityThresholdItem] = Field(description="Calibrated probability of exceedance across thresholds.")
    model_metadata: Dict[str, Any] = Field(description="Model provenance and version information.")
    data_status: str = Field(default="HISTORICAL_BENCHMARK", description="Data provenance status.")
    forecast_mode: Optional[str] = Field(default="HISTORICAL_BENCHMARK", description="Operational forecast mode: 'HISTORICAL_BENCHMARK', 'LIVE_NWP', or 'DEMO_DATA'.")
    sample_timestamp: Optional[str] = Field(default=None, description="Timestamp of the forecast or benchmark sample.")
    prediction_source: str = Field(default="verified_model_artifacts", description="Source of prediction.")
    timestamp: str = Field(description="ISO timestamp of inference.")
