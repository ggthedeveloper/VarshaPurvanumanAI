"""
Pydantic schemas for District geographic lookup and forecast queries.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from .forecast import CombinedForecastResponse


class DistrictItem(BaseModel):
    """
    Verified district geographic entity.
    """
    district_id: str = Field(description="Unique normalized district identifier.")
    name: str = Field(description="Official district name.")
    state: str = Field(description="State / Union Territory name.")
    latitude: float = Field(ge=-90.0, le=90.0, description="District headquarters / centroid latitude.")
    longitude: float = Field(ge=-180.0, le=180.0, description="District headquarters / centroid longitude.")
    coverage_status: str = Field(description="'BENCHMARK_ACTIVE' or 'DATA_UNAVAILABLE'.")
    raw_nwp_rainfall_mm: Optional[float] = Field(default=None, description="Raw NWP rainfall accumulation in mm.")
    corrected_rainfall_mm: Optional[float] = Field(default=None, description="AI regime-corrected rainfall in mm.")
    predicted_regime: Optional[str] = Field(default=None, description="Predicted synoptic weather regime.")


class DistrictListResponse(BaseModel):
    """
    List of verified Indian administrative districts.
    """
    total_districts: int = Field(description="Total count of verified district entries.")
    active_districts: int = Field(description="Count of districts with active live/benchmark data.")
    districts: List[DistrictItem] = Field(description="Array of district entities.")
    data_status: str = Field(default="HISTORICAL_BENCHMARK", description="Data provenance status.")


class DistrictForecastResponse(BaseModel):
    """
    Response for district-specific forecast query.
    """
    district_id: str = Field(description="Queried district ID.")
    name: str = Field(description="District name.")
    latitude: float = Field(description="Latitude.")
    longitude: float = Field(description="Longitude.")
    coverage_status: str = Field(description="Status of real forecast data for this district.")
    forecast_mode: Optional[str] = Field(default=None, description="Operational forecast mode: 'HISTORICAL_BENCHMARK', 'OPERATIONAL_NWP', 'PROCESSED_DATA_REPLAY', or 'DATA_UNAVAILABLE'.")
    sample_timestamp: Optional[str] = Field(default=None, description="Timestamp of the benchmark sample.")
    forecast: Optional[CombinedForecastResponse] = Field(default=None, description="Consolidated forecast if available.")
    spatial_aggregation: Optional[Dict[str, Any]] = Field(default=None, description="Spatial multi-cell polygon aggregation metrics (mean, max, 75th percentile).")
    message: Optional[str] = Field(default=None, description="Informational message or reason for unavailability.")
    data_status: str = Field(default="HISTORICAL_BENCHMARK", description="Data provenance status.")

    # Real data provenance metadata
    data_source: Optional[str] = Field(default=None, description="Data origin source (e.g., 'NOAA_GFS_0.25').")
    nwp_initialization_time: Optional[str] = Field(default=None, description="NWP model initialization timestamp.")
    forecast_valid_time: Optional[str] = Field(default=None, description="Forecast valid timestamp.")
    forecast_lead_hours: Optional[int] = Field(default=None, description="Forecast lead time in hours.")
    grid_resolution: Optional[str] = Field(default=None, description="Grid resolution.")
    source_latitude: Optional[float] = Field(default=None, description="Source grid cell or aggregation centroid latitude.")
    source_longitude: Optional[float] = Field(default=None, description="Source grid cell or aggregation centroid longitude.")
    predictor_source: Optional[str] = Field(default=None, description="Atmospheric predictor provenance.")
    observation_source: Optional[str] = Field(default=None, description="Ground observation source when verification is involved.")
