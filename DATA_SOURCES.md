# DATA_SOURCES.md: Authoritative Meteorological Data Inventory
## Project: Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts (SIH26080)
**Compiled Date:** 2026-09-22  
**Validation Status:** Phase 1 & Phase 2 Verified & Tested  
**Standard:** Highest Priority Rule — Real, Authoritative, Publicly Accessible Data Only

---

### 1. Data Validation Summary

#### NWP Forecast Source (Primary Open Access):
- **Model**: NOAA NCEP Global Forecast System (GFS) 0.25°
- **Provider**: National Oceanic and Atmospheric Administration (NOAA) / NCEP
- **Access Endpoints**:
  - Open-Meteo Previous Runs API: `https://previous-runs-api.open-meteo.com/v1/forecast` (fixed lead times Day 1 to Day 5)
  - Open-Meteo Historical Forecast API: `https://historical-forecast-api.open-meteo.com/v1/forecast` (seamless time series)
  - AWS Open Data GFS Bucket: `https://noaa-gfs-bdp-pds.s3.amazonaws.com/` (global GRIB2 archive)
  - NOAA NOMADS: `https://nomads.ncep.noaa.gov/` (operational rolling archive)
- **Verified Variables**: Total Precipitation (`precipitation`, mm), 2m Temperature (`temperature_2m`, °C), 2m Relative Humidity (`relative_humidity_2m`, %), Surface Pressure (`surface_pressure`, hPa), 10m Wind Speed (`wind_speed_10m`, km/h or m/s), 10m Wind Direction (`wind_direction_10m`, °), Convective Available Potential Energy (`cape`, J/kg).
- **Temporal Resolution**: Hourly and Daily.
- **Spatial Resolution**: 0.25° x 0.25° regular latitude-longitude grid.
- **Coverage**: Global, including entire Indian subcontinent (6.5°N–38.5°N, 66.5°E–100.0°E).
- **Historical Availability**: 2021 to 2025 verified active.
- **Access Restrictions**: Open Public Domain (CC0). No API keys or authentication required.

#### Observation Sources (Ground Truth):
1. **IMD Official Daily District Rainfall Bulletin**:
   - **Provider**: India Meteorological Department (IMD) - Hydromet Division
   - **Portal**: `https://mausam.imd.gov.in/responsive/rainfallinformation.php`
   - **Variables**: Actual Rainfall (mm), Normal Rainfall (mm), Departure (%).
   - **Coverage**: 761 districts across all Indian States and Union Territories.
   - **Temporal Window**: 24-hour accumulation ending at 08:30 IST (03:00 UTC).
   - **Status**: Verified active and programmatically extracted.
2. **IMD Official District Boundaries GeoJSON (WGS84 EPSG:4326)**:
   - **Provider**: India Meteorological Department (IMD) - GIS Unit
   - **URL**: `https://mausam.imd.gov.in/imd_latest/contents/district_shapefiles/INDIA_NEW_REDUCED1.json`
   - **Local Path**: `data/raw/boundaries/INDIA_NEW_REDUCED1.json` (27 MB)
   - **Features**: 763 official district polygons strictly aligned with IMD bulletins in native WGS84 decimal degrees.
   - **Status**: Downloaded and verified.
3. **IMD 0.25° Western Ghats Gridded Observation Benchmark**:
   - **Provider**: IMD Pune / Citable Scientific Research Repository (Zenodo)
   - **DOI**: `10.5281/zenodo.20177433`
   - **Files**: `Daily_IMD_0.25x0.25Grid.xlsx`, `Daily_Date_0.25x0.25Grid.xlsx`.
   - **Variables**: Daily rainfall accumulation (mm/day) across 0.25° grid and ground rain gauge network.
   - **Domain**: Western Ghats / Coastal peninsular domain (14°N–19°N, 73°E–76°E).
   - **Status**: Verified downloadable via Zenodo REST API.
4. **IMD Pune National 0.25° Gridded Binary Archive (Pai et al., 2014)**:
   - **Provider**: IMD Pune (Climate Research and Services)
   - **Portal**: `https://imdpune.gov.in/cmpg/Griddata/rainfall.php`
   - **Status**: Port 443 times out and Port 80 returns malformed redirect from non-NIC IPs. Pipeline provides local ingestion adapter (`data/raw/imd_gridded/user_provided/`) for user-provided `.grd` files.
5. **NCMRWF NCUM Operational NWP Forecasts**:
   - **Provider**: National Centre for Medium Range Weather Forecasting (NCMRWF), MoES
   - **Portal**: `https://rds.ncmrwf.gov.in/` / `https://nwp.ncmrwf.gov.in/`
   - **Status**: Bulk raw GRIB download requires MoES registered credentials. Pipeline provides local adapter (`data/raw/ncmrwf/`) for user-provided files.
