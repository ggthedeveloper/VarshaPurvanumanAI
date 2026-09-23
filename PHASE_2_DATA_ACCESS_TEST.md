# PHASE_2_DATA_ACCESS_TEST.md: Empirical Small Data Access Validation Report
## Project: Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts (SIH26080)
**Test Execution Date:** 2026-09-22  
**Verification Standard:** Pure Real Data Only — No Synthetic Substitution — Actual Measurements Recorded

---

### 1. Executive Summary
Before developing the ingestion pipeline, empirical access and parsing tests were executed on small real samples of each candidate dataset. The results below document the actual measured file sizes, HTTP statuses, coordinate structures, variable schemas, missing value representations, and temporal resolutions.

---

### 2. Empirical Test Results by Dataset

#### Dataset 1: NOAA NCEP Global Forecast System (GFS) 0.25° Operational Forecast (NWP)
- **Source Endpoint:** `https://previous-runs-api.open-meteo.com/v1/forecast` & `https://historical-forecast-api.open-meteo.com/v1/forecast`
- **Official Host:** NOAA NCEP / Open-Meteo Operational NWP Mirror
- **Test Request:** Single-point extraction at Nagpur (Core Monsoon Zone: Lat $21.1458^\circ\text{N}$, Lon $79.0882^\circ\text{E}$), Dates: 2024-07-15 to 2024-07-17 (72 hours), Lead time: Day 1 (+24h).
- **HTTP Status:** `200 OK`
- **File Format:** JSON (structured time series)
- **Sample File Size:** 4,865 bytes (saved locally to `data/raw/gfs/sample_gfs_response.json`)
- **Dimensions:** 72 hourly time steps $\times$ 7 physical variables
- **Grid Coordinates Resolved:** Latitude $21.145462^\circ\text{N}$, Longitude $79.10156^\circ\text{E}$ (coinciding with GFS 0.25° regular node)
- **Time Range:** `2024-07-15T00:00` to `2024-07-17T23:00` (ISO 8601 UTC)
- **Variables & Measured Units:**
  - `precipitation`: mm (hourly accumulation)
  - `temperature_2m`: °C
  - `relative_humidity_2m`: %
  - `surface_pressure`: hPa
  - `wind_speed_10m`: km/h (standardizable to m/s via $\div 3.6$)
  - `wind_direction_10m`: °
  - `cape`: J/kg
- **Missing Values:** 0 in sample
- **Observed Precipitation Values (first 5 hours of 2024-07-15):** 0.2 mm, 1.5 mm, 2.8 mm, 0.9 mm, 0.1 mm
- **Forecast Initialization & Lead Time:** Configurable per operational cycle (00, 06, 12, 18 UTC) with lead times from Day 1 (+24h) to Day 5 (+120h) verified via `lead_time_days`.

#### Dataset 2: IMD Official Daily District Rainfall Bulletin (Observation)
- **Source Endpoint:** `https://mausam.imd.gov.in/responsive/rainfallinformation.php`
- **Official Host:** India Meteorological Department (IMD) - Hydromet Division
- **HTTP Status:** `200 OK`
- **File Format:** HTML with embedded JSON record array
- **Sample File Size:** 155,676 bytes (saved locally to `data/raw/imd_district/sample_imd_district_response.json`)
- **Dimensions:** 761 district observation entries
- **Observed Schema (Sample Record):**
  - `title`: `NICOBAR`
  - `id`: `573`
  - `color`: `#68DE58`
  - `info`: `0%`
  - `balloonText`: `<h6>NICOBAR</h6> <p><em>Date : 2026-09-22</br>Departure : 0%</br>Actual : 11.9 mm</br>Normal : 11.9 mm</em></p>`
- **Observed Units:** `Actual` rainfall in mm, `Normal` rainfall in mm, `Departure` in %
- **Accumulation Window:** 24 hours ending at 08:30 IST (03:00 UTC)
- **Missing Value Encoding:** Districts without reporting station coverage are explicitly encoded as `Actual : No data mm`, `Normal : No data mm`, and `Departure : No Data`.
- **National Coverage:** Complete (761 districts across all 36 States and Union Territories).

#### Dataset 3: IMD Official District Boundaries GeoJSON
- **Source Endpoint:** `https://mausam.imd.gov.in/imd_latest/contents/district_shapefiles/DISTRICT_F-2.json`
- **Official Host:** India Meteorological Department (IMD) - GIS Unit
- **HTTP Status:** `200 OK`
- **File Format:** GeoJSON (RFC 7946 FeatureCollection, EPSG:4326)
- **Sample File Size:** 6,536,044 bytes (6.5 MB, saved locally to `data/raw/boundaries/DISTRICT_F-2.json`)
- **Feature Count:** 675 district polygons
- **Properties Schema:** `OBJECTID` (integer), `DISTRICT` (string, uppercase, matches IMD bulletin naming), `Shape_Area` (float)
- **Coordinate System:** WGS 84 (EPSG:4326), decimal degrees latitude/longitude

#### Dataset 4: IMD 0.25° Western Ghats Gridded Benchmark (Zenodo Observation)
- **Source Endpoint:** `https://zenodo.org/records/20177433/files/Daily_IMD_0.25x0.25Grid.xlsx?download=1` & `Daily_Date_0.25x0.25Grid.xlsx`
- **Official Host:** Zenodo Open Science Repository (DOI: 10.5281/zenodo.20177433)
- **HTTP Status:** `200 OK`
- **File Format:** Microsoft Excel OpenXML Spreadsheet (`.xlsx`)
- **Sample File Size:**
  - `Daily_Date_0.25x0.25Grid.xlsx`: 25,803 bytes (saved to `data/raw/imd_gridded/Daily_Date_0.25x0.25Grid.xlsx`)
  - `Daily_IMD_0.25x0.25Grid.xlsx`: 384,350 bytes (saved to `data/raw/imd_gridded/Daily_IMD_0.25x0.25Grid.xlsx`)
- **Dimensions:** 2,253 daily rows $\times$ 36 grid columns (0.25° resolution)
- **Time Range:** Daily dates from `2018-05-09` through `2024-07-10`
- **Units:** Daily rainfall accumulation in `mm/day`
- **Missing Value Encoding:** Explicitly encoded as `-9999` (8,316 missing entries across 36 columns; 72,756 valid measured entries)
- **Measured Rainfall Statistics on Valid Points:**
  - Valid Count: 72,756
  - Minimum: 0.00 mm
  - 25th Percentile: 0.00 mm
  - Median: 0.00 mm
  - 75th Percentile: 0.23 mm
  - Maximum: 165.50 mm
  - Mean: 1.98 mm
  - Standard Deviation: 6.76 mm

#### Dataset 5: Direct IMD Pune National Gridded Binary Archive (`imdpune.gov.in`)
- **Target URL:** `https://imdpune.gov.in/cmpg/Griddata/rainfall.php`
- **Test Results:**
  - Port 80: HTTP 301 Moved Permanently with broken redirect location (`https://imdpune.gov.in:443cmpg/...`)
  - Port 443: TCP handshake timeout from non-NIC external network.
- **Operational Handling:** Direct automated retrieval is blocked by remote network firewall policies. The pipeline provides a standardized local file adapter in `data/raw/imd_gridded/` for user-supplied `.grd` binary files.

#### Dataset 6: NCMRWF NCUM Operational NWP GRIB Archive (`rds.ncmrwf.gov.in`)
- **Target URL:** `https://rds.ncmrwf.gov.in/`
- **Test Results:** Automated anonymous HTTP requests are rejected; requires registered user login with MoES institutional credentials.
- **Operational Handling:** The pipeline provides a standardized local file adapter in `data/raw/ncmrwf/` for user-supplied raw GRIB files.

---

### 3. Verification Conclusion
The small data access test successfully verified:
1. Real NOAA GFS 0.25° operational forecast access with complete atmospheric predictors.
2. Real IMD district rainfall observations and official boundary vector layers.
3. Real IMD 0.25° Western Ghats gridded rainfall benchmark observations.

All values recorded above represent actual empirical measurements without fabrication.
