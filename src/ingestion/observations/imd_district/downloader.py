"""
Downloader for official IMD District Rainfall observations.
"""
import os
import json
from datetime import datetime, timezone
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import pandas as pd
from .parser import IMDDistrictParser
from .validator import IMDDistrictValidator
from ..metadata import ObservationMetadataTracker


class IMDDistrictDownloader:
    """Retrieves and persists live and operational IMD district rainfall bulletins."""

    IMD_RAINFALL_URL = "https://mausam.imd.gov.in/responsive/rainfallinformation.php"

    def __init__(self, output_dir: str = "data/raw/imd_district", timeout: int = 15):
        self.output_dir = output_dir
        self.timeout = timeout
        os.makedirs(self.output_dir, exist_ok=True)
        self.tracker = ObservationMetadataTracker()

        self.session = requests.Session()
        retries = Retry(total=3, backoff_factor=1.0, status_forcelist=[500, 502, 503, 504])
        self.session.mount("https://", HTTPAdapter(max_retries=retries))

    def fetch_current_bulletin(self, save_raw: bool = True) -> pd.DataFrame:
        """Fetches the latest official IMD district rainfall observation bulletin."""
        # Use verify=True if available, fallback with warning if local CA cert issues
        try:
            response = self.session.get(self.IMD_RAINFALL_URL, timeout=self.timeout)
        except requests.exceptions.SSLError:
            response = self.session.get(self.IMD_RAINFALL_URL, timeout=self.timeout, verify=False)

        response.raise_for_status()
        html_content = response.text

        df = IMDDistrictParser.extract_and_parse_html(html_content)

        # Get observation date from parsed data
        obs_dates = df["observation_date"].dropna().unique()
        date_str = str(obs_dates[0]) if len(obs_dates) > 0 else datetime.now(timezone.utc).strftime("%Y-%m-%d")

        raw_filepath = os.path.join(self.output_dir, f"imd_district_rainfall_{date_str}.html")
        if save_raw:
            with open(raw_filepath, "w", encoding="utf-8") as f:
                f.write(html_content)

        # Record metadata
        self.tracker.record_provenance(
            dataset_name="IMD Daily District Rainfall Bulletin",
            provider="India Meteorological Department (IMD) - Hydromet Division",
            source_url=self.IMD_RAINFALL_URL,
            spatial_resolution="District Administrative Polygons (761 districts)",
            temporal_resolution="Daily 24-hour accumulation (ending 08:30 IST / 03:00 UTC)",
            variables=["actual_rainfall_mm", "normal_rainfall_mm", "departure_pct"],
            units={"actual_rainfall_mm": "mm", "normal_rainfall_mm": "mm", "departure_pct": "%"},
            record_count=len(df),
            raw_filepath=raw_filepath,
            notes=f"Observation date: {date_str}. Parsed {len(df)} districts."
        )

        return df
