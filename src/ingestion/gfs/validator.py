"""
Validator module for NOAA GFS NWP forecast data.
"""
from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np


class GFSValidator:
    """Validates raw and structured GFS NWP forecast outputs."""

    REQUIRED_VARIABLES = [
        "precipitation",
        "temperature_2m",
        "relative_humidity_2m",
        "surface_pressure",
        "wind_speed_10m",
        "wind_direction_10m",
        "cape"
    ]

    PHYSICAL_BOUNDS = {
        "precipitation": (0.0, 1000.0),       # mm
        "temperature_2m": (-50.0, 65.0),      # degC
        "relative_humidity_2m": (0.0, 100.0),  # %
        "surface_pressure": (500.0, 1100.0),  # hPa
        "wind_speed_10m": (0.0, 200.0),       # km/h
        "wind_direction_10m": (0.0, 360.0),   # degrees
        "cape": (0.0, 10000.0)                # J/kg
    }

    @classmethod
    def validate_raw_response(cls, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validates the raw dictionary response from the GFS API."""
        errors = []
        if not isinstance(data, dict):
            return False, ["Raw GFS payload is not a dictionary."]

        # Check coordinates
        if "latitude" not in data or "longitude" not in data:
            errors.append("Missing latitude or longitude in GFS response.")
        else:
            lat = data["latitude"]
            lon = data["longitude"]
            if not (-90.0 <= lat <= 90.0):
                errors.append(f"Invalid latitude {lat}. Must be in [-90, 90].")
            if not (-180.0 <= lon <= 180.0):
                errors.append(f"Invalid longitude {lon}. Must be in [-180, 180].")

        # Check hourly block
        hourly = data.get("hourly")
        if not hourly or not isinstance(hourly, dict):
            errors.append("Missing or non-dictionary 'hourly' block in GFS response.")
            return False, errors

        if "time" not in hourly or len(hourly["time"]) == 0:
            errors.append("Hourly block has no timestamps.")

        # Check required variables
        for var in cls.REQUIRED_VARIABLES:
            if var not in hourly:
                errors.append(f"Required variable '{var}' missing from hourly block.")
            elif len(hourly[var]) != len(hourly.get("time", [])):
                errors.append(f"Length mismatch for variable '{var}': {len(hourly[var])} vs {len(hourly.get('time', []))} timestamps.")

        return len(errors) == 0, errors

    @classmethod
    def validate_dataframe(cls, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """Validates structured GFS DataFrame."""
        errors = []
        if df.empty:
            return False, ["GFS DataFrame is empty."]

        # Check required columns
        expected_cols = ["timestamp", "latitude", "longitude"] + cls.REQUIRED_VARIABLES
        for col in expected_cols:
            if col not in df.columns:
                errors.append(f"Missing column '{col}' in GFS DataFrame.")

        if errors:
            return False, errors

        # Check timestamp ordering
        if not df["timestamp"].is_monotonic_increasing:
            errors.append("Timestamps in GFS DataFrame are not monotonically increasing.")

        # Check duplicates
        if df["timestamp"].duplicated().any():
            errors.append("Duplicate timestamps detected in GFS DataFrame.")

        # Physical range checks
        for var, (v_min, v_max) in cls.PHYSICAL_BOUNDS.items():
            if var in df.columns:
                vals = df[var].dropna()
                if (vals < v_min).any():
                    min_obs = vals.min()
                    errors.append(f"Physical bound violation: {var} has minimum {min_obs} < lower bound {v_min}.")
                if (vals > v_max).any():
                    max_obs = vals.max()
                    errors.append(f"Physical bound violation: {var} has maximum {max_obs} > upper bound {v_max}.")

        # Check for NaN / Inf
        nan_counts = df[cls.REQUIRED_VARIABLES].isna().sum()
        for var, count in nan_counts.items():
            if count > 0:
                errors.append(f"Variable '{var}' contains {count} NaN values.")

        return len(errors) == 0, errors
