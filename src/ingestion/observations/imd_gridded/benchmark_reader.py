"""
Reader for IMD 0.25° Western Ghats Gridded Benchmark from Zenodo (DOI: 10.5281/zenodo.20177433).
"""
import os
import requests
import pandas as pd
import numpy as np
from .validator import IMDGriddedValidator
from ..metadata import ObservationMetadataTracker


class IMDGriddedBenchmarkReader:
    """Ingests and validates the verified IMD 0.25° Western Ghats benchmark dataset."""

    ZENODO_BASE_URL = "https://zenodo.org/records/20177433/files"
    DATE_FILENAME = "Daily_Date_0.25x0.25Grid.xlsx"
    GRID_FILENAME = "Daily_IMD_0.25x0.25Grid.xlsx"

    def __init__(self, raw_dir: str = "data/raw/imd_gridded"):
        self.raw_dir = raw_dir
        os.makedirs(self.raw_dir, exist_ok=True)
        self.tracker = ObservationMetadataTracker()

    def _ensure_file(self, filename: str) -> str:
        """Downloads file from Zenodo if not present locally."""
        filepath = os.path.join(self.raw_dir, filename)
        if not os.path.exists(filepath) or os.path.getsize(filepath) < 1000:
            url = f"{self.ZENODO_BASE_URL}/{filename}?download=1"
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            with open(filepath, "wb") as f:
                f.write(response.content)
        return filepath

    def load_dataset(self) -> pd.DataFrame:
        """Loads and parses the 0.25° benchmark dataset into a date-indexed DataFrame."""
        date_path = self._ensure_file(self.DATE_FILENAME)
        grid_path = self._ensure_file(self.GRID_FILENAME)

        df_dates = pd.read_excel(date_path)
        # Parse dates (YYYYMMDD)
        date_series = pd.to_datetime(df_dates.iloc[:, 0].astype(str), format="%Y%m%d")

        df_grid = pd.read_excel(grid_path, header=None)
        # Column names: grid_0 to grid_35
        df_grid.columns = [f"grid_node_{i:02d}" for i in range(df_grid.shape[1])]

        # Replace missing value code -9999 with NaN
        df_grid = df_grid.replace(-9999.0, np.nan).replace(-9999, np.nan)

        # Assign date column
        df_grid.insert(0, "date", date_series)

        is_valid, errors = IMDGriddedValidator.validate(df_grid)
        if not is_valid:
            raise ValueError(f"Benchmark gridded validation failed: {'; '.join(errors)}")

        self.tracker.record_provenance(
            dataset_name="IMD 0.25 Western Ghats Benchmark",
            provider="IMD Pune / Zenodo Mirror (DOI: 10.5281/zenodo.20177433)",
            source_url=f"{self.ZENODO_BASE_URL}/{self.GRID_FILENAME}",
            spatial_resolution="0.25° x 0.25° (36 grid nodes over Western Ghats)",
            temporal_resolution="Daily (08:30 IST accumulation)",
            variables=["rainfall"],
            units={"rainfall": "mm/day"},
            record_count=len(df_grid),
            raw_filepath=grid_path,
            notes=f"Temporal range: {df_grid['date'].min().strftime('%Y-%m-%d')} to {df_grid['date'].max().strftime('%Y-%m-%d')}."
        )

        return df_grid
