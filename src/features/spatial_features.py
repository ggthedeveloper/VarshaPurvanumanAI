"""
Spatial Feature Extractor for SIH26080.
Generates geographic, regional climatological zone, and maritime proximity features.
"""
from typing import Optional
import numpy as np
import pandas as pd


class SpatialFeatureExtractor:
    """Extracts geographic coordinates and official meteorological regional zone indicators."""

    # Official Core Monsoon Zone (CMZ) boundaries (Rajeevan et al. 2008, Pai et al. 2014)
    CMZ_BOUNDS = {"lat_min": 18.0, "lat_max": 28.0, "lon_min": 65.0, "lon_max": 88.0}

    # Western Ghats Coastal/Orographic belt
    WG_BOUNDS = {"lat_min": 8.0, "lat_max": 20.0, "lon_min": 72.0, "lon_max": 77.0}

    # Northeast Orographic Zone (Meghalaya, Assam hills)
    NE_BOUNDS = {"lat_min": 22.0, "lat_max": 28.0, "lon_min": 89.0, "lon_max": 97.0}

    # Representative coastline nodes for distance approximation (Lat, Lon)
    COASTLINE_NODES = np.array([
        [22.8, 69.0], [21.5, 69.5], [20.8, 70.4], [21.1, 72.6], [19.0, 72.8],
        [15.5, 73.8], [12.9, 74.8], [9.9, 76.3], [8.1, 77.5], [10.8, 79.8],
        [13.1, 80.3], [16.5, 82.0], [17.7, 83.3], [19.8, 85.8], [21.6, 87.5]
    ])

    @classmethod
    def extract_features(cls, df: pd.DataFrame) -> pd.DataFrame:
        """
        Derives spatial indicators from 'latitude' and 'longitude'.
        """
        out = pd.DataFrame(index=df.index)

        if "latitude" not in df.columns or "longitude" not in df.columns:
            return out

        lats = df["latitude"].astype(float)
        lons = df["longitude"].astype(float)

        out["latitude"] = lats
        out["longitude"] = lons

        # Meteorological regional indicators
        out["in_core_monsoon_zone"] = (
            (lats >= cls.CMZ_BOUNDS["lat_min"]) & (lats <= cls.CMZ_BOUNDS["lat_max"]) &
            (lons >= cls.CMZ_BOUNDS["lon_min"]) & (lons <= cls.CMZ_BOUNDS["lon_max"])
        ).astype(int)

        out["in_western_ghats_belt"] = (
            (lats >= cls.WG_BOUNDS["lat_min"]) & (lats <= cls.WG_BOUNDS["lat_max"]) &
            (lons >= cls.WG_BOUNDS["lon_min"]) & (lons <= cls.WG_BOUNDS["lon_max"])
        ).astype(int)

        out["in_northeast_hills"] = (
            (lats >= cls.NE_BOUNDS["lat_min"]) & (lats <= cls.NE_BOUNDS["lat_max"]) &
            (lons >= cls.NE_BOUNDS["lon_min"]) & (lons <= cls.NE_BOUNDS["lon_max"])
        ).astype(int)

        # Distance to coast calculation (Haversine approximation to nearest coastline node in km)
        coords = np.column_stack([np.radians(lats.values), np.radians(lons.values)])
        coast_rad = np.radians(cls.COASTLINE_NODES)

        d_coast_km = []
        for p in coords:
            # Vectorized Haversine to all coastline nodes
            dlat = coast_rad[:, 0] - p[0]
            dlon = coast_rad[:, 1] - p[1]
            a = np.sin(dlat / 2.0)**2 + np.cos(p[0]) * np.cos(coast_rad[:, 0]) * np.sin(dlon / 2.0)**2
            c = 2.0 * np.arcsin(np.minimum(1.0, np.sqrt(a)))
            d_km = np.min(6371.0 * c)
            d_coast_km.append(d_km)

        out["dist_to_coast_approx_km"] = np.round(d_coast_km, 1)

        return out
