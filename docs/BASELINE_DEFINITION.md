# BASELINE_DEFINITION.md: Operational NWP Forecast Baseline Specification
## Project: Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts (SIH26080)
**Document Version:** 1.0  
**Phase:** Phase 3 Feature Engineering & Baseline Definition  
**Standard:** Strictly Real NWP Forecast — Zero Synthetic Substitution

---

### 1. Baseline Scientific Purpose
In Problem Statement SIH26080, the foundational benchmark against which all machine learning post-processing models (global ML and regime-aware ML) are evaluated is the **Raw Numerical Weather Prediction (NWP) Forecast**. 

The raw NWP baseline represents the unprocessed numerical rainfall forecast directly produced by the operational physics-based numerical atmospheric model without any statistical or AI post-processing correction.

---

### 2. Baseline Specification

| Property | Official Specification |
| :--- | :--- |
| **NWP Model** | NOAA NCEP Global Forecast System (GFS) 0.25° Seamless / Global Operational Run |
| **Provider** | National Oceanic and Atmospheric Administration (NOAA) / NCEP |
| **Ingestion Pipeline** | `src/ingestion/gfs/` via verified open HTTP archive (`historical-forecast-api.open-meteo.com` & `previous-runs-api.open-meteo.com`) |
| **Baseline Target Variable** | `nwp_rainfall` (Raw Forecast Precipitation) |
| **Raw Forecast Variable** | Total Column Precipitation (`precipitation` / `APCP`) |
| **Measurement Units** | Millimeters ($mm$), equivalent to $kg/m^2$ |
| **Spatial Resolution** | 0.25° x 0.25° regular latitude-longitude grid (~27 km at equator) |
| **Forecast Initialization** | 00:00 UTC (and 06, 12, 18 UTC cycles where evaluated) |
| **Forecast Lead Time** | Fixed lead times: Day 1 (+24 hours), Day 2 (+48 hours), Day 3 (+72 hours) |
| **Temporal Accumulation** | 24-hour continuous accumulation from 03:01 UTC on $(D-1)$ to 03:00 UTC on $D$ |
| **Observation Reference** | India Meteorological Department (IMD) 24-hour observation cycle ending at 08:30 IST on date $D$ |
| **Interpolation / Regridding** | None for 0.25° grid benchmark (direct co-registration); Point-in-polygon centroid average for district aggregation |

---

### 3. Fair Comparison Protocol
To guarantee scientifically traceable verification:
1. **Identical Evaluation Samples:** The raw NWP baseline will be evaluated on the exact same test instances as the AI post-processed forecasts.
2. **Identical Spatial Domain:** All comparisons are conducted over identical grid points and district polygons.
3. **Identical Accumulation Window:** Both raw NWP and post-processed forecasts are aligned to the exact IMD 03:00 UTC accumulation boundary.
4. **Metrics:** Root Mean Square Error (RMSE), Equitable Threat Score (ETS), Critical Success Index (CSI), Probability of Detection (POD), False Alarm Ratio (FAR), and Fractions Skill Score (FSS).
