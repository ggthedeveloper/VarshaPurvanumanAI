"""
Full System Integration Test Suite for VarshaPurvanumanAI (SIH26080).
Phase 11: End-to-End System Validation.

Validates:
1. System Architecture & Model Registry Initialization
2. Complete API Contract Coverage (12 endpoints + root)
3. End-to-End Inference Flow with Real Test Predictors
4. Operational Regime-Aware Routing and Calibrated Exceedance Probabilities
5. Pune Benchmark Station Strict Protection vs Unmonitored Districts
6. Verification Summary & FSS Immutability (NOT_COMPUTABLE)
7. Official Boundary GeoJSON Stream
8. Robustness & Validation Error Handling
"""
import os
import json
import pytest
import pandas as pd
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.model_loader import registry
from backend.app.config import settings
from src.probability.exceedance_model import VERIFIED_THRESHOLDS


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def real_test_sample():
    """Realistic physical meteorological predictors for Pune Benchmark Station in June."""
    return {
        "nwp_rainfall": 5.4,
        "wind_speed_ms": 5.2,
        "u_wind_10m": 4.1,
        "v_wind_10m": -1.8,
        "temperature_2m": 26.8,
        "relative_humidity_2m": 82.5,
        "surface_pressure": 985.0,
        "cape": 1350.0,
        "month": 6,
        "day_of_year": 165,
        "latitude": 18.5204,
        "longitude": 73.8567,
    }


def test_01_system_architecture_and_registry(client):
    """Verify that all authoritative models are successfully loaded into memory."""
    assert registry.is_loaded is True
    assert registry.regime_classifier is not None
    assert registry.global_postprocessor is not None
    assert registry.regime_postprocessor is not None
    assert registry.probability_suite is not None

    status = registry.status_dict
    assert status["regime_classifier"] == "loaded"
    assert status["global_postprocessor"] == "loaded"
    assert status["regime_postprocessor"] == "loaded"
    assert status["probability_suite"] == "loaded"


def test_02_root_and_health_endpoints(client):
    """Verify root and health check endpoints."""
    # Root
    res_root = client.get("/")
    assert res_root.status_code == 200
    data_root = res_root.json()
    assert data_root["service"] == settings.SERVICE_NAME
    assert data_root["data_status"] in ["HISTORICAL_BENCHMARK", "REAL_DATA"]

    # Health
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    data_health = res_health.json()
    assert data_health["status"] == "ok"
    assert data_health["data_status"] in ["HISTORICAL_BENCHMARK", "REAL_DATA"]
    assert all(st == "loaded" for st in data_health["model_status"].values())


def test_03_model_info_endpoint(client):
    """Verify metadata exposure from /api/models."""
    res = client.get("/api/models")
    assert res.status_code == 200
    data = res.json()

    # Regime classifier
    assert "regime_classifier" in data
    assert "GradientBoostingClassifier" in data["regime_classifier"]["algorithm"]
    classes = data["regime_classifier"]["supported_classes"]
    for expected_cls in ["ACTIVE_MONSOON", "BREAK_MONSOON", "COASTAL_OROGRAPHIC", "DEPRESSION", "OTHER"]:
        assert expected_cls in classes

    # Deterministic post-processors
    assert data["global_postprocessor"]["status"] == "loaded"
    assert data["regime_aware_postprocessor"]["status"] == "loaded"

    # Probability suite
    assert data["probability_suite"]["status"] == "loaded"
    assert 2.5 in data["probability_suite"]["supported_thresholds"]
    assert 64.5 in data["probability_suite"]["supported_thresholds"]
    assert 115.6 in data["probability_suite"]["supported_thresholds"]


def test_04_end_to_end_real_data_forecast_flow(client, real_test_sample):
    """Trace a complete real-data forecast request through all ML layers."""
    res = client.post("/api/forecast", json=real_test_sample)
    assert res.status_code == 200
    data = res.json()

    # 1. Inputs preserved
    assert abs(data["raw_nwp_rainfall_mm"] - real_test_sample["nwp_rainfall"]) < 1e-3

    # 2. Regime prediction
    assert data["predicted_regime"] in ["ACTIVE_MONSOON", "BREAK_MONSOON", "COASTAL_OROGRAPHIC", "DEPRESSION", "OTHER"]
    regime_probs = data["regime_probabilities"]
    assert len(regime_probs) == 5
    assert abs(sum(regime_probs.values()) - 1.0) < 1e-2

    # 3. Post-processed rainfall
    assert data["corrected_rainfall_mm"] >= 0.0
    assert isinstance(data["corrected_rainfall_mm"], float)
    assert "selected_model" in data

    # 4. Heavy rainfall probabilities
    probs = data["heavy_rainfall_probabilities"]
    assert len(probs) == 5
    expected_thrs = [2.5, 7.5, 15.6, 64.5, 115.6]
    for p_item, exp_thr in zip(probs, expected_thrs):
        assert abs(p_item["threshold_mm"] - exp_thr) < 1e-2
        assert 0.0 <= p_item["exceedance_probability"] <= 1.0
        assert p_item["advisory_status"] in ["NORMAL_ADVISORY", "ELEVATED_RISK"]
        assert 0.0 <= p_item["decision_threshold_tau"] <= 1.0

    # 5. Provenance & metadata
    assert data["data_status"] in ["HISTORICAL_BENCHMARK", "REAL_DATA"]
    assert data["forecast_mode"] == "HISTORICAL_BENCHMARK"
    assert data["prediction_source"] == "verified_model_artifacts"
    assert "Phase 4" in data["model_metadata"]["regime_classifier"]
    assert "Phase 6" in data["model_metadata"]["deterministic_postprocessor"]
    assert "Phase 7" in data["model_metadata"]["probability_engine"]


def test_05_pune_benchmark_station_protection(client):
    """
    CRITICAL: Verify that Pune (18.50°N, 73.80°E) is strictly presented as a
    STATION-LEVEL BENCHMARK and NOT an administrative district spatial average.
    """
    res = client.get("/api/district/pune/forecast")
    assert res.status_code == 200
    data = res.json()

    assert data["name"] == "PUNE BENCHMARK STATION"
    assert data["coverage_status"] == "BENCHMARK_ACTIVE"
    assert data["data_status"] in ["HISTORICAL_BENCHMARK", "REAL_DATA"]
    assert data["forecast_mode"] == "HISTORICAL_BENCHMARK"
    assert data["forecast"] is not None

    # Verify benchmark notice in message
    msg = data["message"]
    assert "PUNE BENCHMARK STATION" in msg
    assert "Station-level benchmark" in msg
    assert "District-level spatial aggregate data is currently unavailable" in msg


def test_06_unmonitored_district_returns_unavailable_notice(client):
    """
    Verify that unmonitored districts transparently return DATA UNAVAILABLE notice
    without fabricating data or copying Pune values.
    """
    res = client.get("/api/district/nagpur/forecast")
    assert res.status_code == 200
    data = res.json()

    assert data["name"] == "Nagpur"
    assert data["coverage_status"] == "DATA_UNAVAILABLE"
    assert data["forecast"] is None
    assert "District-level data unavailable for 'Nagpur'" in data["message"]
    assert "PUNE BENCHMARK STATION" in data["message"]


def test_07_unknown_district_returns_404(client):
    """Verify that querying a non-existent district returns 404."""
    res = client.get("/api/district/non_existent_district_12345/forecast")
    assert res.status_code == 404
    data = res.json()
    assert "not recognized" in data["detail"]


def test_08_district_boundary_geojson(client):
    """Verify that official district boundary GeoJSON is served correctly."""
    res = client.get("/api/districts/geojson")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 500  # 675 verified polygons


def test_09_verification_metrics_immutability_and_fss(client):
    """
    Verify that Phase 8 verification results are identical and FSS is strictly NOT_COMPUTABLE.
    """
    res = client.get("/api/verification/summary")
    assert res.status_code == 200
    data = res.json()

    assert data["test_sample_count"] == 31
    assert data["test_period"] == "June 1 - June 30, 2024"

    # Continuous metrics
    c_metrics = data["continuous_metrics"]
    assert round(c_metrics["Raw NWP"]["rmse"], 2) == 11.62
    assert round(c_metrics["Global ML"]["rmse"], 2) == 9.03
    assert round(c_metrics["Regime-Aware ML"]["rmse"], 2) == 9.61

    # FSS must strictly remain NOT_COMPUTABLE
    fss = data["fss"]
    assert fss["status"] == "NOT_COMPUTABLE"
    assert "point-based" in fss["reason"]

    # Threshold verification
    res_thr = client.get("/api/verification/thresholds")
    assert res_thr.status_code == 200
    thr_data = res_thr.json()
    assert "2.5" in thr_data["thresholds"]
    assert "Raw NWP" in thr_data["thresholds"]["2.5"]
    assert "64.5" in thr_data["thresholds"]
    # 64.5mm has 0 observed events in June 2024 test period
    assert thr_data["thresholds"]["64.5"]["Raw NWP"]["contingency_table"]["observed_events"] == 0
    assert thr_data["thresholds"]["64.5"]["Raw NWP"]["sample_sufficiency"] == "INSUFFICIENT TEST EVENTS"


def test_10_error_handling_and_validation(client):
    """Verify input validation rejects physically implausible or negative values."""
    # Negative rainfall
    res_neg = client.post("/api/forecast", json={
        "nwp_rainfall": -10.0,
        "wind_speed_ms": 5.0,
        "u_wind_10m": 3.0,
        "v_wind_10m": 2.0,
        "temperature_2m": 26.5,
        "relative_humidity_2m": 80.0,
        "surface_pressure": 980.0,
        "cape": 1200.0,
        "month": 6,
        "day_of_year": 160,
        "latitude": 18.5204,
        "longitude": 73.8567,
    })
    assert res_neg.status_code == 422
    err_body = res_neg.json()
    assert "error" in err_body or "detail" in err_body

    # Relative humidity > 100%
    res_rh = client.post("/api/forecast", json={
        "nwp_rainfall": 5.0,
        "wind_speed_ms": 5.0,
        "u_wind_10m": 3.0,
        "v_wind_10m": 2.0,
        "temperature_2m": 26.5,
        "relative_humidity_2m": 150.0,
        "surface_pressure": 980.0,
        "cape": 1200.0,
        "month": 6,
        "day_of_year": 160,
        "latitude": 18.5204,
        "longitude": 73.8567,
    })
    assert res_rh.status_code == 422
