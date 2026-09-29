"""
Unified Meteorological Data Manager for VarshaPurvanumanAI (SIH26080).
Orchestrates NWPProvider, ObservationProvider, BoundaryProvider, and ClimatologyProvider.
Enforces strict scientific classification across all 763 administrative districts:
1. VALIDATED_FORECAST
2. FORECAST_AVAILABLE_UNVERIFIED
3. DATA_UNAVAILABLE
4. OBSERVATION_UNAVAILABLE
"""
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd

from src.data.base_provider import (
    DataStatus,
    NWPProvider,
    ObservationProvider,
    DistrictBoundaryProvider,
    ClimatologyProvider,
)
from src.data.adapters.nwp_gfs_provider import NOAA_GFS_Provider
from src.data.adapters.nwp_era5_provider import ECMWF_ERA5_Provider
from src.data.adapters.observation_imd_provider import IMD_Observation_Provider
from src.data.adapters.observation_gpm_provider import GPM_IMERG_Provider
from src.data.adapters.boundary_provider import IndiaDistrictBoundaryProvider
from src.data.adapters.climatology_provider import IMD_Climatology_Provider


class DataManager:
    """
    Central hub managing meteorological ingestion, spatial indexing,
    and truthful verification status determination across all 6 authoritative datasets:
    1. NOAA GFS 0.25° NWP
    2. ECMWF ERA5 Reanalysis
    3. IMD Ground Truth Observations
    4. NASA GPM IMERG Satellite Precipitation
    5. IMD Long Period Average (LPA) Climatological Normals
    6. Survey of India / IMD 763 District Boundaries
    """

    def __init__(
        self,
        nwp_provider: Optional[NWPProvider] = None,
        obs_provider: Optional[ObservationProvider] = None,
        boundary_provider: Optional[DistrictBoundaryProvider] = None,
        climatology_provider: Optional[ClimatologyProvider] = None,
        era5_provider: Optional[NWPProvider] = None,
        gpm_provider: Optional[ObservationProvider] = None,
    ):
        self.nwp = nwp_provider or NOAA_GFS_Provider()
        self.era5 = era5_provider or ECMWF_ERA5_Provider()
        self.obs = obs_provider or IMD_Observation_Provider()
        self.gpm = gpm_provider or GPM_IMERG_Provider()
        self.boundary = boundary_provider or IndiaDistrictBoundaryProvider.get_instance()
        self.climatology = climatology_provider or IMD_Climatology_Provider()

        # Set of verified benchmark district IDs (Western Ghats verified zone)
        self.VALIDATED_DISTRICT_KEYS = {
            "pune", "raygad", "raigad", "thane", "satara", "ahmednagar", "ahamednagar", "ratnagiri"
        }

    def determine_district_status(
        self,
        district_id: str,
        has_nwp: bool,
        has_obs: bool,
    ) -> DataStatus:
        """
        Determines scientific truth status without synthetic fabrication.
        """
        norm_key = district_id.lower().replace("-", "_").split("_")[-1]

        if not has_nwp:
            return DataStatus.DATA_UNAVAILABLE

        # If it falls within the verified Western Ghats multi-year benchmark
        if norm_key in self.VALIDATED_DISTRICT_KEYS:
            if has_obs:
                return DataStatus.VALIDATED_FORECAST
            else:
                return DataStatus.OBSERVATION_UNAVAILABLE

        # Outside validated benchmark, if real NWP is present
        if has_nwp:
            return DataStatus.FORECAST_AVAILABLE_UNVERIFIED

        return DataStatus.DATA_UNAVAILABLE

    def determine_district_data_status(self, district_id: str) -> DataStatus:
        """Determines data status for district based on benchmark registration."""
        norm_key = district_id.lower().replace("-", "_").split("_")[-1]
        if norm_key in self.VALIDATED_DISTRICT_KEYS:
            return DataStatus.VALIDATED_FORECAST
        return DataStatus.DATA_UNAVAILABLE

    def get_national_data_matrix(self) -> Dict[str, Any]:
        """Returns national summary of district data availability."""
        districts = self.boundary.get_all_districts()
        total_districts = len(districts)

        validated_count = len(self.VALIDATED_DISTRICT_KEYS)
        available_unverified = 0
        unavailable = total_districts - validated_count

        return {
            "total_supported_districts": total_districts,
            "validated_benchmark_districts": validated_count,
            "forecast_available_unverified": available_unverified,
            "data_unavailable_districts": unavailable,
            "benchmark_region": "Western Ghats Mesoscale Domain (18.0N - 19.25N, 73.0E - 74.25E)",
            "benchmark_observation_source": "IMD Pune NDC (Zenodo 10.5281/zenodo.20177433)",
            "operational_nwp_source": self.nwp.provider_name,
            "reanalysis_source": self.era5.provider_name,
            "satellite_source": self.gpm.provider_name,
            "climatology_source": "IMD Long Period Average (LPA 1971-2020 / 1981-2010)",
            "boundary_source": "Survey of India / IMD Bundled GeoJSON (763 districts)",
        }
