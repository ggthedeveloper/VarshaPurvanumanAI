# FEATURE_CATALOG.md: Traceable Meteorological Feature Catalog
## Project: Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts (SIH26080)
**Document Version:** 1.0  
**Phase:** Phase 3 Feature Engineering  
**Standard:** Strict Zero-Leakage Guarantee — Real Data Only — Physical Justification Required

---

### 1. NWP Atmospheric Features

```
Feature name: nwp_rainfall
Source dataset: NOAA NCEP GFS 0.25° Operational Forecast
Original variable: precipitation (hourly accumulated column total)
Units: mm
Transformation: Summed across the 24-hour IMD observation window: 03:01 UTC (D-1) to 03:00 UTC (D)
Temporal relationship: Forecast issued at initialization time (valid across D-1 to D)
Spatial relationship: Co-registered at grid point (lat, lon) or district centroid
Can it leak target information? NO (Produced exclusively by the numerical model prior to observation time)
Scientific justification: Direct numerical rainfall prediction; primary input variable for bias correction
Actual/Derived: Actual (Aggregated from hourly)
```

```
Feature name: log_nwp_rainfall
Source dataset: NOAA NCEP GFS 0.25° Operational Forecast
Original variable: precipitation
Units: dimensionless
Transformation: Natural logarithm of shifted rainfall: log(1 + max(0, nwp_rainfall))
Temporal relationship: Aligned with forecast valid time
Spatial relationship: Co-registered at grid point (lat, lon)
Can it leak target information? NO
Scientific justification: Rainfall distributions exhibit strong positive skewness with high tail values; log-transformation stabilizes variance and improves linear/gradient model convergence
Actual/Derived: Derived
```

```
Feature name: wind_speed_ms
Source dataset: NOAA NCEP GFS 0.25° Operational Forecast
Original variable: wind_speed_10m
Units: m/s
Transformation: Converted from km/h to m/s via factor 1 / 3.6
Temporal relationship: 24-hour maximum within observation window
Spatial relationship: Co-registered at grid point (lat, lon)
Can it leak target information? NO
Scientific justification: Kinetic energy of atmospheric boundary layer; strong low-level winds drive moisture convergence and orographic ascent
Actual/Derived: Derived
```

```
Feature name: u_wind_10m
Source dataset: NOAA NCEP GFS 0.25° Operational Forecast
Original variable: wind_speed_10m, wind_direction_10m
Units: m/s
Transformation: Zonal wind vector: u = -v_wind * sin(deg_to_rad(wind_direction_10m))
Temporal relationship: 24-hour mean within observation window
Spatial relationship: Co-registered at grid point (lat, lon)
Can it leak target information? NO
Scientific justification: Westerly low-level monsoon flow (positive u) is the primary transport mechanism for moisture from the Arabian Sea across peninsular India
Actual/Derived: Derived
```

```
Feature name: v_wind_10m
Source dataset: NOAA NCEP GFS 0.25° Operational Forecast
Original variable: wind_speed_10m, wind_direction_10m
Units: m/s
Transformation: Meridional wind vector: v = -v_wind * cos(deg_to_rad(wind_direction_10m))
Temporal relationship: 24-hour mean within observation window
Spatial relationship: Co-registered at grid point (lat, lon)
Can it leak target information? NO
Scientific justification: Southerly cross-equatorial flow (positive v) indicates monsoon surge strength and cyclonic circulation around depressions
Actual/Derived: Derived
```

```
Feature name: temperature_2m
Source dataset: NOAA NCEP GFS 0.25° Operational Forecast
Original variable: temperature_2m
Units: °C
Transformation: 24-hour mean within observation window
Temporal relationship: Forecast valid across D-1 to D
Spatial relationship: Co-registered at grid point (lat, lon)
Can it leak target information? NO
Scientific justification: Governs surface sensible heat flux, boundary layer depth, and saturation vapor pressure via the Clausius-Clapeyron relation
Actual/Derived: Derived (24h mean of hourly)
```

```
Feature name: relative_humidity_2m
Source dataset: NOAA NCEP GFS 0.25° Operational Forecast
Original variable: relative_humidity_2m
Units: %
Transformation: 24-hour mean within observation window
Temporal relationship: Forecast valid across D-1 to D
Spatial relationship: Co-registered at grid point (lat, lon)
Can it leak target information? NO
Scientific justification: Column moisture saturation fraction; values > 85% strongly correlate with active convective precipitating clouds
Actual/Derived: Derived (24h mean of hourly)
```

```
Feature name: dew_point_depression
Source dataset: NOAA NCEP GFS 0.25° Operational Forecast
Original variable: temperature_2m, relative_humidity_2m
Units: °C
Transformation: Approximate depression: (100.0 - relative_humidity_2m) / 5.0
Temporal relationship: Forecast valid across D-1 to D
Spatial relationship: Co-registered at grid point (lat, lon)
Can it leak target information? NO
Scientific justification: Measures moisture deficit in lower atmosphere; values near 0°C indicate complete saturation and cloud base near ground level
Actual/Derived: Derived
```

```
Feature name: surface_pressure
Source dataset: NOAA NCEP GFS 0.25° Operational Forecast
Original variable: surface_pressure
Units: hPa
Transformation: 24-hour mean within observation window
Temporal relationship: Forecast valid across D-1 to D
Spatial relationship: Co-registered at grid point (lat, lon)
Can it leak target information? NO
Scientific justification: Pressure falls indicate passing low-pressure systems, monsoon troughs, and depressions
Actual/Derived: Derived (24h mean of hourly)
```

```
Feature name: cape
Source dataset: NOAA NCEP GFS 0.25° Operational Forecast
Original variable: cape (Convective Available Potential Energy)
Units: J/kg
Transformation: 24-hour mean within observation window
Temporal relationship: Forecast valid across D-1 to D
Spatial relationship: Co-registered at grid point (lat, lon)
Can it leak target information? NO
Scientific justification: Thermodynamic instability proxy; indicates available buoyant energy for thunderstorm and localized heavy precipitation development
Actual/Derived: Derived (24h mean of hourly)
```

```
Feature name: w_max_convective
Source dataset: NOAA NCEP GFS 0.25° Operational Forecast
Original variable: cape
Units: m/s
Transformation: Theoretical maximum updraft speed: sqrt(2 * max(0, cape))
Temporal relationship: Forecast valid across D-1 to D
Spatial relationship: Co-registered at grid point (lat, lon)
Can it leak target information? NO
Scientific justification: Linear scaling of updraft vertical velocity from parcel theory; distinguishes severe convective storms from gentle stratiform rain
Actual/Derived: Derived
```

---

### 2. Temporal Climatological Features

```
Feature name: forecast_lead_time
Source dataset: NWP Ingestion Pipeline
Original variable: lead_time_days
Units: days (integer: 1, 2, 3...)
Transformation: None (direct discrete lead time offset)
Temporal relationship: Time interval between forecast initialization and valid date
Spatial relationship: Invariant to location
Can it leak target information? NO
Scientific justification: NWP forecast skill degrades monotonically with increasing lead time; informs model of expected forecast uncertainty
Actual/Derived: Actual
```

```
Feature name: month
Source dataset: Observation timestamp
Original variable: timestamp
Units: month number (1 to 12)
Transformation: Calendar month extraction
Temporal relationship: Known at initialization time
Spatial relationship: Invariant to location
Can it leak target information? NO
Scientific justification: Captures seasonal solar cycle and annual monsoon progression
Actual/Derived: Derived
```

```
Feature name: day_of_year
Source dataset: Observation timestamp
Original variable: timestamp
Units: day number (1 to 366)
Transformation: Calendar day of year
Temporal relationship: Known at initialization time
Spatial relationship: Invariant to location
Can it leak target information? NO
Scientific justification: Captures fine-grained sub-seasonal climatological onset, peak, and withdrawal cycles
Actual/Derived: Derived
```

```
Feature name: sin_doy / cos_doy
Source dataset: Observation timestamp
Original variable: timestamp
Units: dimensionless ([-1, 1])
Transformation: sin(2 * pi * day_of_year / 365.25), cos(2 * pi * day_of_year / 365.25)
Temporal relationship: Known at initialization time
Spatial relationship: Invariant to location
Can it leak target information? NO
Scientific justification: Preserves cyclical circular continuity across year boundaries (Dec 31 to Jan 1)
Actual/Derived: Derived
```

```
Feature name: is_monsoon_season
Source dataset: Climatological definition
Original variable: timestamp
Units: binary (0 or 1)
Transformation: 1 if month in [6, 7, 8, 9] (June to September), else 0
Temporal relationship: Static calendar rule
Spatial relationship: Subcontinent-wide
Can it leak target information? NO
Scientific justification: IMD official Southwest Monsoon operational period
Actual/Derived: Derived
```

```
Feature name: is_monsoon_core
Source dataset: Climatological definition
Original variable: timestamp
Units: binary (0 or 1)
Transformation: 1 if month in [7, 8] (July and August), else 0
Temporal relationship: Static calendar rule
Spatial relationship: Subcontinent-wide
Can it leak target information? NO
Scientific justification: Objective definition of peak monsoon active/break spell monitoring (Rajeevan et al., 2008)
Actual/Derived: Derived
```

---

### 3. Spatial Geographic Features

```
Feature name: latitude
Source dataset: IMD Boundary / Grid coordinate
Original variable: latitude
Units: decimal degrees (°N)
Transformation: None
Temporal relationship: Static geographic feature
Spatial relationship: Point coordinate
Can it leak target information? NO
Scientific justification: Governs latitudinal position relative to the mean monsoon trough position (~20-25°N)
Actual/Derived: Actual
```

```
Feature name: longitude
Source dataset: IMD Boundary / Grid coordinate
Original variable: longitude
Units: decimal degrees (°E)
Transformation: None
Temporal relationship: Static geographic feature
Spatial relationship: Point coordinate
Can it leak target information? NO
Scientific justification: Captures zonal moisture gradient from the Arabian Sea (West) across Central India to the Bay of Bengal (East)
Actual/Derived: Actual
```

```
Feature name: in_core_monsoon_zone
Source dataset: Rajeevan et al. (2008, 2010) definition
Original variable: latitude, longitude
Units: binary (0 or 1)
Transformation: 1 if lat in [18, 28] and lon in [65, 88], else 0
Temporal relationship: Static geographic feature
Spatial relationship: Bounding box filter
Can it leak target information? NO
Scientific justification: Primary domain for Indian Summer Monsoon active and break spell classification
Actual/Derived: Derived
```

```
Feature name: in_western_ghats_belt
Source dataset: IMD Western Ghats climatological boundary
Original variable: latitude, longitude
Units: binary (0 or 1)
Transformation: 1 if lat in [8, 20] and lon in [72, 77], else 0
Temporal relationship: Static geographic feature
Spatial relationship: Orographic belt
Can it leak target information? NO
Scientific justification: Isolates steep coastal orographic terrain from interior rain shadow
Actual/Derived: Derived
```

```
Feature name: dist_to_coast_approx_km
Source dataset: Verified Indian coastline nodes
Original variable: latitude, longitude
Units: kilometers (km)
Transformation: Haversine distance to nearest coastline coordinate
Temporal relationship: Static geographic feature
Spatial relationship: Proximity to maritime boundary
Can it leak target information? NO
Scientific justification: Coastal regions experience strong diurnal sea-breeze convergence and marine boundary layer effects
Actual/Derived: Derived
```

---

### 4. Historical Antecedent Features (Zero-Leakage)

```
Feature name: nwp_rainfall_lag1
Source dataset: Historical GFS Forecast Series
Original variable: nwp_rainfall
Units: mm
Transformation: Shifted by 1 time step: shift(1) within time series group
Temporal relationship: Forecast valid on date D-1 (strictly prior to current target date D)
Spatial relationship: Co-registered at location
Can it leak target information? NO (Strictly past forecast; no current or future observation used)
Scientific justification: Atmospheric persistence; synoptic rainfall systems persist over 24-48 hours
Actual/Derived: Derived
```

```
Feature name: nwp_rainfall_rolling3
Source dataset: Historical GFS Forecast Series
Original variable: nwp_rainfall
Units: mm
Transformation: 3-day rolling mean of strictly prior forecasts: shift(1).rolling(3).mean()
Temporal relationship: Forecasts valid across D-3, D-2, D-1
Spatial relationship: Co-registered at location
Can it leak target information? NO (Zero look-ahead)
Scientific justification: Multi-day cumulative moisture trajectory proxy
Actual/Derived: Derived
```
