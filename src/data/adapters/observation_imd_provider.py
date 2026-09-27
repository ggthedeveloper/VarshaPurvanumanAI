"""
IMD Gridded and Station Observation Provider for VarshaPurvanumanAI.
Wraps IMDGriddedBenchmarkReader and IMDBinaryGrdAdapter.
"""
import os
from typing import Dict, Any, Optional, Tuple
import pandas as pd

from src.data.base_provider import ObservationProvider
from src.ingestion.observations.imd_gridded.benchmark_reader import IMDGriddedBenchmarkReader
from src.ingestion.observations.imd_gridded.binary_grd_adapter import IMDBinaryGrdAdapter


class IMD_Observation_Provider(ObservationProvider):
    """Concrete Observation Provider for India Meteorological Department ground truth."""

    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.benchmark_reader = IMDGriddedBenchmarkReader(
            raw_dir=os.path.join(data_dir, "raw", "imd_gridded")
        )
        self.binary_adapter = IMDBinaryGrdAdapter()
        self._df_benchmark: Optional[pd.DataFrame] = None

    @property
    def provider_name(self) -> str:
        return "IMD_PUNE_NDC_OBSERVATION"

    def _get_df(self) -> Optional[pd.DataFrame]:
        if self._df_benchmark is None:
            path = os.path.join(self.data_dir, "processed", "gridded_monsoon_benchmark.csv")
            if os.path.exists(path):
                self._df_benchmark = pd.read_csv(path)
        return self._df_benchmark

    def get_observed_rainfall(
        self,
        latitude: float,
        longitude: float,
        target_date: str,
    ) -> Optional[float]:
        """Returns verified daily rainfall in mm for given coordinate and date."""
        df = self._get_df()
        if df is None or df.empty:
            return None

        # Check for matching grid node within 0.15 degrees
        mask = (
            (df["timestamp"].str.startswith(target_date)) &
            ((df["latitude"] - latitude).abs() <= 0.15) &
            ((df["longitude"] - longitude).abs() <= 0.15)
        )
        sub = df[mask]
        if not sub.empty:
            obs = sub["observed_rainfall"].dropna()
            if not obs.empty:
                return float(obs.iloc[0])
        return None

    def get_gridded_observations(
        self,
        target_date: str,
        bbox: Optional[Tuple[float, float, float, float]] = None,
    ) -> pd.DataFrame:
        """Returns 2D gridded observations for the Western Ghats domain."""
        df = self._get_df()
        if df is None or df.empty:
            return pd.DataFrame()

        mask = df["timestamp"].str.startswith(target_date)
        if bbox:
            min_lat, min_lon, max_lat, max_lon = bbox
            mask = mask & (
                (df["latitude"] >= min_lat) & (df["latitude"] <= max_lat) &
                (df["longitude"] >= min_lon) & (df["longitude"] <= max_lon)
            )
        return df[mask][["timestamp", "latitude", "longitude", "observed_rainfall", "district_name"]]

    def fetch_observed_grid(
        self,
        bbox: Optional[Tuple[float, float, float, float]] = None,
        valid_date: Optional[str] = None,
        target_date: Optional[str] = None,
    ) -> pd.DataFrame:
        """Alias for get_gridded_observations accepting bbox and valid_date."""
        date = target_date or valid_date or ""
        return self.get_gridded_observations(target_date=date, bbox=bbox)

    def get_provenance(self) -> Dict[str, Any]:
        return {
            "source": "India Meteorological Department (IMD) Pune National Data Centre",
            "doi": "10.5281/zenodo.20177433",
            "citation": "Pai et al. (2014) / Western Ghats High-Resolution Gridded Daily Rainfall",
            "grid_resolution_deg": 0.25,
            "verification_period": "2021-2024 Monsoon Seasons (June-September)",
            "license": "Open Data / Academic Research Use",
        }
