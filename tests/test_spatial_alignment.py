"""
Unit tests for SpatialAligner.
"""
import pytest
import pandas as pd
import geopandas as gpd
from shapely.geometry import Polygon, Point
from src.preprocessing.spatial_alignment import SpatialAligner


@pytest.fixture
def mock_district_gdf():
    # Construct a simple square district polygon around (lat 20-22, lon 78-80) -> e.g. Nagpur region
    poly = Polygon([(78.0, 20.0), (80.0, 20.0), (80.0, 22.0), (78.0, 22.0)])
    gdf = gpd.GeoDataFrame({
        "district_name": ["TEST_DISTRICT"],
        "geometry": [poly]
    }, crs="EPSG:4326")
    return gdf


def test_spatial_aligner_point_in_polygon(mock_district_gdf):
    aligner = SpatialAligner(mock_district_gdf)

    # 3 grid points: 2 inside the polygon, 1 outside
    df_points = pd.DataFrame({
        "latitude": [21.0, 21.5, 25.0],
        "longitude": [79.0, 79.5, 85.0],
        "precipitation": [10.0, 20.0, 50.0],
        "observation_date": ["2024-07-15", "2024-07-15", "2024-07-15"],
        "forecast_lead_time_days": [1, 1, 1]
    })

    matched = aligner.assign_grid_points_to_districts(df_points)
    # Only 2 points should match the district
    assert len(matched) == 2
    assert (matched["district_name"] == "TEST_DISTRICT").all()

    # Test aggregation
    df_dist = aligner.aggregate_grid_to_district(df_points, value_cols=["precipitation"])
    assert len(df_dist) == 1
    assert df_dist["district_name"].iloc[0] == "TEST_DISTRICT"
    # Average of 10.0 and 20.0 is 15.0
    assert df_dist["precipitation"].iloc[0] == 15.0
