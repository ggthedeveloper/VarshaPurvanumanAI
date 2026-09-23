"""
NWP Atmospheric Feature Extractor for SIH26080.
Derives meteorologically grounded atmospheric variables from verified raw NWP forecasts.
"""
import numpy as np
import pandas as pd


class NWPFeatureExtractor:
    """Extracts physical and meteorological predictors from raw GFS forecast fields."""

    @staticmethod
    def extract_features(df: pd.DataFrame) -> pd.DataFrame:
        """
        Derives physical wind components, moisture indicators, and thermodynamic proxies.

        Parameters:
        -----------
        df : pd.DataFrame
            DataFrame containing canonical columns: 'nwp_rainfall', 'temperature_2m',
            'relative_humidity_2m', 'surface_pressure', 'wind_speed_10m',
            'wind_direction_10m', 'cape'.
        """
        out = pd.DataFrame(index=df.index)

        # 1. Base forecast rainfall
        if "nwp_rainfall" in df.columns:
            out["nwp_rainfall"] = df["nwp_rainfall"].astype(float)
            # Log-transformed precipitation to handle positive skewness log(1 + x)
            out["log_nwp_rainfall"] = np.log1p(np.maximum(0.0, df["nwp_rainfall"]))

        # 2. Wind components (meteorological convention: angle is direction wind is blowing FROM)
        if "wind_speed_10m" in df.columns and "wind_direction_10m" in df.columns:
            # Convert wind speed from km/h to m/s
            ws_ms = df["wind_speed_10m"] / 3.6
            rad = np.deg2rad(df["wind_direction_10m"])
            out["wind_speed_ms"] = ws_ms
            # u: eastward component (positive for westerly wind, typical monsoon flow)
            out["u_wind_10m"] = -ws_ms * np.sin(rad)
            # v: northward component (positive for southerly wind)
            out["v_wind_10m"] = -ws_ms * np.cos(rad)

        # 3. Moisture & Thermodynamic Proxies
        if "temperature_2m" in df.columns:
            out["temperature_2m"] = df["temperature_2m"].astype(float)

        if "relative_humidity_2m" in df.columns:
            out["relative_humidity_2m"] = df["relative_humidity_2m"].astype(float)

        if "temperature_2m" in df.columns and "relative_humidity_2m" in df.columns:
            # Dew point depression proxy: T - Td ~ (100 - RH) / 5
            out["dew_point_depression"] = (100.0 - df["relative_humidity_2m"]) / 5.0

        if "surface_pressure" in df.columns:
            out["surface_pressure"] = df["surface_pressure"].astype(float)

        # 4. Convective Instability Proxies
        if "cape" in df.columns:
            cape_vals = np.maximum(0.0, df["cape"].fillna(0.0))
            out["cape"] = cape_vals
            # Theoretical maximum convective updraft velocity: w_max = sqrt(2 * CAPE)
            out["w_max_convective"] = np.sqrt(2.0 * cape_vals)

        return out
