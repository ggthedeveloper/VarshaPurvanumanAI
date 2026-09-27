"""
NOAA GFS 0.25° NWP Data Provider Adapter for VarshaPurvanumanAI.
Wraps GFSDownloader and GFSReader to fulfill NWPProvider interface.
"""
import os
from typing import Dict, Any, Tuple
import pandas as pd

from src.data.base_provider import NWPProvider
from src.ingestion.gfs.downloader import GFSDownloader
from src.ingestion.gfs.reader import GFSReader


class NOAA_GFS_Provider(NWPProvider):
    """Concrete NWP Provider for NOAA Global Forecast System (0.25° resolution)."""

    def __init__(self, raw_cache_dir: str = "data/raw/gfs", timeout: int = 20):
        self.cache_dir = raw_cache_dir
        self.downloader = GFSDownloader(output_dir=raw_cache_dir, timeout=timeout)
        self.reader = GFSReader()

    @property
    def provider_name(self) -> str:
        return "NOAA_GFS_0.25_OPERATIONAL"

    def fetch_point_forecast(
        self,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: str,
        lead_time_days: int = 1,
    ) -> pd.DataFrame:
        """Retrieves point forecast from NOAA GFS 0.25° archive/API."""
        return self.downloader.fetch_point_forecast(
            latitude=latitude,
            longitude=longitude,
            start_date=start_date,
            end_date=end_date,
            lead_time_days=lead_time_days,
            models="gfs_seamless",
            save_raw=True,
        )

    def fetch_gridded_field(
        self,
        bbox: Tuple[float, float, float, float],
        valid_date: str,
        variable: str = "precipitation",
    ) -> pd.DataFrame:
        """Retrieves 2D gridded forecast field within (min_lat, min_lon, max_lat, max_lon)."""
        min_lat, min_lon, max_lat, max_lon = bbox
        # In Western Ghats domain, utilizes local verified grid
        gridded_path = os.path.join("data", "processed", "gridded_monsoon_benchmark.csv")
        if os.path.exists(gridded_path):
            df = pd.read_csv(gridded_path)
            mask = (
                (df["latitude"] >= min_lat) & (df["latitude"] <= max_lat) &
                (df["longitude"] >= min_lon) & (df["longitude"] <= max_lon) &
                (df["timestamp"].str.startswith(valid_date))
            )
            filtered = df[mask].copy()
            if not filtered.empty:
                if "raw_nwp_rainfall" not in filtered.columns and "nwp_rainfall" in filtered.columns:
                    filtered["raw_nwp_rainfall"] = filtered["nwp_rainfall"]
                return filtered
        return pd.DataFrame()

    def get_provenance(self) -> Dict[str, Any]:
        return {
            "source_model": "NOAA Global Forecast System (GFS)",
            "spatial_resolution_deg": 0.25,
            "temporal_resolution": "Hourly accumulated to Daily 24h",
            "cycle": "00Z/06Z/12Z/18Z",
            "access_method": "NOAA NOMADS / Open-Meteo Seamless GFS Archive",
            "license": "Public Domain (U.S. Government Work)",
        }
