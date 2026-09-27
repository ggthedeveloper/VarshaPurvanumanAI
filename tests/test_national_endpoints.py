"""
Test suite for VarshaPurvanumanAI National & Hierarchical REST Endpoints (SIH26080).
Validates FastAPI endpoints specified in Section 17 of the problem statement:
- GET /forecast/india
- GET /forecast/state/{state}
- GET /forecast/district/{district}
- GET /forecast/grid
- GET /forecast/{district}/probability
- GET /forecast/{district}/regime
- GET /data-status
- GET /verification
"""
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app


class TestNationalForecastEndpoints:
    """Verifies all required national, state, district, grid, and verification REST routes."""

    @pytest.fixture(scope="class")
    def client(self):
        return TestClient(app)

    def test_get_india_overview(self, client):
        response = client.get("/forecast/india")
        assert response.status_code == 200
        data = response.json()

        assert data["total_states"] >= 36
        assert data["total_districts"] == 763
        assert "states" in data
        assert len(data["states"]) == data["total_states"]
        assert "national_warning_headline" in data
        assert "provenance" in data

    def test_get_state_forecast_maharashtra(self, client):
        response = client.get("/forecast/state/Maharashtra")
        assert response.status_code == 200
        data = response.json()

        assert data["state"].upper() == "MAHARASHTRA"
        assert data["district_count"] >= 35
        assert len(data["districts"]) == data["district_count"]

        # Ensure Pune is present in Maharashtra districts
        pune_found = any("pune" in d["district_id"].lower() for d in data["districts"])
        assert pune_found is True

    def test_get_state_forecast_not_found(self, client):
        response = client.get("/forecast/state/Atlantis")
        assert response.status_code == 404

    def test_get_district_forecast_pune_benchmark(self, client):
        response = client.get("/forecast/district/pune")
        assert response.status_code == 200
        data = response.json()

        assert data["district_name"].upper() == "PUNE"
        assert data["data_status"] == "VALIDATED_FORECAST"
        assert data["corrected_rainfall_mm"] is not None
        assert "probabilities" in data
        assert len(data["probabilities"]) == 5  # 5 calibrated thresholds
        assert "uncertainty" in data
        assert "percentile_10_mm" in data["uncertainty"]
        assert "percentile_50_mm" in data["uncertainty"]
        assert "percentile_90_mm" in data["uncertainty"]

    def test_get_district_forecast_unmonitored_zero_fabrication(self, client):
        # Lucknow is in the official boundary catalog but outside the ground truth mesoscale domain
        response = client.get("/forecast/district/lucknow")
        assert response.status_code == 200
        data = response.json()

        assert data["district_name"].upper() == "LUCKNOW"
        assert data["data_status"] == "DATA_UNAVAILABLE"
        # Strict zero synthetic data enforcement
        assert data["raw_nwp_rainfall_mm"] is None
        assert data["corrected_rainfall_mm"] is None
        assert data["probabilities"] == []

    def test_get_district_forecast_unknown_district(self, client):
        response = client.get("/forecast/district/non_existent_district_xyz")
        assert response.status_code == 404

    def test_get_grid_product(self, client):
        response = client.get("/forecast/grid")
        assert response.status_code == 200
        data = response.json()

        assert "cells" in data
        assert len(data["cells"]) > 0
        cell = data["cells"][0]
        assert "latitude" in cell
        assert "longitude" in cell
        assert "raw_nwp_rainfall_mm" in cell
        assert "corrected_rainfall_mm" in cell

    def test_get_district_probability(self, client):
        response = client.get("/forecast/pune/probability")
        assert response.status_code == 200
        data = response.json()

        assert data["district_name"] == "PUNE"
        assert len(data["probabilities"]) == 5
        thresholds = [p["threshold_mm"] for p in data["probabilities"]]
        assert thresholds == [2.5, 7.5, 15.6, 64.5, 115.6]

        # Probabilities must be monotonically decreasing with threshold
        probs = [p["exceedance_probability"] for p in data["probabilities"]]
        for i in range(len(probs) - 1):
            assert probs[i] >= probs[i + 1]

    def test_get_district_regime(self, client):
        response = client.get("/forecast/pune/regime")
        assert response.status_code == 200
        data = response.json()

        assert data["district_name"] == "PUNE"
        assert "predicted_regime" in data
        assert "macro_state" in data
        assert "disturbance_state" in data
        assert "topographic_state" in data
        assert "regime_probabilities" in data
        assert len(data["regime_probabilities"]) == 8

    def test_get_data_status_matrix(self, client):
        response = client.get("/data-status")
        assert response.status_code == 200
        data = response.json()

        assert data["total_supported_districts"] == 763
        assert data["validated_benchmark_districts"] == 8
        assert data["data_unavailable_districts"] == 755
        assert "Western Ghats" in data["benchmark_region"]

    def test_get_verification_endpoint(self, client):
        response = client.get("/verification")
        assert response.status_code == 200
        data = response.json()

        assert "continuous_metrics" in data
        assert "categorical_metrics" in data
        assert "uncertainty_intervals_95" in data
        assert "scientific_conclusion" in data
