"""
Paired Dataset Builder: Merges real NWP forecasts with real IMD observations into canonical schema.
"""
import os
import json
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from ..ingestion.gfs.downloader import GFSDownloader
from ..ingestion.observations.imd_district.downloader import IMDDistrictDownloader
from ..ingestion.observations.imd_district.district_centroids import get_district_coordinates
from .temporal_alignment import TemporalAligner
from .canonical_schema import CanonicalSchemaValidator


class PairedDatasetBuilder:
    """Builds empirical paired NWP-Observation datasets for integration testing and evaluation."""

    def __init__(self, output_dir: str = "data/processed"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        self.gfs_downloader = GFSDownloader()

    def build_district_paired_sample(
        self,
        target_districts: Optional[List[str]] = None,
        lead_time_days: int = 1
    ) -> pd.DataFrame:
        """
        Builds a verified real paired dataset matching IMD district observations
        with NOAA GFS forecasts at a fixed lead time.
        """
        if target_districts is None:
            target_districts = [
                "NAGPUR",      # Central India / Core Monsoon Zone
                "PUNE",        # Western Ghats Leeward
                "MUMBAI",      # Western Coast Windward
                "HYDERABAD",   # South Peninsula
                "BHOPAL",      # Central India
                "LUCKNOW",     # Northern Plains
                "KOLKATA",     # Eastern India
                "CHENNAI"      # Southeast Coast
            ]

        # 1. Fetch live IMD district observations
        district_downloader = IMDDistrictDownloader()
        df_imd = district_downloader.fetch_current_bulletin(save_raw=True)

        # 2. Filter to target districts
        target_districts_upper = [d.upper() for d in target_districts]
        df_target_imd = df_imd[df_imd["district_name"].isin(target_districts_upper)].copy()

        if df_target_imd.empty:
            df_target_imd = df_imd.dropna(subset=["actual_rainfall_mm"]).head(5).copy()

        # Determine observation date
        obs_date = df_target_imd["observation_date"].iloc[0]
        start_date = pd.to_datetime(obs_date) - pd.Timedelta(days=1)
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = obs_date

        paired_rows = []

        for _, row in df_target_imd.iterrows():
            d_name = row["district_name"]
            d_id = row["district_id"]
            actual_rf = row["actual_rainfall_mm"]

            # Lookup WGS84 coordinates
            coords = get_district_coordinates(d_name)
            if coords is None:
                continue

            lat, lon = coords

            # 3. Fetch real GFS forecast for this location and lead time
            try:
                df_gfs_hourly = self.gfs_downloader.fetch_point_forecast(
                    latitude=lat,
                    longitude=lon,
                    start_date=start_date_str,
                    end_date=end_date_str,
                    lead_time_days=lead_time_days,
                    save_raw=True
                )

                # 4. Temporally aggregate to IMD 24-hour observation cycle
                df_gfs_daily = TemporalAligner.aggregate_to_imd_observation_day(
                    df_hourly_gfs=df_gfs_hourly,
                    lead_time_days=lead_time_days
                )

                # Match on observation_date
                match_day = df_gfs_daily[df_gfs_daily["observation_date"] == obs_date]
                if match_day.empty:
                    match_day = df_gfs_daily.tail(1)

                if not match_day.empty:
                    nwp_rain = float(match_day["nwp_rainfall"].iloc[0])
                    init_time = match_day["forecast_initialization"].iloc[0]
                    valid_time = match_day["forecast_valid_time"].iloc[0]

                    paired_record = {
                        "timestamp": pd.to_datetime(obs_date, utc=True),
                        "latitude": float(lat),
                        "longitude": float(lon),
                        "district_name": str(d_name),
                        "district_id": str(d_id),
                        "forecast_initialization": init_time,
                        "forecast_valid_time": valid_time,
                        "forecast_lead_time": int(lead_time_days),
                        "nwp_rainfall": nwp_rain,
                        "observed_rainfall": float(actual_rf) if pd.notna(actual_rf) else np.nan
                    }

                    # Add physical atmospheric predictors if available
                    for pred in ["temperature_2m", "relative_humidity_2m", "surface_pressure", "wind_speed_10m", "wind_direction_10m", "cape_mean", "cape_max"]:
                        if pred in match_day.columns:
                            paired_record[pred] = float(match_day[pred].iloc[0])

                    paired_rows.append(paired_record)
            except Exception as e:
                print(f"Warning: Failed to fetch GFS for {d_name} ({lat}, {lon}): {e}")

        df_paired = pd.DataFrame(paired_rows)

        if not df_paired.empty:
            if "cape_mean" in df_paired.columns and "cape" not in df_paired.columns:
                df_paired["cape"] = df_paired["cape_mean"]

            is_valid, errors = CanonicalSchemaValidator.validate(df_paired)
            if not is_valid:
                raise ValueError(f"Paired dataset failed canonical schema validation: {'; '.join(errors)}")

            # Save sample paired dataset
            out_csv = os.path.join(self.output_dir, "sample_paired_dataset.csv")
            df_paired.to_csv(out_csv, index=False)

            # Save detailed provenance metadata
            meta_path = os.path.join("data/metadata", "sample_paired_dataset_provenance.json")
            metadata = {
                "dataset_name": "Sample Real Paired NWP-Observation Dataset",
                "creation_timestamp_utc": pd.Timestamp.now(tz="UTC").isoformat(),
                "nwp_source": "NOAA NCEP GFS 0.25 Operational Numerical Forecasts (via Open-Meteo)",
                "observation_source": "IMD Official Daily District Rainfall Bulletin (mausam.imd.gov.in)",
                "observation_date": obs_date,
                "lead_time_days": lead_time_days,
                "record_count": len(df_paired),
                "matched_districts": df_paired["district_name"].tolist(),
                "columns": df_paired.columns.tolist(),
                "summary_statistics": {
                    "nwp_rainfall_min": float(df_paired["nwp_rainfall"].min()),
                    "nwp_rainfall_max": float(df_paired["nwp_rainfall"].max()),
                    "nwp_rainfall_mean": float(df_paired["nwp_rainfall"].mean()),
                    "observed_rainfall_min": float(df_paired["observed_rainfall"].dropna().min()) if df_paired["observed_rainfall"].dropna().any() else 0.0,
                    "observed_rainfall_max": float(df_paired["observed_rainfall"].dropna().max()) if df_paired["observed_rainfall"].dropna().any() else 0.0,
                    "observed_rainfall_mean": float(df_paired["observed_rainfall"].dropna().mean()) if df_paired["observed_rainfall"].dropna().any() else 0.0
                }
            }
            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=2)

        return df_paired
