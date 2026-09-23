"""
Temporal Feature Extractor for SIH26080.
Generates cyclical and calendar indicators aligned with Indian Monsoon climatology.
"""
import numpy as np
import pandas as pd


class TemporalFeatureExtractor:
    """Extracts calendar, cyclical, and climatological seasonal features."""

    @staticmethod
    def extract_features(df: pd.DataFrame) -> pd.DataFrame:
        """
        Derives temporal indicators from 'timestamp' and 'forecast_lead_time'.
        """
        out = pd.DataFrame(index=df.index)

        # Parse timestamp to UTC datetime series
        if "timestamp" in df.columns:
            ts = pd.to_datetime(df["timestamp"], utc=True)
            month = ts.dt.month
            day_of_year = ts.dt.dayofyear

            out["month"] = month
            out["day_of_year"] = day_of_year

            # Cyclical encodings
            out["sin_doy"] = np.sin(2.0 * np.pi * day_of_year / 365.25)
            out["cos_doy"] = np.cos(2.0 * np.pi * day_of_year / 365.25)
            out["sin_month"] = np.sin(2.0 * np.pi * month / 12.0)
            out["cos_month"] = np.cos(2.0 * np.pi * month / 12.0)

            # IMD Seasonal Definitions
            # Southwest Monsoon (JJAS)
            out["is_monsoon_season"] = month.isin([6, 7, 8, 9]).astype(int)
            # Peak Core Monsoon (July-August)
            out["is_monsoon_core"] = month.isin([7, 8]).astype(int)
            # Northeast Monsoon (OND: October-December)
            out["is_ne_monsoon"] = month.isin([10, 11, 12]).astype(int)

        # Lead time feature
        if "forecast_lead_time" in df.columns:
            out["forecast_lead_time"] = df["forecast_lead_time"].astype(int)
        elif "forecast_lead_time_days" in df.columns:
            out["forecast_lead_time"] = df["forecast_lead_time_days"].astype(int)

        return out
