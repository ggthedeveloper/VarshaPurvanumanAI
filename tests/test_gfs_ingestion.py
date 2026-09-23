"""
Unit tests for GFS NWP ingestion package.
"""
import os
import json
import pytest
import pandas as pd
from src.ingestion.gfs.validator import GFSValidator
from src.ingestion.gfs.reader import GFSReader
from src.ingestion.gfs.subsetter import GFSSubsetter


@pytest.fixture
def sample_gfs_payload():
    filepath = "data/raw/gfs/sample_gfs_response.json"
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    # Minimal mock conforming to GFS schema
    times = [f"2024-07-15T{h:02d}:00" for h in range(24)]
    return {
        "latitude": 21.15,
        "longitude": 79.10,
        "hourly": {
            "time": times,
            "precipitation": [0.5] * 24,
            "temperature_2m": [28.0] * 24,
            "relative_humidity_2m": [85.0] * 24,
            "surface_pressure": [1002.0] * 24,
            "wind_speed_10m": [12.0] * 24,
            "wind_direction_10m": [250.0] * 24,
            "cape": [1400.0] * 24
        }
    }


def test_gfs_validator_raw(sample_gfs_payload):
    is_valid, errors = GFSValidator.validate_raw_response(sample_gfs_payload)
    assert is_valid is True, f"Raw GFS validation failed: {errors}"


def test_gfs_reader(sample_gfs_payload):
    df = GFSReader.from_dict(sample_gfs_payload, lead_time_days=1)
    assert not df.empty
    assert len(df) == len(sample_gfs_payload["hourly"]["time"])
    assert "precipitation" in df.columns
    assert "cape" in df.columns
    assert df["forecast_lead_time_days"].iloc[0] == 1


def test_gfs_subsetter(sample_gfs_payload):
    df = GFSReader.from_dict(sample_gfs_payload, lead_time_days=1)
    # Subset matching coordinates
    sub = GFSSubsetter.subset_bounding_box(df, lat_min=20.0, lat_max=22.0, lon_min=78.0, lon_max=80.0)
    assert len(sub) == len(df)

    # Subset outside coordinates
    sub_out = GFSSubsetter.subset_bounding_box(df, lat_min=10.0, lat_max=12.0, lon_min=70.0, lon_max=72.0)
    assert len(sub_out) == 0
