# DATA_COMPATIBILITY.md: Meteorological Data Compatibility & Feasibility Matrix
## Project: Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts (SIH26080)
**Validation Date:** 2026-09-22  
**Validation Standard:** Pure Real Data Only — No Synthetic Substitution — Traceable Provenance

---

### 1. NWP DATA VALIDATION

| Attribute | Specification & Validation Finding |
| :--- | :--- |
| **Provider** | National Oceanic and Atmospheric Administration (NOAA) / National Centers for Environmental Prediction (NCEP) |
| **Dataset** | Global Forecast System (GFS) 0.25° Atmospheric Model Operational Forecast Archive |
| **Official URL** | NOAA AWS Open Data: `https://noaa-gfs-bdp-pds.s3.amazonaws.com/` / NOMADS: `https://nomads.ncep.noaa.gov/` / Open-Meteo GFS Archive: `https://historical-forecast-api.open-meteo.com/v1/forecast` & `https://previous-runs-api.open-meteo.com/v1/forecast` |
| **Spatial Resolution** | 0.25° x 0.25° regular latitude-longitude grid (~27 km at equator) |
| **Variables Verified** | Total Precipitation (`precipitation`), 2m Temperature (`temperature_2m`), 2m Relative Humidity (`relative_humidity_2m`), Surface Pressure (`surface_pressure`), 10m Wind Speed (`wind_speed_10m`), 10m Wind Direction (`wind_direction_10m`), Convective Available Potential Energy (`cape`) |
| **Forecast Initialization** | 4 daily operational cycles: 00:00, 06:00, 12:00, 18:00 UTC |
| **Forecast Lead Time** | Hourly out to 120 hours; 3-hourly from 120 to 384 hours. Fixed lead-day offsets (Day 1: +24h, Day 2: +48h, Day 3: +72h, Day 4: +96h, Day 5: +120h) verified via `lead_time_days` parameter |
| **Historical Availability** | Verified active and queryable from 2021 through 2025 (tested 2021-07-15, 2022-07-15, 2023-07-15, 2024-07-15, 2025-07-15) |
| **India Coverage** | Global coverage; full Indian landmass and maritime domain (6.5°N–38.5°N, 66.5°E–100.0°E) |
| **Download Method** | Automated HTTP REST API (sub-grid spatial extraction) and direct AWS S3 GRIB2 object download |
| **Access Restrictions** | Open access (Public Domain / CC0); no authentication, paywall, or API keys required for research access |

---

### 2. OBSERVATION DATA VALIDATION

#### Product A: Official IMD District-Level Daily Rainfall Bulletin
| Attribute | Specification & Validation Finding |
| :--- | :--- |
| **Provider** | India Meteorological Department (IMD) - Hydromet Division |
| **Dataset** | Daily District Rainfall Monitoring Product (Customized Rainfall Information System / Mausam) |
| **Official URL** | `https://mausam.imd.gov.in/responsive/rainfallinformation.php` |
| **Spatial Resolution** | District administrative level (761 districts across 36 States/UTs) |
| **Variables Verified** | Actual Daily Rainfall (`Actual : X.X mm`), Normal Daily Rainfall (`Normal : Y.Y mm`), Departure Percentage (`Departure : Z%`) |
| **Temporal Frequency** | Daily 24-hour accumulation (08:30 IST to 08:30 IST, corresponding to 03:00 UTC to 03:00 UTC) |
| **Historical Availability** | Real-time and recent operational days available via web portal; long-term daily archives require bulk tables |
| **India Coverage** | Complete national coverage (all 36 States/UTs) |
| **Download Method** | Automated HTTPS extraction and parsing of the embedded JSON record array from `mausam.imd.gov.in` |
| **Access Restrictions** | Publicly accessible via web portal; no API credentials required |

#### Product B: IMD Official District Boundaries GeoJSON
| Attribute | Specification & Validation Finding |
| :--- | :--- |
| **Provider** | India Meteorological Department (IMD) - GIS Unit |
| **Dataset** | IMD Operational District Boundary Vector Layer (`DISTRICT_F-2.json`) |
| **Official URL** | `https://mausam.imd.gov.in/imd_latest/contents/district_shapefiles/DISTRICT_F-2.json` |
| **Spatial Resolution** | Vector polygon geometry (675 district polygons verified) |
| **Variables Verified** | `OBJECTID`, `DISTRICT` name (strictly aligned with IMD rainfall reports), `Shape_Area` |
| **Temporal Frequency** | Static administrative boundary layer |
| **Historical Availability** | Current operational standard |
| **India Coverage** | National |
| **Download Method** | Direct HTTPS download (6.5 MB GeoJSON) |
| **Access Restrictions** | Open public access on official IMD web server |

#### Product C: IMD 0.25° Gridded Rainfall Observation Benchmark (Western Ghats Regime)
| Attribute | Specification & Validation Finding |
| :--- | :--- |
| **Provider** | India Meteorological Department (IMD Pune) / Citable Scientific Research Mirror |
| **Dataset** | IMD 0.25° x 0.25° Daily Gridded Rainfall & Dense Rain Gauge Network Extract |
| **Official URL** | Zenodo DOI: `10.5281/zenodo.20177433` (Source: IMD Pune Daily Gridded Data, Pai et al., 2014) |
| **Spatial Resolution** | 0.25° x 0.25° regular grid and station gauge points |
| **Variables Verified** | Daily rainfall accumulation (`mm/day`) |
| **Temporal Frequency** | Daily (08:30 IST to 08:30 IST) |
| **Historical Availability** | Multi-year summer monsoon periods (JJAS) |
| **India Coverage** | Western Ghats and coastal peninsular domain (14°N–19°N, 73°E–76°E) |
| **Download Method** | Direct HTTP download via Zenodo REST API (`Daily_IMD_0.25x0.25Grid.xlsx`, `Daily_RG_0.25x0.25Grid.xlsx`) |
| **Access Restrictions** | Creative Commons Attribution 4.0 International; open download |

---

### 3. MATCHING FEASIBILITY ANALYSIS

#### Can NWP and observations be matched spatially?
**YES.**
1. **Grid-to-Grid Matching (0.25°)**:
   Both NOAA GFS and IMD gridded products share the identical 0.25° x 0.25° regular latitude-longitude grid spacing. Grid points along integer multiples of 0.25° ($15.00^\circ, 15.25^\circ, 15.50^\circ, \dots$) co-register directly.
2. **Grid-to-District Matching**:
   Using the verified IMD district vector boundary (`DISTRICT_F-2.json`, 675 districts), all GFS grid nodes lying within each district polygon are spatially aggregated using area-weighted centroid averaging to match IMD's district rainfall reports.

#### Can NWP and observations be matched temporally?
**YES.**
1. IMD observations represent a 24-hour accumulation window ending at 08:30 IST (03:00 UTC) on date $D$.
2. Raw NWP precipitation is extracted at hourly resolution and summed from 03:00 UTC on date $D-1$ to 03:00 UTC on date $D$. This achieves exact 1:1 temporal synchronization with the official IMD observation window.

#### What interpolation/regridding is required?
- **Grid-level**: Bilinear interpolation or exact node alignment across the 0.25° grid.
- **District-level**: Spatial point-in-polygon assignment with inverse-distance or equal-area weighting across grid points within the district polygon.

#### What unit conversions are required?
- Precipitation: GFS delivers $mm$ (equivalent to $kg/m^2$); IMD delivers $mm$. **Factor = 1.0 (no conversion required)**.
- Temperature: GFS delivers $^\circ\text{C}$; IMD normals in $^\circ\text{C}$. **Factor = 1.0**.
- Surface Pressure: GFS delivers $hPa$; standard meteorological analysis in $hPa$. **Factor = 1.0**.
- Wind Speed: GFS delivers $km/h$ or $m/s$. Standardized to $m/s$ ($1\text{ m/s} = 3.6\text{ km/h}$).

#### What forecast lead times can be evaluated?
- **Day 1 (+24 hours)**: Short-range operational forecast.
- **Day 2 (+48 hours)**: Standard 2-day medium-range warning window.
- **Day 3 (+72 hours)**: 3-day medium-range outlook.
- **Day 4 (+96 hours)** and **Day 5 (+120 hours)**: Extended medium-range guidance.

#### What period can be used for train/validation/test?
To strictly prevent temporal data leakage, an event-based chronological split over peak Summer Monsoon seasons (JJAS: June 1 to September 30) will be used:
- **Training Period**: JJAS 2021, JJAS 2022, JJAS 2023 (~366 operational monsoon days).
- **Validation Period**: JJAS 2024 (~122 operational monsoon days).
- **Test Period**: JJAS 2025 (~122 operational monsoon days).

---

### 4. FINAL DECISION

**CLASSIFICATION:** **PARTIALLY READY**

#### Justification:
1. **Supported and Verified (READY TO IMPLEMENT)**:
   - Real NWP Forecast Ingestion: NOAA GFS 0.25° operational forecast time series and lead-time runs (Day 1 to Day 5) are 100% verified, active, and programmatically queryable without authentication.
   - Real District-Level Observation Ingestion: IMD official daily district rainfall records across 761 districts and official IMD district boundary GeoJSON (675 districts) are 100% verified, active, and downloadable directly from `mausam.imd.gov.in`.
   - Real Orographic Regime Benchmark: Zenodo-hosted IMD 0.25° gridded observation benchmark (Record 20177433) is open and accessible.

2. **Blocked / Pending Data Access**:
   - Automated direct bulk download of IMD Pune long-term `.grd` binary files (`imdpune.gov.in/cmpg/Griddata/rainfall.php`) is network-blocked from non-NIC IPs due to firewall timeouts on port 443 and malformed HTTP 301 redirects on port 80.
   - Bulk automated downloading of NCMRWF raw NCUM operational GRIB model runs (`rds.ncmrwf.gov.in`) requires MoES registered institutional credentials.

#### Operational Strategy:
- Build the real data ingestion engine for NOAA GFS 0.25° NWP forecasts (covering the Core Monsoon Zone and Western Ghats).
- Build the real observation ingestion engine for IMD District Rainfall and IMD 0.25° observation benchmarks.
- Provide a standardized local adapter (`data/raw/ncmrwf/` and `data/raw/imd_gridded/`) so that if the user places official NCMRWF NCUM GRIB or IMD Pune `.grd` files in the repository, the pipeline immediately recognizes and processes them without code modification.
