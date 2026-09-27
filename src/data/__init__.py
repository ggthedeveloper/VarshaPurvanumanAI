"""
Data architecture package for VarshaPurvanumanAI.
"""
from src.data.base_provider import (
    DataStatus,
    NWPProvider,
    ObservationProvider,
    AtmosphericDataProvider,
    DistrictBoundaryProvider,
    ClimatologyProvider,
)
from src.data.adapters.nwp_gfs_provider import NOAA_GFS_Provider
from src.data.adapters.nwp_era5_provider import ERA5_Provider
from src.data.adapters.observation_imd_provider import IMD_Observation_Provider
from src.data.adapters.observation_gpm_provider import GPM_IMERG_Provider
from src.data.adapters.boundary_provider import IndiaDistrictBoundaryProvider
from src.data.adapters.climatology_provider import IMD_Climatology_Provider
from src.data.data_manager import DataManager

__all__ = [
    "DataStatus",
    "NWPProvider",
    "ObservationProvider",
    "AtmosphericDataProvider",
    "DistrictBoundaryProvider",
    "ClimatologyProvider",
    "NOAA_GFS_Provider",
    "ERA5_Provider",
    "IMD_Observation_Provider",
    "GPM_IMERG_Provider",
    "IndiaDistrictBoundaryProvider",
    "IMD_Climatology_Provider",
    "DataManager",
]
