"""
Extensible Data Provider Interfaces for India-Wide Meteorological Intelligence (SIH26080).
Defines abstract base classes for NWP forecasts, gridded/station observations,
atmospheric soundings, district boundaries, and climatological normals.
Enforces zero data fabrication and strict provenance metadata.
"""
from abc import ABC, abstractmethod
from enum import Enum
from typing import Dict, Any, List, Optional, Tuple, Union
from datetime import datetime
import pandas as pd
import geopandas as gpd


class DataStatus(str, Enum):
    """Authoritative scientific verification and availability status."""
    VALIDATED_FORECAST = "VALIDATED_FORECAST"
    FORECAST_AVAILABLE_UNVERIFIED = "FORECAST_AVAILABLE_UNVERIFIED"
    DATA_UNAVAILABLE = "DATA_UNAVAILABLE"
    OBSERVATION_UNAVAILABLE = "OBSERVATION_UNAVAILABLE"


class ForecastProduct(ABC):
    """Data container for standardized forecast output."""
    pass


class NWPProvider(ABC):
    """Abstract provider for Numerical Weather Prediction (NWP) model outputs."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the NWP modeling system (e.g., 'NOAA_GFS_0.25', 'ECMWF_IFS_0.1')."""
        pass

    @abstractmethod
    def fetch_point_forecast(
        self,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: str,
        lead_time_days: int = 1,
    ) -> pd.DataFrame:
        """Retrieves point forecast time series with atmospheric variables."""
        pass

    @abstractmethod
    def fetch_gridded_field(
        self,
        bbox: Tuple[float, float, float, float],
        valid_date: str,
        variable: str = "precipitation",
    ) -> pd.DataFrame:
        """Retrieves 2D gridded forecast field within (min_lat, min_lon, max_lat, max_lon)."""
        pass

    @abstractmethod
    def get_provenance(self) -> Dict[str, Any]:
        """Returns provenance metadata including grid resolution, cycle, and provider URL."""
        pass


class ObservationProvider(ABC):
    """Abstract provider for observed rainfall ground truth."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of observation source (e.g., 'IMD_GRIDDED_0.25', 'IMD_STATION', 'GPM_IMERG')."""
        pass

    @abstractmethod
    def get_observed_rainfall(
        self,
        latitude: float,
        longitude: float,
        target_date: str,
    ) -> Optional[float]:
        """Returns verified daily rainfall accumulation in mm, or None if unobserved."""
        pass

    @abstractmethod
    def get_gridded_observations(
        self,
        target_date: str,
        bbox: Optional[Tuple[float, float, float, float]] = None,
    ) -> pd.DataFrame:
        """Returns gridded observed rainfall records."""
        pass

    @abstractmethod
    def get_provenance(self) -> Dict[str, Any]:
        """Returns observational provenance metadata."""
        pass


class AtmosphericDataProvider(ABC):
    """Abstract provider for vertical atmospheric soundings and synoptic predictors."""

    @abstractmethod
    def get_synoptic_predictors(
        self,
        latitude: float,
        longitude: float,
        target_datetime: Union[str, datetime],
    ) -> Dict[str, float]:
        """
        Retrieves synoptic predictors for weather regime classification:
        geopotential_height, surface_pressure, u_wind, v_wind, humidity, cape, etc.
        """
        pass


class DistrictBoundaryProvider(ABC):
    """Abstract provider for authoritative administrative boundaries."""

    @abstractmethod
    def get_all_districts(self) -> List[Dict[str, Any]]:
        """Returns catalog of all administrative districts with metadata and centroids."""
        pass

    @abstractmethod
    def get_district_polygon(self, district_id: str) -> Optional[gpd.GeoDataFrame]:
        """Returns district MultiPolygon boundary geometry."""
        pass

    @abstractmethod
    def get_state_districts(self, state_name: str) -> List[Dict[str, Any]]:
        """Returns all constituent districts belonging to a given State / UT."""
        pass


class ClimatologyProvider(ABC):
    """Abstract provider for long-term climatological rainfall normals (e.g., IMD 1981-2010)."""

    @abstractmethod
    def get_climatological_normal(
        self,
        district_id: str,
        month: int,
        day: Optional[int] = None,
    ) -> Optional[float]:
        """Returns long-period average daily/monthly rainfall in mm for anomaly calculations."""
        pass
