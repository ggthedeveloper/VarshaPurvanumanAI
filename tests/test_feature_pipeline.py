"""
Unit tests for FeaturePipeline and meteorological extractors.
"""
import pytest
import pandas as pd
import numpy as np
from src.features.pipeline import FeaturePipeline
from src.features.nwp_features import NWPFeatureExtractor
from src.features.temporal_features import TemporalFeatureExtractor
from src.features.spatial_features import SpatialFeatureExtractor


@pytest.fixture
def mock_canonical_df():
    return pd.DataFrame({
        "timestamp": pd.date_range("2024-07-01", periods=10, freq="D", tz="UTC"),
        "latitude": [18.5] * 10,
        "longitude": [73.8] * 10,
        "forecast_lead_time": [1] * 10,
        "nwp_rainfall": [0.0, 5.2, 12.8, 25.0, 48.2, 0.5, 1.2, 0.0, 18.0, 3.5],
        "temperature_2m": [25.0, 24.5, 24.0, 23.5, 23.0, 26.0, 25.5, 27.0, 24.0, 25.0],
        "relative_humidity_2m": [80.0, 85.0, 90.0, 95.0, 98.0, 75.0, 78.0, 70.0, 92.0, 82.0],
        "surface_pressure": [940.0] * 10,
        "wind_speed_10m": [18.0] * 10,  # 18 km/h = 5 m/s
        "wind_direction_10m": [270.0] * 10,  # 270 deg = pure westerly
        "cape": [800.0] * 10,
        "observed_rainfall": [0.0, 4.0, 15.0, 30.0, 45.0, 0.1, 0.8, 0.0, 22.0, 2.5]
    })


def test_nwp_wind_components(mock_canonical_df):
    df_nwp = NWPFeatureExtractor.extract_features(mock_canonical_df)
    # Wind speed 18 km/h = 5 m/s
    assert np.allclose(df_nwp["wind_speed_ms"], 5.0)
    # Wind direction 270 deg (blowing from West) -> u = +5 m/s (eastward), v = 0 m/s
    assert np.allclose(df_nwp["u_wind_10m"], 5.0)
    assert np.allclose(df_nwp["v_wind_10m"], 0.0, atol=1e-5)


def test_temporal_cyclical_bounds(mock_canonical_df):
    df_temp = TemporalFeatureExtractor.extract_features(mock_canonical_df)
    assert (df_temp["sin_doy"] >= -1.0).all() and (df_temp["sin_doy"] <= 1.0).all()
    assert (df_temp["cos_doy"] >= -1.0).all() and (df_temp["cos_doy"] <= 1.0).all()
    assert (df_temp["is_monsoon_season"] == 1).all()  # July is Southwest Monsoon


def test_spatial_zone_indicators(mock_canonical_df):
    df_spat = SpatialFeatureExtractor.extract_features(mock_canonical_df)
    # Pune (18.5 N, 73.8 E) is in Western Ghats belt and Core Monsoon Zone
    assert (df_spat["in_western_ghats_belt"] == 1).all()
    assert (df_spat["in_core_monsoon_zone"] == 1).all()
    assert (df_spat["dist_to_coast_approx_km"] > 0).all()


def test_feature_pipeline_fit_and_transform(mock_canonical_df):
    train_df = mock_canonical_df.iloc[:7]
    test_df = mock_canonical_df.iloc[7:]

    pipeline = FeaturePipeline(scale_features=True)
    X_train, y_train = pipeline.fit_transform(train_df)
    X_test, y_test = pipeline.transform(test_df)

    assert X_train.shape[1] == X_test.shape[1]
    assert list(X_train.columns) == list(X_test.columns)
    # In training set, scaled numeric columns with variation should have mean ~ 0 and population std ~ 1
    for col in X_train.select_dtypes(include=[np.number]).columns:
        if X_train[col].std(ddof=0) > 1e-4:
            assert np.isclose(X_train[col].mean(), 0.0, atol=1e-4)
            assert np.isclose(X_train[col].std(ddof=0), 1.0, atol=1e-4)
