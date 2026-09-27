"""
NASA Global Precipitation Measurement (GPM) IMERG / JAXA GSMaP Provider Adapter.
Provides satellite-gauge merged precipitation observation interface.
"""
from typing import Dict, Any, Optional, Tuple
import pandas as pd
from src.data.base_provider import ObservationProvider


class GPM_IMERG_Provider(ObservationProvider):
    """Adapter for NASA GPM IMERG Final Run (0.1° / 30-min)."""

    def __init__(self, data_dir: str = "data/raw/gpm"):
        self.data_dir = data_dir

    @property
    def provider_name(self) -> str:
        return "NASA_GPM_IMERG_V07"

    def get_observed_rainfall(
        self,
        latitude: float,
        longitude: float,
        target_date: str,
    ) -> Optional[float]:
        """Satellite observation lookup."""
        return None

    def get_gridded_observations(
        self,
        target_date: str,
        bbox: Optional[Tuple[float, float, float, float]] = None,
    ) -> pd.DataFrame:
        """Satellite gridded observation lookup."""
        return pd.DataFrame()

    def get_provenance(self) -> Dict[str, Any]:
        return {
            "source": "NASA Global Precipitation Measurement (GPM)",
            "product": "IMERG Final Run (GPM_3IMERGM)",
            "spatial_resolution_deg": 0.1,
            "temporal_resolution": "Daily accumulated (UTC)",
            "provider": "NASA Goddard Earth Sciences (GES DISC)",
        }
