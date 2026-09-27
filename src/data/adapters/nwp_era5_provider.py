"""
ECMWF ERA5 / ERA5-Land Reanalysis Data Provider Adapter.
Enables ingestion of reanalysis benchmark atmospheric fields and precipitation.
"""
from typing import Dict, Any, Tuple
import pandas as pd
from src.data.base_provider import NWPProvider


class ERA5_Provider(NWPProvider):
    """Adapter for ECMWF ERA5 (0.25°) and ERA5-Land (0.1°) reanalysis."""

    def __init__(self, data_dir: str = "data/raw/era5"):
        self.data_dir = data_dir

    @property
    def provider_name(self) -> str:
        return "ECMWF_ERA5_REANALYSIS"

    def fetch_point_forecast(
        self,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: str,
        lead_time_days: int = 1,
    ) -> pd.DataFrame:
        """Point reanalysis extraction adapter."""
        # Provider stub ready for CDS API connection or offline GRIB ingestion
        return pd.DataFrame()

    def fetch_gridded_field(
        self,
        bbox: Tuple[float, float, float, float],
        valid_date: str,
        variable: str = "precipitation",
    ) -> pd.DataFrame:
        """Gridded ERA5 spatial extraction."""
        return pd.DataFrame()

    def get_provenance(self) -> Dict[str, Any]:
        return {
            "source_model": "ECMWF ERA5 Reanalysis",
            "spatial_resolution_deg": 0.25,
            "temporal_resolution": "Hourly / Daily",
            "provider": "Copernicus Climate Change Service (C3S)",
            "license": "Copernicus License",
        }


ECMWF_ERA5_Provider = ERA5_Provider
