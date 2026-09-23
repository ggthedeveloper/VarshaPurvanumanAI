"""
Automated unit tests for Target and Temporal Leakage Prevention.
"""
import pytest
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from src.features.leakage_checker import LeakageChecker
from src.features.pipeline import FeaturePipeline


def test_target_leakage_detector_catches_target_column():
    X = pd.DataFrame({
        "nwp_rainfall": [10.0, 5.0, 0.0],
        "observed_rainfall": [12.0, 4.0, 0.0]  # Leakage!
    })
    y = pd.Series([12.0, 4.0, 0.0])

    is_clean, errors = LeakageChecker.check_target_leakage(X, y, target_name="observed_rainfall")
    assert is_clean is False
    assert any("directly present" in e for e in errors)


def test_target_leakage_detector_catches_perfect_correlation():
    y = pd.Series([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0])
    # Feature perfectly mirrors target + 0.1
    X = pd.DataFrame({
        "nwp_rainfall": [0.5, 1.2, 1.8, 2.5, 3.2, 3.9, 4.5],
        "leaked_proxy": [1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1]
    })

    is_clean, errors = LeakageChecker.check_target_leakage(X, y)
    assert is_clean is False
    assert any("near-perfect correlation" in e for e in errors)


def test_pipeline_zero_target_leakage():
    df = pd.DataFrame({
        "timestamp": pd.date_range("2024-07-01", periods=10, freq="D", tz="UTC"),
        "latitude": 21.0,
        "longitude": 78.0,
        "forecast_lead_time": 1,
        "nwp_rainfall": [5.0, 10.0, 15.0, 0.0, 2.0, 8.0, 12.0, 20.0, 1.0, 0.0],
        "temperature_2m": [28.0] * 10,
        "relative_humidity_2m": [80.0] * 10,
        "surface_pressure": [1000.0] * 10,
        "wind_speed_10m": [15.0] * 10,
        "wind_direction_10m": [240.0] * 10,
        "cape": [1000.0] * 10,
        "observed_rainfall": [4.0, 9.5, 16.0, 0.1, 1.8, 7.5, 13.0, 18.5, 0.9, 0.0]
    })

    pipeline = FeaturePipeline(scale_features=True)
    X, y = pipeline.fit_transform(df)

    assert "observed_rainfall" not in X.columns
    is_clean, errors = LeakageChecker.check_target_leakage(X, y)
    assert is_clean is True, f"Leakage detected: {errors}"
