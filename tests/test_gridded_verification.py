"""
Tests for Gridded Spatial Verification & Fractions Skill Score (FSS) Engine.
Validates Phase 9 (2D FSS deployment) and Phase 10 (Gridded rainfall products).
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_gridded_verification_endpoint_success(client):
    """Verifies that GET /api/verification/gridded computes and returns 2D FSS across spatial scales."""
    response = client.get("/api/verification/gridded")
    assert response.status_code == 200
    data = response.json()

    assert data["fss_status"] == "COMPUTED_GRIDDED"
    assert data["domain_name"] == "Western Ghats Mesoscale Orographic Domain"
    assert data["grid_shape"] == [6, 6]
    assert data["resolution_deg"] == 0.25
    assert data["grid_cell_km"] == 27.5
    assert data["dates_evaluated"] == 30

    # Continuous spatial metrics
    spatial_cont = data["spatial_continuous_metrics"]
    assert "Raw NWP" in spatial_cont
    assert "Regime-Aware ML" in spatial_cont
    assert spatial_cont["Regime-Aware ML"]["rmse_mm"] < spatial_cont["Raw NWP"]["rmse_mm"]
    assert abs(spatial_cont["Regime-Aware ML"]["mean_bias_mm"]) < abs(spatial_cont["Raw NWP"]["mean_bias_mm"])

    # 2D Fractions Skill Score by threshold
    fss_dict = data["fss_by_threshold"]
    for t_str in ["2.5", "7.5", "15.6", "35.5"]:
        assert t_str in fss_dict
        t_data = fss_dict[t_str]
        assert "observed_fraction" in t_data
        assert "fss_random" in t_data
        assert "fss_useful" in t_data

        scales = t_data["scales"]
        assert len(scales) == 3
        # Check window sizes 1, 3, 5
        sizes = [s["window_size"] for s in scales]
        assert sizes == [1, 3, 5]

        # Verify scale-dependent property: FSS should generally improve or remain consistent with larger neighborhood
        fss_scores = [s["fss_raw"] for s in scales]
        assert fss_scores[2] >= fss_scores[0] or abs(fss_scores[2] - fss_scores[0]) < 0.05


def test_station_vs_gridded_fss_separation(client):
    """
    Guarantees scientific honesty:
    1. Station-level verification summary explicitly declares FSS as NOT_COMPUTABLE.
    2. Gridded spatial endpoint computes real 2D FSS scores.
    """
    # 1. Station verification summary
    res_station = client.get("/api/verification/summary")
    assert res_station.status_code == 200
    data_station = res_station.json()
    assert data_station["fss"]["status"] == "NOT_COMPUTABLE"
    assert "point-based" in data_station["fss"]["reason"]

    # 2. Gridded verification
    res_gridded = client.get("/api/verification/gridded")
    assert res_gridded.status_code == 200
    data_gridded = res_gridded.json()
    assert data_gridded["fss_status"] == "COMPUTED_GRIDDED"
    assert len(data_gridded["fss_by_threshold"]) >= 4


def test_grid_rainfall_endpoint(client):
    """Verifies that GET /api/grid/rainfall serves 2D spatial matrices for map rendering."""
    response = client.get("/api/grid/rainfall")
    assert response.status_code == 200
    data = response.json()

    assert data["date"] == "2024-06-07"
    assert data["grid_shape"] == [6, 6]
    assert len(data["latitudes"]) == 6
    assert len(data["longitudes"]) == 6

    # Verify 6x6 spatial grids
    for grid_key in ["raw_nwp_grid", "corrected_grid", "observed_grid", "bias_raw_grid", "bias_corrected_grid"]:
        assert grid_key in data
        grid = data[grid_key]
        assert len(grid) == 6
        for row in grid:
            assert len(row) == 6

    stats = data["summary_stats"]
    assert stats["observed_mean_mm"] >= 0.0
    assert stats["corrected_mean_mm"] >= 0.0
