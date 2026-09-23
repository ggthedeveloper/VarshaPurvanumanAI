"""
Unit tests for TemporalAligner.
"""
import pytest
import pandas as pd
import numpy as np
from src.preprocessing.temporal_alignment import TemporalAligner


def test_temporal_alignment_24h_accumulation():
    # Construct 48 hours of GFS data from 2024-07-14 00:00 to 2024-07-15 23:00 UTC
    times = pd.date_range("2024-07-14 00:00", "2024-07-15 23:00", freq="h", tz="UTC")
    df_hourly = pd.DataFrame({
        "timestamp": times,
        "latitude": 21.0,
        "longitude": 78.0,
        "precipitation": 1.0,  # 1.0 mm each hour
        "temperature_2m": 30.0,
        "relative_humidity_2m": 80.0,
        "surface_pressure": 1005.0,
        "wind_speed_10m": 15.0,
        "wind_direction_10m": 240.0,
        "cape": 1200.0
    })

    df_daily = TemporalAligner.aggregate_to_imd_observation_day(df_hourly, lead_time_days=1)
    assert not df_daily.empty

    # The 24-hour window ending at 03:00 UTC on 2024-07-15 includes:
    # 2024-07-14 04:00 UTC through 2024-07-15 03:00 UTC (24 hours * 1.0 mm = 24.0 mm)
    match_row = df_daily[df_daily["observation_date"] == "2024-07-15"]
    assert len(match_row) == 1
    assert np.isclose(match_row["nwp_rainfall"].iloc[0], 24.0)
    assert np.isclose(match_row["temperature_2m"].iloc[0], 30.0)
    assert match_row["forecast_lead_time_days"].iloc[0] == 1
