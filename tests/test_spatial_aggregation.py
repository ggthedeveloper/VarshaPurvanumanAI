"""
Test suite for VarshaPurvanumanAI Spatial District Aggregation (SIH26080).
Validates polygon-grid intersection, area-weighted averaging, quantiles (P10/P50/P75/P90),
spatial coverage %, area exceeding thresholds %, and IMD warning categories.
"""
import pytest
import pandas as pd
import numpy as np

from src.data.adapters.boundary_provider import IndiaDistrictBoundaryProvider
from src.spatial.district_aggregator import SpatialDistrictAggregator


class TestSpatialDistrictAggregation:
    """Verifies area-weighted spatial aggregation of gridded NWP forecasts to district polygons."""

    @pytest.fixture
    def boundary_provider(self):
        return IndiaDistrictBoundaryProvider.get_instance()

    @pytest.fixture
    def aggregator(self, boundary_provider):
        return SpatialDistrictAggregator(boundary_provider=boundary_provider)

    @pytest.fixture
    def mock_grid_cells(self):
        """Create 4 synthetic intersecting grid cells over a 1-degree box."""
        return [
            {"latitude": 18.25, "longitude": 73.50, "raw_nwp_rainfall_mm": 10.0, "corrected_rainfall_mm": 15.0},
            {"latitude": 18.50, "longitude": 73.50, "raw_nwp_rainfall_mm": 20.0, "corrected_rainfall_mm": 25.0},
            {"latitude": 18.25, "longitude": 73.75, "raw_nwp_rainfall_mm": 30.0, "corrected_rainfall_mm": 40.0},
            {"latitude": 18.50, "longitude": 73.75, "raw_nwp_rainfall_mm": 65.0, "corrected_rainfall_mm": 70.0},
        ]

    def test_pune_polygon_spatial_aggregation(self, aggregator):
        # Load real Western Ghats grid cells from processed benchmark
        df = pd.read_csv("data/processed/gridded_monsoon_benchmark.csv")
        sample_date = "2024-06-07"
        sub = df[df["timestamp"].str.startswith(sample_date)]

        grid_cells = []
        for _, row in sub.iterrows():
            grid_cells.append({
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "raw_nwp_rainfall_mm": float(row["nwp_rainfall"]),
                "corrected_rainfall_mm": float(row["observed_rainfall"]),
            })

        res = aggregator.aggregate_grid_to_district("pune", grid_cells)

        assert res["district_id"] == "pune"
        assert res["grid_cells_intersected"] > 0
        assert res["mean_rainfall_mm"] >= 0.0
        assert res["min_rainfall_mm"] <= res["mean_rainfall_mm"] <= res["max_rainfall_mm"]
        assert res["percentile_10_mm"] <= res["percentile_50_mm"] <= res["percentile_90_mm"]
        assert 0.0 <= res["spatial_coverage_pct"] <= 100.0

        # Verify area-weighted aggregation math
        weights_sum = sum(c["effective_weight"] for c in res["cell_intersections"])
        assert abs(weights_sum - 1.0) < 1e-4 or res["spatial_coverage_pct"] == 0.0

    def test_synthetic_threshold_exceedance_and_warning(self, aggregator, mock_grid_cells):
        res = aggregator.aggregate_grid_to_district("pune", mock_grid_cells)

        assert "area_exceeding_thresholds_pct" in res
        exceed = res["area_exceeding_thresholds_pct"]

        # In mock data, at least one cell has corrected 70.0 mm >= 64.5 mm
        assert exceed["heavy_64_5mm"] > 0.0

        # Monotonicity check: Area exceeding 2.5 mm must be >= Area exceeding 64.5 mm
        assert exceed["light_2_5mm"] >= exceed["heavy_64_5mm"]

        # Warning category check
        assert res["warning_category"]["level"] in [
            "GREEN_NO_WARNING",
            "YELLOW_WATCH",
            "ORANGE_ALERT",
            "RED_WARNING",
        ]

    def test_empty_or_non_intersecting_grid_returns_safe_zero(self, aggregator):
        # Coordinates in Delhi, evaluated against Pune polygon
        delhi_cells = [
            {"latitude": 28.61, "longitude": 77.20, "raw_nwp_rainfall_mm": 5.0, "corrected_rainfall_mm": 5.0}
        ]
        res = aggregator.aggregate_grid_to_district("pune", delhi_cells)
        assert res["grid_cells_intersected"] == 0
        assert res["mean_rainfall_mm"] == 0.0
        assert res["spatial_coverage_pct"] == 0.0
        assert res["warning_category"]["level"] == "GREEN_NO_WARNING"
