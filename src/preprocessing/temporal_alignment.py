"""
Temporal alignment module for synchronizing NWP forecast cycles with IMD 24-hour observation windows.
"""
from typing import List, Optional
import pandas as pd
import numpy as np


class TemporalAligner:
    """
    Synchronizes hourly NWP forecasts with the official IMD daily observation cycle:
    - IMD observation day D corresponds to 24-hour accumulation ending at 08:30 IST (03:00 UTC) on date D.
    - Accumulation window: from 03:01 UTC on (D-1) to 03:00 UTC on D (24 hours).
    """

    @staticmethod
    def aggregate_to_imd_observation_day(
        df_hourly_gfs: pd.DataFrame,
        lead_time_days: int = 1
    ) -> pd.DataFrame:
        """
        Aggregates hourly GFS predictions into 24-hour IMD observation days.

        Parameters:
        -----------
        df_hourly_gfs : pd.DataFrame
            Hourly GFS DataFrame containing 'timestamp', 'latitude', 'longitude', 'precipitation', etc.
        lead_time_days : int
            Forecast lead time in days.

        Returns:
        --------
        pd.DataFrame
            Aggregated daily DataFrame aligned with IMD observation dates.
        """
        if df_hourly_gfs.empty:
            return pd.DataFrame()

        df = df_hourly_gfs.copy()
        if not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
            df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)

        # The IMD observation day D covers (03:00 UTC on D-1, 03:00 UTC on D].
        shifted_dates = (df["timestamp"] - pd.Timedelta(hours=3, seconds=1)).dt.date + pd.Timedelta(days=1)
        df["observation_date"] = shifted_dates.astype(str)

        group_cols = ["observation_date", "latitude", "longitude"]
        agg_dict = {
            "precipitation": "sum",
            "temperature_2m": "mean",
            "relative_humidity_2m": "mean",
            "surface_pressure": "mean",
            "wind_speed_10m": "max",
            "wind_direction_10m": "mean",
            "cape": "mean",
            "timestamp": "count"
        }

        effective_agg = {k: v for k, v in agg_dict.items() if k in df.columns}
        grouped = df.groupby(group_cols).agg(effective_agg).reset_index()

        # Rename precipitation to nwp_rainfall
        if "precipitation" in grouped.columns:
            grouped = grouped.rename(columns={"precipitation": "nwp_rainfall"})

        # Only retain days with complete 24-hour coverage (allow 23 or 24 for boundary tolerance)
        if "timestamp" in grouped.columns:
            grouped = grouped[grouped["timestamp"] >= 23].drop(columns=["timestamp"])

        grouped["forecast_lead_time_days"] = lead_time_days
        grouped["forecast_valid_time"] = pd.to_datetime(grouped["observation_date"], utc=True) + pd.Timedelta(hours=3)
        grouped["forecast_initialization"] = grouped["forecast_valid_time"] - pd.Timedelta(days=lead_time_days)

        return grouped
