"""
Downloader module for NOAA GFS NWP forecasts via verified open endpoints.
"""
import os
import json
import time
from typing import Dict, Any, List, Optional
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import pandas as pd
from .reader import GFSReader
from .validator import GFSValidator


class GFSDownloader:
    """Retrieves operational GFS NWP forecast runs with verified physical variables."""

    DEFAULT_API_URL = "https://previous-runs-api.open-meteo.com/v1/forecast"
    HISTORICAL_API_URL = "https://historical-forecast-api.open-meteo.com/v1/forecast"

    DEFAULT_VARIABLES = [
        "precipitation",
        "temperature_2m",
        "relative_humidity_2m",
        "surface_pressure",
        "wind_speed_10m",
        "wind_direction_10m",
        "cape"
    ]

    def __init__(self, output_dir: str = "data/raw/gfs", timeout: int = 15):
        self.output_dir = output_dir
        self.timeout = timeout
        os.makedirs(self.output_dir, exist_ok=True)

        # Setup requests session with retry logic
        self.session = requests.Session()
        retries = Retry(
            total=3,
            backoff_factor=1.0,
            status_forcelist=[429, 500, 502, 503, 504],
            raise_on_status=False
        )
        self.session.mount("https://", HTTPAdapter(max_retries=retries))

    def fetch_point_forecast(
        self,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: str,
        lead_time_days: int = 1,
        models: str = "gfs_seamless",
        save_raw: bool = True
    ) -> pd.DataFrame:
        """
        Fetches an archived operational GFS forecast for a single coordinate and lead time.

        Parameters:
        -----------
        latitude : float
            Latitude in degrees.
        longitude : float
            Longitude in degrees.
        start_date : str
            YYYY-MM-DD start date.
        end_date : str
            YYYY-MM-DD end date.
        lead_time_days : int
            Forecast lead-day offset (1 = +24h, 2 = +48h, etc.).
        models : str
            NWP model identifier ('gfs_seamless' or 'gfs_global').
        save_raw : bool
            Whether to persist the raw JSON payload to disk.
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date,
            "end_date": end_date,
            "models": models,
            "lead_time_days": lead_time_days,
            "hourly": self.DEFAULT_VARIABLES,
            "timezone": "GMT"
        }

        response = self.session.get(self.DEFAULT_API_URL, params=params, timeout=self.timeout)
        response.raise_for_status()
        data = response.json()

        if save_raw:
            filename = f"gfs_{models}_lat{latitude:.2f}_lon{longitude:.2f}_lead{lead_time_days}d_{start_date}_{end_date}.json"
            filepath = os.path.join(self.output_dir, filename)
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)

        df = GFSReader.from_dict(data, lead_time_days=lead_time_days)
        is_valid, errors = GFSValidator.validate_dataframe(df)
        if not is_valid:
            raise ValueError(f"Ingested GFS DataFrame failed validation: {'; '.join(errors)}")

        return df

    def fetch_grid_forecast(
        self,
        coordinates: List[tuple],
        start_date: str,
        end_date: str,
        lead_time_days: int = 1,
        delay_seconds: float = 0.2
    ) -> pd.DataFrame:
        """
        Fetches forecast data across a list of (latitude, longitude) coordinates.
        """
        frames = []
        for lat, lon in coordinates:
            df_point = self.fetch_point_forecast(
                latitude=lat,
                longitude=lon,
                start_date=start_date,
                end_date=end_date,
                lead_time_days=lead_time_days
            )
            frames.append(df_point)
            if delay_seconds > 0:
                time.sleep(delay_seconds)

        if not frames:
            return pd.DataFrame()

        return pd.concat(frames, ignore_index=True)
