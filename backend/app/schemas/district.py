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
    coverage_status: str = Field(description="'BENCHMARK_ACTIVE' or 'REFERENCE_ONLY'.")


class DistrictListResponse(BaseModel):
    """
    List of verified Indian administrative districts.
    """
    total_districts: int = Field(description="Total count of verified district entries.")
    active_districts: int = Field(description="Count of districts with active live/benchmark data.")
    districts: List[DistrictItem] = Field(description="Array of district entities.")
    data_status: str = Field(default="REAL_DATA", description="Data provenance status.")


class DistrictForecastResponse(BaseModel):
    """
    Response for district-specific forecast query.
    """
    district_id: str = Field(description="Queried district ID.")
    name: str = Field(description="District name.")
    latitude: float = Field(description="Latitude.")
    longitude: float = Field(description="Longitude.")
    coverage_status: str = Field(description="Status of real forecast data for this district.")
    forecast: Optional[CombinedForecastResponse] = Field(default=None, description="Consolidated forecast if available.")
    message: Optional[str] = Field(default=None, description="Informational message or reason for unavailability.")
    data_status: str = Field(default="REAL_DATA", description="Data provenance status.")
