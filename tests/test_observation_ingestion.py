"""
Unit tests for observation ingestion packages (district and gridded).
"""
import pytest
import pandas as pd
import numpy as np
from src.ingestion.observations.imd_district.validator import IMDDistrictValidator
from src.ingestion.observations.imd_district.parser import IMDDistrictParser
from src.ingestion.observations.imd_gridded.validator import IMDGriddedValidator
from src.ingestion.observations.imd_gridded.binary_grd_adapter import IMDBinaryGrdAdapter


def test_imd_district_parser_and_validator():
    sample_records = [
        {
            "title": "NAGPUR",
            "id": "100",
            "color": "#68DE58",
            "info": "5%",
            "balloonText": "<h6>NAGPUR</h6> <p><em>Date : 2026-09-22</br>Departure : 5%</br>Actual : 12.4 mm</br>Normal : 11.8 mm</em></p>"
        },
        {
            "title": "PUNE",
            "id": "101",
            "color": "#C0C0C0",
            "info": "No Data",
            "balloonText": "<h6>PUNE</h6> <p><em>Date : 2026-09-22</br>Departure : No Data</br>Actual : No data mm</br>Normal : 4.5 mm</em></p>"
        }
    ]

    df = IMDDistrictParser.parse_raw_records(sample_records)
    assert len(df) == 2
    assert df["district_name"].iloc[0] == "NAGPUR"
    assert df["actual_rainfall_mm"].iloc[0] == 12.4
    assert np.isnan(df["actual_rainfall_mm"].iloc[1])

    is_valid, errors = IMDDistrictValidator.validate(df)
    assert is_valid is True, f"District validation failed: {errors}"


def test_imd_binary_grd_adapter_missing_file_handling():
    adapter = IMDBinaryGrdAdapter(user_dir="data/raw/imd_gridded/user_provided")
    is_avail, msg = adapter.check_availability()
    # No files should exist yet
    assert is_avail is False
    assert "IMD DATA NOT LOCALLY AVAILABLE" in msg
    # Verify it does NOT fabricate data when called
    with pytest.raises(FileNotFoundError):
        adapter.read_year_file("nonexistent.grd", year=2023)
