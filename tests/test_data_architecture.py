"""
Test suite for VarshaPurvanumanAI India-Wide Data Architecture (SIH26080).
Validates base provider interfaces, concrete adapters (GFS, ERA5, IMD, GPM, Climatology, Boundary),
DataManager integration, and strict zero synthetic data enforcement.
"""
import pytest
import pandas as pd
import numpy as np

from src.data.base_provider import (
    NWPProvider,
    ObservationProvider,
    DistrictBoundaryProvider,
    ClimatologyProvider,
    DataStatus,
)
from src.data.adapters.nwp_gfs_provider import NOAA_GFS_Provider
from src.data.adapters.nwp_era5_provider import ECMWF_ERA5_Provider, ERA5_Provider
from src.data.adapters.observation_imd_provider import IMD_Observation_Provider
from src.data.adapters.observation_gpm_provider import GPM_IMERG_Provider
from src.data.adapters.climatology_provider import IMD_Climatology_Provider
from src.data.adapters.boundary_provider import IndiaDistrictBoundaryProvider
from src.data.data_manager import DataManager


class TestDataArchitecture:
    """Verifies that the multi-source meteorological provider architecture functions correctly."""

    def test_gfs_provider_interface_and_bounds(self):
        provider = NOAA_GFS_Provider()
        assert "GFS" in provider.provider_name
        prov = provider.get_provenance()
        assert "NOAA" in prov["source_model"]

        # Query gridded data for benchmark bounding box
        df = provider.fetch_gridded_field(
            bbox=(18.0, 73.0, 19.5, 74.5),
            valid_date="2024-06-07",
        )
        assert df is not None
        assert not df.empty
        assert "latitude" in df.columns
        assert "longitude" in df.columns
        assert "raw_nwp_rainfall" in df.columns

        # Verify coordinates lie within Indian subcontinent bounds (6.0N-38.0N, 68.0E-98.0E)
        assert (df["latitude"] >= 6.0).all() and (df["latitude"] <= 38.0).all()
        assert (df["longitude"] >= 68.0).all() and (df["longitude"] <= 98.0).all()

    def test_era5_provider_interface(self):
        provider = ECMWF_ERA5_Provider()
        assert provider.provider_name == "ECMWF_ERA5_REANALYSIS"
        prov = provider.get_provenance()
        assert "ERA5" in prov["source_model"]

    def test_imd_observation_provider_benchmark_bounds(self):
        provider = IMD_Observation_Provider()
        assert "IMD" in provider.provider_name

        # Query benchmark observations
        df = provider.fetch_observed_grid(
            bbox=(18.0, 73.0, 19.5, 74.5),
            valid_date="2024-06-07",
        )
        assert df is not None
        assert not df.empty
        assert "latitude" in df.columns
        assert "longitude" in df.columns
        assert "observed_rainfall" in df.columns

        # Ensure no negative observed rainfall
        assert (df["observed_rainfall"] >= 0.0).all()

    def test_gpm_imerg_provider_interface(self):
        provider = GPM_IMERG_Provider()
        assert "GPM" in provider.provider_name

    def test_boundary_provider_all_763_districts(self):
        provider = IndiaDistrictBoundaryProvider.get_instance()
        districts = provider.get_all_districts()
        assert len(districts) == 763, f"Expected 763 districts, got {len(districts)}"

        states = provider.get_all_states()
        assert len(states) >= 36, f"Expected at least 36 States/UTs, got {len(states)}"

        # Verify Pune polygon exists and has valid geometry
        pune_gdf = provider.get_district_polygon("pune")
        assert pune_gdf is not None
        assert not pune_gdf.empty
        assert pune_gdf.geometry.iloc[0].is_valid

        # Verify centroid for Pune is around 18.52N, 73.85E
        info = provider.get_district_info("pune")
        assert info is not None
        assert 18.0 <= info["latitude"] <= 19.5
        assert 73.0 <= info["longitude"] <= 75.0

    def test_climatology_provider_normal_and_anomaly(self):
        provider = IMD_Climatology_Provider()
        # June normal for Pune should be positive
        norm = provider.get_monthly_normal("PUNE", month=6)
        assert norm > 0.0

        # Departure percentage: 200 mm when normal is 100 mm -> +100% (Excess)
        anom, dep, cat = provider.compute_anomaly("PUNE", actual_rainfall_mm=200.0, month=6)
        assert dep > 0.0
        assert cat in ["NORMAL", "EXCESS", "LARGE_EXCESS"]

        # 0 mm when normal is 100 mm -> -100% (Large Deficient)
        anom_dry, dep_dry, cat_dry = provider.compute_anomaly("PUNE", actual_rainfall_mm=0.0, month=6)
        assert dep_dry == -100.0
        assert cat_dry == "LARGE_DEFICIENT"

    def test_data_manager_status_matrix_and_zero_fabrication(self):
        dm = DataManager()
        matrix = dm.get_national_data_matrix()

        assert matrix["total_supported_districts"] == 763
        assert matrix["validated_benchmark_districts"] == 8
        assert matrix["data_unavailable_districts"] == 755
        assert matrix["total_supported_districts"] == matrix["validated_benchmark_districts"] + matrix["data_unavailable_districts"]

        # Verify Pune is validated
        pune_status = dm.determine_district_data_status("pune")
        assert pune_status == DataStatus.VALIDATED_FORECAST

        # Verify an unmonitored district returns DATA_UNAVAILABLE (zero fabrication policy)
        unmonitored_status = dm.determine_district_data_status("lucknow")
        assert unmonitored_status == DataStatus.DATA_UNAVAILABLE
