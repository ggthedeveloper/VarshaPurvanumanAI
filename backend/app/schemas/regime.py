"""
Pydantic schemas for Weather Regime Classification endpoints.
"""
from typing import Dict, Optional, Any
from pydantic import BaseModel, Field, field_validator, model_validator
import math


class RegimePredictionRequest(BaseModel):
    """
    Request payload for synoptic regime classification.
    Accepts either a pre-engineered 29-feature dictionary or physical NWP parameters.
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
            # Check for NaN or Inf
            for k, val in v.items():
                if val is None or math.isnan(val) or math.isinf(val):
                    raise ValueError(f"Feature '{k}' contains invalid value (NaN or Infinity).")
            # Strict zero target leakage check
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


class RegimePredictionResponse(BaseModel):
    """
    Standardized regime prediction response using pre-trained Phase 4 classifier.
    """
    predicted_regime: str = Field(description="Operational synoptic regime classification.")
    probabilities: Dict[str, float] = Field(description="Posterior probability per regime.")
    confidence: float = Field(ge=0.0, le=1.0, description="Highest class probability.")
    model_version: str = Field(default="v1.0.0-phase4", description="Regime classifier model version.")
    data_status: str = Field(default="HISTORICAL_BENCHMARK", description="Data provenance status.")
    timestamp: str = Field(description="ISO timestamp of inference.")
