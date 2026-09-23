"""
Standardized adapter for user-provided IMD Pune national binary gridded (.grd) files.
"""
import os
import glob
from typing import Optional, Dict, Any, Tuple
import numpy as np
import pandas as pd


class IMDBinaryGrdAdapter:
    """
    Adapter for IMD Pune 0.25° x 0.25° daily gridded binary rainfall files.
    Specifications (Pai et al., 2014):
    - Grid size: 135 (longitudes) x 129 (latitudes) = 17,415 points per day.
    - Longitude: 66.5°E to 100.0°E (0.25° step)
    - Latitude: 6.5°N to 38.5°N (0.25° step)
    - Format: IEEE 32-bit float (4 bytes per point, little-endian)
    - Missing value code: -999.0
    """

    NX = 135
    NY = 129
    POINTS_PER_DAY = NX * NY  # 17415
    BYTES_PER_DAY = POINTS_PER_DAY * 4  # 69660
    MISSING_VALUE = -999.0

    LONS = np.linspace(66.5, 100.0, NX)
    LATS = np.linspace(6.5, 38.5, NY)

    def __init__(self, user_dir: str = "data/raw/imd_gridded/user_provided"):
        self.user_dir = user_dir
        os.makedirs(self.user_dir, exist_ok=True)

    def check_availability(self) -> Tuple[bool, str]:
        """Checks whether valid user-supplied .grd files exist."""
        files = glob.glob(os.path.join(self.user_dir, "*.grd")) + glob.glob(os.path.join(self.user_dir, "*.GRD"))
        if not files:
            msg = (
                "IMD DATA NOT LOCALLY AVAILABLE: No binary (.grd) files found in "
                f"'{self.user_dir}'. To use national IMD gridded observations, place "
                "annual binary files (e.g., 'Rainfall_ind2023.grd') into this directory."
            )
            return False, msg
        return True, f"Found {len(files)} user-provided IMD .grd file(s)."

    def read_year_file(self, filepath: str, year: int) -> pd.DataFrame:
        """Reads a single annual IMD binary file and returns daily rainfall grids."""
        is_avail, msg = self.check_availability()
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"IMD binary file not found: {filepath}. Status: {msg}")

        filesize = os.path.getsize(filepath)
        days = filesize // self.BYTES_PER_DAY
        if filesize % self.BYTES_PER_DAY != 0:
            raise ValueError(f"Corrupted IMD binary file '{filepath}'. File size {filesize} is not a multiple of {self.BYTES_PER_DAY}.")

        raw_data = np.fromfile(filepath, dtype=np.float32)
        raw_data = raw_data.reshape((days, self.NY, self.NX))

        # Convert missing value -999.0 to NaN
        raw_data[raw_data == self.MISSING_VALUE] = np.nan

        dates = pd.date_range(start=f"{year}-01-01", periods=days, freq="D")
        return pd.DataFrame({
            "date": dates,
            "days_loaded": days,
            "mean_subcontinent_rainfall": np.nanmean(raw_data, axis=(1, 2))
        })
