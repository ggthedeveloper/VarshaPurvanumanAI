"""
Spatial and temporal subsetting for GFS NWP forecasts.
"""
from typing import Optional, Dict
import pandas as pd


class GFSSubsetter:
    """Subsets GFS forecast data along spatial and temporal dimensions."""

    @staticmethod
    def subset_bounding_box(
        df: pd.DataFrame,
        lat_min: float,
        lat_max: float,
        lon_min: float,
        lon_max: float
    ) -> pd.DataFrame:
        """Restricts DataFrame to specified latitude/longitude bounding box."""
        mask = (
            (df["latitude"] >= lat_min) &
            (df["latitude"] <= lat_max) &
            (df["longitude"] >= lon_min) &
            (df["longitude"] <= lon_max)
        )
        return df[mask].copy()

    @staticmethod
    def subset_temporal(
        df: pd.DataFrame,
        start_time: str,
        end_time: str
    ) -> pd.DataFrame:
        """Restricts DataFrame to specified datetime range."""
        start_dt = pd.to_datetime(start_time, utc=True)
        end_dt = pd.to_datetime(end_time, utc=True)
        mask = (df["timestamp"] >= start_dt) & (df["timestamp"] <= end_dt)
        return df[mask].copy()

    @staticmethod
    def subset_domain(df: pd.DataFrame, domain_config: Dict[str, float]) -> pd.DataFrame:
        """Subsets using a domain configuration dictionary."""
        return GFSSubsetter.subset_bounding_box(
            df=df,
            lat_min=domain_config["lat_min"],
            lat_max=domain_config["lat_max"],
            lon_min=domain_config["lon_min"],
            lon_max=domain_config["lon_max"]
        )
