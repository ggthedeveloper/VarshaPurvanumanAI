"""
Reader module for NOAA GFS NWP forecast responses.
"""
import json
from typing import Dict, Any, Union, Optional
import pandas as pd
from .validator import GFSValidator


class GFSReader:
    """Parses raw GFS forecast payloads into clean, typed DataFrames."""

    @staticmethod
    def from_dict(
        data: Dict[str, Any],
        lead_time_days: int = 1,
        initialization_cycle: str = "00Z"
    ) -> pd.DataFrame:
        """Converts raw dictionary into a structured pandas DataFrame."""
        is_valid, errors = GFSValidator.validate_raw_response(data)
        if not is_valid:
            raise ValueError(f"GFS payload validation failed: {'; '.join(errors)}")

        lat = float(data["latitude"])
        lon = float(data["longitude"])
        hourly = data["hourly"]

        df = pd.DataFrame({
            "timestamp": pd.to_datetime(hourly["time"], utc=True),
            "latitude": lat,
            "longitude": lon,
            "forecast_lead_time_days": int(lead_time_days),
            "initialization_cycle": str(initialization_cycle),
            "precipitation": [float(x) if x is not None else float("nan") for x in hourly.get("precipitation", [])],
            "temperature_2m": [float(x) if x is not None else float("nan") for x in hourly.get("temperature_2m", [])],
            "relative_humidity_2m": [float(x) if x is not None else float("nan") for x in hourly.get("relative_humidity_2m", [])],
            "surface_pressure": [float(x) if x is not None else float("nan") for x in hourly.get("surface_pressure", [])],
            "wind_speed_10m": [float(x) if x is not None else float("nan") for x in hourly.get("wind_speed_10m", [])],
            "wind_direction_10m": [float(x) if x is not None else float("nan") for x in hourly.get("wind_direction_10m", [])],
            "cape": [float(x) if x is not None else float("nan") for x in hourly.get("cape", [])]
        })

        # Calculate forecast valid time
        df["forecast_valid_time"] = df["timestamp"]
        # Initialization timestamp = valid time minus lead time days
        df["forecast_initialization"] = df["timestamp"] - pd.Timedelta(days=lead_time_days)

        return df

    @classmethod
    def from_file(
        cls,
        filepath: str,
        lead_time_days: int = 1,
        initialization_cycle: str = "00Z"
    ) -> pd.DataFrame:
        """Reads a JSON file from disk and parses it into a DataFrame."""
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return cls.from_dict(data, lead_time_days=lead_time_days, initialization_cycle=initialization_cycle)
