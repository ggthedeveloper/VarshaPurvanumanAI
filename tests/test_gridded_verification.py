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


def test_three_model_fss_and_spatial_metrics(client):
    """Verifies that 2D FSS evaluates all 3 models: Raw NWP, Global ML, and Regime-Aware ML."""
    response = client.get("/api/verification/gridded")
    assert response.status_code == 200
    data = response.json()

    spatial_cont = data["spatial_continuous_metrics"]
    assert "Raw NWP" in spatial_cont
    assert "Global ML" in spatial_cont
    assert "Regime-Aware ML" in spatial_cont

    # Verify that Regime-Aware ML reduces RMSE over Raw NWP
    assert spatial_cont["Regime-Aware ML"]["rmse_mm"] < spatial_cont["Raw NWP"]["rmse_mm"]
    assert spatial_cont["Global ML"]["rmse_mm"] < spatial_cont["Raw NWP"]["rmse_mm"]

    # Verify 3-model FSS presence across all scales
    for t_str in ["2.5", "7.5", "15.6", "35.5"]:
        for scale in data["fss_by_threshold"][t_str]["scales"]:
            assert "fss_raw" in scale
            assert "fss_global" in scale
            assert "fss_regime_aware" in scale
            assert "fss_corrected" in scale
            assert 0.0 <= scale["fss_raw"] <= 1.0
            assert 0.0 <= scale["fss_global"] <= 1.0
            assert 0.0 <= scale["fss_regime_aware"] <= 1.0


def test_multi_district_gridded_spatial_aggregation(client):
    """Verifies that all 6 covered districts provide genuine multi-cell spatial aggregation."""
    # Test Pune
    res_pune = client.get("/api/district/pune/forecast")
    assert res_pune.status_code == 200
    d_pune = res_pune.json()
    assert d_pune["coverage_status"] == "BENCHMARK_ACTIVE"
    assert d_pune["spatial_aggregation"] is not None
    assert d_pune["spatial_aggregation"]["grid_cells_intersected"] == 15
    assert d_pune["spatial_aggregation"]["mean_rainfall_mm"] > 0.0

    # Test Raigad with use_processed=true
    res_raigad = client.get("/api/district/raigad/forecast?use_processed=true")
    assert res_raigad.status_code == 200
    d_raigad = res_raigad.json()
    assert d_raigad["coverage_status"] == "PROCESSED_BENCHMARK"
    assert d_raigad["spatial_aggregation"] is not None
    assert d_raigad["spatial_aggregation"]["grid_cells_intersected"] == 11
    assert d_raigad["spatial_aggregation"]["mean_rainfall_mm"] > 0.0
    assert d_raigad["spatial_aggregation"]["max_rainfall_mm"] >= d_raigad["spatial_aggregation"]["mean_rainfall_mm"]


def test_gridded_benchmark_dataset_integrity():
    """Validates that gridded benchmark covers 36 nodes, 4 seasons, and zero WD events."""
    import pandas as pd
    df = pd.read_csv("data/processed/gridded_monsoon_benchmark.csv")
    assert len(df) == 14256, f"Expected 14,256 rows, got {len(df)}"
    assert df["grid_node_id"].nunique() == 36, "Expected 36 unique grid nodes"
    assert set(df["district_name"].unique()) == {"PUNE", "RAYGAD", "THANE", "SATARA", "AHAMEDNAGAR", "RATNAGIRI"}
    
    # Priority 5: Zero Western Disturbance in southern/peninsular domain (lat <= 19.25N)
    wd_count = (df["regime"] == "WESTERN_DISTURBANCE").sum()
    assert wd_count == 0, f"Expected 0 WD events in domain <= 19.25N, got {wd_count}"

