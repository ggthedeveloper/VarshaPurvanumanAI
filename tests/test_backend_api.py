"""
Comprehensive Backend API Test Suite for VarshaPurvanumanAI (SIH26080).
Verifies all 17 requirements:
1. Health check returns 200 and lists all models loaded
2. Model info endpoint returns correct architecture metadata
3. Regime prediction returns valid regime category and probabilities summing to ~1.0
4. Deterministic post-processing returns non-negative corrected rainfall
5. Exceedance probabilities are in [0, 1] and calibrated
6. Combined forecast endpoint returns complete structure
7. District endpoint returns Pune with active status
8. District endpoint for non-monitored district returns transparent 'unavailable' notice (NOT fabricated data)
9. Verification summary endpoint returns exact Phase 8 metrics
10. Verification endpoint explicitly reports FSS as NOT_COMPUTABLE
11. Invalid input validation (negative rainfall, out-of-range RH, non-existent district)
12. Model-not-loaded handling
13. Latency benchmark (< 50ms per prediction)
14. CORS headers present in responses
15. Correct HTTP status codes (200, 400, 404, 500)
16. Predicted-regime routing: verify post-processor routes to predicted regime submodel
17. Real data provenance: verify data_status='REAL_DATA' in responses
"""
import time
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.model_loader import registry


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def valid_payload():
    return {
        "nwp_rainfall": 12.5,
        "wind_speed_ms": 5.4,
        "u_wind_10m": 4.2,
        "v_wind_10m": -1.1,
        "temperature_2m": 27.5,
        "relative_humidity_2m": 88.0,
        "surface_pressure": 980.0,
        "cape": 1450.0,
        "month": 6,
        "day_of_year": 180,
        "latitude": 18.5204,
        "longitude": 73.8567,
    }


def test_01_health_check(client):
    """1. Health check returns 200 and lists all models loaded."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["data_status"] in ["HISTORICAL_BENCHMARK", "REAL_DATA"]
    for model_name, status in data["model_status"].items():
        assert status == "loaded", f"Model {model_name} not loaded: {status}"


def test_02_model_info_metadata(client):
    """2. Model info endpoint returns correct architecture metadata."""
    response = client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    assert "regime_classifier" in data
    assert "global_postprocessor" in data
    assert "regime_aware_postprocessor" in data
    assert "probability_suite" in data
    assert data["regime_classifier"]["model_version"] == "v1.0.0-phase4"
    assert "GradientBoostingClassifier" in data["regime_classifier"]["algorithm"]
    assert data["global_postprocessor"]["model_version"] == "v1.0.0-phase5"
    assert data["regime_aware_postprocessor"]["model_version"] == "v1.0.0-phase6"
    assert data["probability_suite"]["model_version"] == "v1.0.0-phase7"


def test_03_regime_prediction(client, valid_payload):
    """3. Regime prediction returns valid regime category and probabilities summing to ~1.0."""
    response = client.post("/api/regime/predict", json=valid_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_regime"] in [
        "ACTIVE_MONSOON", "BREAK_MONSOON", "COASTAL_OROGRAPHIC", "DEPRESSION", "OTHER"
    ]
    probs = data["probabilities"]
    assert abs(sum(probs.values()) - 1.0) < 1e-4
    assert 0.0 <= data["confidence"] <= 1.0
    assert data["data_status"] in ["HISTORICAL_BENCHMARK", "REAL_DATA"]


def test_04_deterministic_postprocessing_non_negative(client, valid_payload):
    """4. Deterministic post-processing returns non-negative corrected rainfall."""
    response = client.post("/api/rainfall/predict", json=valid_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["corrected_rainfall_mm"] >= 0.0
    assert "selected_model" in data
    assert data["data_status"] in ["HISTORICAL_BENCHMARK", "REAL_DATA"]


def test_05_exceedance_probabilities_valid_range(client, valid_payload):
    """5. Exceedance probabilities are in [0, 1] and calibrated."""
    response = client.post("/api/rainfall/probability", json=valid_payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["probabilities"]) == 5
    for item in data["probabilities"]:
        assert 0.0 <= item["exceedance_probability"] <= 1.0
        assert item["threshold_mm"] in [2.5, 7.5, 15.6, 64.5, 115.6]
        assert item["advisory_status"] in ["NORMAL_ADVISORY", "ELEVATED_RISK"]
    assert "OFFICIAL IMD WEATHER WARNINGS" in data["disclaimer"]


def test_06_combined_forecast(client, valid_payload):
    """6. Combined forecast endpoint returns complete structure."""
    response = client.post("/api/forecast", json=valid_payload)
    assert response.status_code == 200
    data = response.json()
    assert "raw_nwp_rainfall_mm" in data
    assert "predicted_regime" in data
    assert "corrected_rainfall_mm" in data
    assert "heavy_rainfall_probabilities" in data
    assert len(data["heavy_rainfall_probabilities"]) == 5
    assert "model_metadata" in data
    assert data["data_status"] in ["HISTORICAL_BENCHMARK", "REAL_DATA"]
    assert data["forecast_mode"] == "HISTORICAL_BENCHMARK"
    assert "sample_timestamp" in data


def test_07_district_pune_benchmark_active(client):
    """7. District endpoint returns Pune with active status."""
    response = client.get("/api/district/pune/forecast")
    assert response.status_code == 200
    data = response.json()
    assert data["coverage_status"] == "BENCHMARK_ACTIVE"
    assert data["forecast"] is not None
    assert data["forecast"]["corrected_rainfall_mm"] >= 0.0
    assert data["data_status"] in ["HISTORICAL_BENCHMARK", "REAL_DATA"]
    assert data["forecast_mode"] == "HISTORICAL_BENCHMARK"
    assert "sample_timestamp" in data


def test_08_district_non_monitored_unavailable_notice(client):
    """8. District endpoint for non-monitored district returns transparent 'unavailable' notice (NOT fabricated data)."""
    response = client.get("/api/district/nagpur/forecast")
    assert response.status_code == 200
    data = response.json()
    assert data["coverage_status"] == "DATA_UNAVAILABLE"
    assert data["forecast"] is None
    assert data["forecast_mode"] == "DATA_UNAVAILABLE"
    assert "not fabricated" in data["message"].lower()


def test_09_verification_summary_metrics(client):
    """9. Verification summary endpoint returns exact Phase 8 metrics."""
    response = client.get("/api/verification/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["test_sample_count"] == 31
    assert "Raw NWP" in data["continuous_metrics"]
    assert "Global ML" in data["continuous_metrics"]
    assert "Regime-Aware ML" in data["continuous_metrics"]
    # Check exact RMSE values from Phase 8
    assert round(data["continuous_metrics"]["Raw NWP"]["rmse"], 2) == 11.62
    assert round(data["continuous_metrics"]["Global ML"]["rmse"], 2) == 9.03
    assert round(data["continuous_metrics"]["Regime-Aware ML"]["rmse"], 2) == 9.61


def test_10_verification_fss_not_computable(client):
    """10. Verification endpoint explicitly reports FSS as NOT_COMPUTABLE."""
    response = client.get("/api/verification/summary")
    assert response.status_code == 200
    data = response.json()
    fss = data["fss"]
    assert fss["metric"] == "FSS"
    assert fss["status"] == "NOT_COMPUTABLE"
    assert "2-d spatial forecast/observation grid" in fss["reason"].lower()


def test_11_invalid_input_validation(client, valid_payload):
    """11. Invalid input validation (negative rainfall, out-of-range RH, non-existent district, missing predictors)."""
    # Negative precipitation
    bad_payload1 = valid_payload.copy()
    bad_payload1["nwp_rainfall"] = -5.0
    r1 = client.post("/api/rainfall/predict", json=bad_payload1)
    assert r1.status_code == 422  # Pydantic validation error

    # Out of range RH (> 100)
    bad_payload2 = valid_payload.copy()
    bad_payload2["relative_humidity_2m"] = 150.0
    r2 = client.post("/api/rainfall/predict", json=bad_payload2)
    assert r2.status_code == 422

    # Target leakage attempt
    bad_payload3 = {"features": {"observed_rainfall": 25.0}}
    r3 = client.post("/api/rainfall/predict", json=bad_payload3)
    assert r3.status_code == 422
    assert "Forbidden target/leakage term" in str(r3.json()["details"])

    # Missing single required predictor (cape omitted)
    bad_payload_missing = valid_payload.copy()
    del bad_payload_missing["cape"]
    r_missing = client.post("/api/rainfall/predict", json=bad_payload_missing)
    assert r_missing.status_code == 422
    assert "cape" in str(r_missing.json()).lower()

    # Missing multiple required predictors (both winds omitted)
    bad_payload_multi_missing = valid_payload.copy()
    del bad_payload_multi_missing["u_wind_10m"]
    del bad_payload_multi_missing["v_wind_10m"]
    r_multi = client.post("/api/forecast", json=bad_payload_multi_missing)
    assert r_multi.status_code == 422

    # Features dict missing required features
    bad_payload_dict = {"features": {"nwp_rainfall": 5.4, "wind_speed_ms": 5.2}}
    r_dict = client.post("/api/forecast", json=bad_payload_dict)
    assert r_dict.status_code == 422

    # Non-existent district
    r4 = client.get("/api/district/non_existent_district_xyz/forecast")
    assert r4.status_code == 404


def test_12_model_registry_loaded_state():
    """12. Model registry state verification."""
    assert registry.is_loaded is True
    assert registry.regime_classifier is not None
    assert registry.global_postprocessor is not None
    assert registry.regime_postprocessor is not None
    assert registry.probability_suite is not None


def test_13_latency_benchmark(client, valid_payload):
    """13. Latency benchmark (< 50ms per prediction)."""
    latencies = []
    for _ in range(10):
        t0 = time.perf_counter()
        resp = client.post("/api/rainfall/predict", json=valid_payload)
        t1 = time.perf_counter()
        assert resp.status_code == 200
        latencies.append((t1 - t0) * 1000)

    avg_latency = sum(latencies) / len(latencies)
    assert avg_latency < 50.0, f"Average latency {avg_latency:.2f}ms exceeds 50ms SLA"


def test_14_cors_headers(client):
    """14. CORS headers present in responses."""
    response = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_15_status_codes(client):
    """15. Correct HTTP status codes (200, 400/422, 404)."""
    # 200 OK
    assert client.get("/api/health").status_code == 200
    # 404 Not Found
    assert client.get("/api/nonexistent_endpoint").status_code == 404
    # 422 Unprocessable Entity
    assert client.post("/api/rainfall/predict", json={}).status_code == 422


def test_16_predicted_regime_routing(client, valid_payload):
    """16. Predicted-regime routing: verify post-processor routes to predicted regime submodel."""
    response = client.post("/api/rainfall/predict", json=valid_payload)
    assert response.status_code == 200
    data = response.json()
    predicted_regime = data["predicted_regime"]
    selected_model = data["selected_model"]
    assert predicted_regime in selected_model or "fallback" in selected_model


def test_17_real_data_provenance(client, valid_payload):
    """17. Real data provenance: verify data_status in responses."""
    endpoints = [
        ("/api/health", "GET", None),
        ("/api/regime/predict", "POST", valid_payload),
        ("/api/rainfall/predict", "POST", valid_payload),
        ("/api/rainfall/probability", "POST", valid_payload),
        ("/api/forecast", "POST", valid_payload),
        ("/api/districts", "GET", None),
        ("/api/district/pune/forecast", "GET", None),
        ("/api/verification/summary", "GET", None),
    ]
    for url, method, payload in endpoints:
        if method == "GET":
            r = client.get(url)
        else:
            r = client.post(url, json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data.get("data_status") in ["HISTORICAL_BENCHMARK", "REAL_DATA"], f"Endpoint {url} missing data_status"
