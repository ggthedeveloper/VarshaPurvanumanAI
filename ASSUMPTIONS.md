# ASSUMPTIONS.md: Traceable Assumptions Register
## Project: Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts (SIH26080)

---

### Record 1: Operational Rainfall Thresholds
- **ASSUMPTION:** The operational categorical rainfall thresholds are:
  - No Rain: $< 0.1$ mm/day
  - Very Light Rain: $0.1$ to $2.4$ mm/day
  - Light Rain: $2.5$ to $15.5$ mm/day
  - Moderate Rain: $15.6$ to $64.4$ mm/day
  - Heavy Rain: $64.5$ to $115.5$ mm/day
  - Very Heavy Rain: $115.6$ to $204.4$ mm/day
  - Extremely Heavy Rain: $\ge 204.5$ mm/day
- **REASON:** Required for heavy rainfall probability estimation, categorical contingency table metrics (POD, FAR, CSI, ETS), and FSS evaluations.
- **SOURCE:** India Meteorological Department (IMD) Standard Operating Procedure (SOP) for Weather Forecasting and Warning Services.
- **OFFICIAL OR EXPERIMENTAL:** OFFICIAL
- **IMPACT:** Directly sets binary classification boundaries for heavy rainfall probability ($P(\text{Rain} \ge 64.5\text{ mm})$ and $P(\text{Rain} \ge 115.6\text{ mm})$).
- **CONFIGURATION LOCATION:** `config/thresholds.yaml` (to be created in Phase 1)

---

### Record 2: Active and Break Monsoon Regime Definition
- **ASSUMPTION:** Weather regimes for "Active Monsoon" and "Break Monsoon" are defined over the Core Monsoon Zone (CMZ: 18°N–28°N, 65°E–88°E) using normalized daily rainfall anomalies:
  - Active Monsoon Spell: Normalized rainfall anomaly $> +1.0$ for $\ge 3$ consecutive days.
  - Break Monsoon Spell: Normalized rainfall anomaly $< -1.0$ for $\ge 3$ consecutive days.
- **REASON:** Provides an objective, mathematically verifiable, peer-reviewed categorization rather than subjective guesswork.
- **SOURCE:** Rajeevan, M., et al. (2008, 2010); Pai, D.S., et al. (2014, 2015), IMD Climate Research & Services.
- **OFFICIAL OR EXPERIMENTAL:** OFFICIAL SCIENTIFIC DEFINITION
- **IMPACT:** Governs ground-truth regime labeling for the weather regime classifier.
- **CONFIGURATION LOCATION:** `config/regimes.yaml` (to be created in Phase 1)

---

### Record 3: Depression Weather Regime Identification
- **ASSUMPTION:** A day is classified under the "Depression" regime when an active monsoon depression or low-pressure system (surface wind speed 17–27 knots, closed isobaric structure, sea level pressure drop $\ge 2$ to $4$ hPa) is present within the Indian mainland or adjacent seas (Bay of Bengal / Arabian Sea).
- **REASON:** Cyclonic depressions cause intense, organized, localized rainbands distinct from broad monsoon surges.
- **SOURCE:** IMD Cyclone Warning Division & Operational Monsoon Reports.
- **OFFICIAL OR EXPERIMENTAL:** OFFICIAL METEOROLOGICAL DEFINITION
- **IMPACT:** Routes the forecast through the specialized Depression bias-correction sub-model.
- **CONFIGURATION LOCATION:** `config/regimes.yaml`

---

### Record 4: Coastal and Orographic Rainfall Regime
- **ASSUMPTION:** Days with strong westerly low-level flow (850 hPa wind speed $> 12$ m/s) impinging on the Western Ghats (Konkan, Goa, Coastal Karnataka, Kerala) producing sharp windward-to-leeward precipitation gradients are classified under the Coastal/Orographic regime.
- **REASON:** Orographic rainfall produces strong localized biases in NWP due to unresolved complex terrain.
- **SOURCE:** Francis & Gadgil (2006); IMD Climatological Studies of Orographic Precipitation.
- **OFFICIAL OR EXPERIMENTAL:** OFFICIAL SCIENTIFIC DEFINITION
- **IMPACT:** Activates orographic-specific ML post-processing trained on high-gradient terrain features.
- **CONFIGURATION LOCATION:** `config/regimes.yaml`

---

### Record 5: Primary Open NWP Ingestion Source
- **ASSUMPTION:** NOAA NCEP GFS 0.25° operational numerical weather forecasts are ingested as the initial open NWP benchmark and predictor stream, pending availability of local raw NCMRWF NCUM GRIB files.
- **REASON:** GFS provides fully open, unauthenticated, operational 0.25° NWP forecast runs covering the entire Indian subcontinent with all required physical atmospheric variables. NCMRWF bulk GRIB archives require registered institutional credentials.
- **SOURCE:** NOAA Open Data / Open-Meteo GFS seamless archive.
- **OFFICIAL OR EXPERIMENTAL:** EXPERIMENTAL ASSUMPTION — NOT OFFICIAL
- **IMPACT:** Allows complete real-data end-to-end pipeline execution without violating the strict prohibition against synthetic data. If the user provides NCMRWF raw files, the pipeline adapter will ingest them directly.
- **CONFIGURATION LOCATION:** `config/data_config.yaml`
