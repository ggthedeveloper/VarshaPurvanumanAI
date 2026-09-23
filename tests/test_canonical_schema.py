"""
Unit tests for CanonicalSchemaValidator.
"""
import pytest
import pandas as pd
import numpy as np
from src.preprocessing.canonical_schema import CanonicalSchemaValidator


def test_canonical_schema_valid():
    df = pd.DataFrame({
        "timestamp": pd.date_range("2024-07-01", periods=3, freq="D", tz="UTC"),
        "latitude": [21.0, 21.0, 21.0],
        "longitude": [78.0, 78.0, 78.0],
        "forecast_initialization": pd.date_range("2024-06-30", periods=3, freq="D", tz="UTC"),
        "forecast_valid_time": pd.date_range("2024-07-01", periods=3, freq="D", tz="UTC"),
        "forecast_lead_time": [1, 1, 1],
        "nwp_rainfall": [12.5, 0.0, 45.2],
        "observed_rainfall": [10.0, 2.1, 40.0],
        "temperature_2m": [28.5, 27.2, 26.8]
    })
    is_valid, errors = CanonicalSchemaValidator.validate(df)
    assert is_valid is True, f"Validation failed with errors: {errors}"


def test_canonical_schema_missing_column():
    df = pd.DataFrame({
        "timestamp": pd.date_range("2024-07-01", periods=2, freq="D", tz="UTC"),
        "latitude": [21.0, 21.0],
        "longitude": [78.0, 78.0],
        # Missing observed_rainfall
        "nwp_rainfall": [12.5, 0.0]
    })
    is_valid, errors = CanonicalSchemaValidator.validate(df)
    assert is_valid is False
    assert any("observed_rainfall" in e for e in errors)


def test_canonical_schema_negative_rainfall():
    df = pd.DataFrame({
        "timestamp": pd.date_range("2024-07-01", periods=2, freq="D", tz="UTC"),
        "latitude": [21.0, 21.0],
        "longitude": [78.0, 78.0],
        "forecast_initialization": pd.date_range("2024-06-30", periods=2, freq="D", tz="UTC"),
        "forecast_valid_time": pd.date_range("2024-07-01", periods=2, freq="D", tz="UTC"),
        "forecast_lead_time": [1, 1],
        "nwp_rainfall": [-5.0, 10.0],  # Negative NWP rainfall
        "observed_rainfall": [10.0, 12.0]
    })
    is_valid, errors = CanonicalSchemaValidator.validate(df)
    assert is_valid is False
    assert any("Negative NWP rainfall" in e for e in errors)
