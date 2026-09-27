# LIMITATIONS.md: Scientific Bounds, System Constraints & Operational Roadmap
## Project: VarshaPurvanumanAI (SIH26080)
**Version:** 2.0.0  
**Status:** Mandatory Scientific Disclosure Document  

---

## 1. Domain & Geographical Boundaries

### 1.1. Mesoscale Domain vs. National Catalog
- **Current Ground Truth Domain**: The current multi-year calibrated machine learning models are strictly trained and validated over the **Western Ghats / Maharashtra Mesoscale Domain** ($18.0^\circ\text{N} - 19.5^\circ\text{N}, 73.0^\circ\text{E} - 74.5^\circ\text{E}$), comprising Pune, Raigad, Thane, Satara, Ahmednagar, and Ratnagiri districts.
- **National Scale Extrapolation**: While the system contains vector polygon boundaries and LPA climatological tables for all **763 administrative districts**, districts outside this benchmark currently default to `DATA_UNAVAILABLE` or `FORECAST_AVAILABLE_UNVERIFIED`.
- **Constraint**: Applying Western Ghats regime weights to dissimilar meteorological regimes (e.g., Western Himalayan lee slopes, Gangetic plain squall lines, or Tamil Nadu winter monsoon) without regional re-training will result in miscalibration.

---

## 2. NWP Spatial Resolution & Convective Physics

### 2.1. 0.25° Grid Limit vs. Cloudburst Scales
- **Resolution Limit**: Operational NOAA GFS runs at a nominal horizontal resolution of $0.25^\circ \approx 27\text{ km}$.
- **Convective Subgrid Dynamics**: Microscale convective events, intense local cloudbursts ($> 100\text{ mm/hr}$ over a few square kilometers), and narrow valley flash floods operate at scales much smaller than the 27 km grid box.
- **Operational Reality**: While the post-processor corrects systematic grid-box mean biases and computes exceedance probabilities, it cannot resolve individual subgrid convective updrafts without downscaling via convective-permitting models (e.g., WRF at $1-3\text{ km}$ or radar assimilation).

### 2.2. Precipitation Accumulation Windows
- **24-Hour Daily Block**: Predictions and observations are tied to the standard IMD meteorological day ($08:30\text{ IST}$ to $08:30\text{ IST}$).
- **Sub-Daily Disaggregation**: The current models do not provide 1-hour or 3-hour peak intensity hydrographs.

---

## 3. Ground Truth Gauge Sparsity & Regional Gaps

### 3.1. Observation-Sparse Regions
- **Himalayan High Altitude (Ladakh, Himachal, Uttarakhand)**: Extreme orography and sparse automated weather station (AWS) networks limit gridded gauge interpolation accuracy above 3,000 meters.
- **Northeast India (Arunachal, Nagaland, Manipur, Mizoram)**: Deep valleys, river gorges, and dense forest canopies create severe rain-shadow gradients with limited real-time telemetry.
- **Western Arid Desert (Thar Desert / Jaisalmer / Barmer)**: Low rainfall frequency makes statistical parameter estimation challenging during dry spells.

### 3.2. Telemetry Latency & Reporting Gaps
- Ground rain gauge reports submitted to IMD Pune NDC undergo rigorous retrospective quality control. However, operational real-time reports can suffer from gauge clogs, transmission outages during severe cyclonic landfalls, and delayed telemetry.

---

## 4. Operational Latency & Fallback Degradation

### 4.1. Network & Upstream Server Dependency
- **Upstream Latency**: Ingesting fresh 00Z NOAA GFS cycles via external HTTPS endpoints requires stable connectivity. If an upstream server experiences downtime or throttling, the system falls back to cached prior runs.
- **Model Inversion Fallback**: If an exotic weather regime has fewer than 50 historical training samples, the model engine gracefully degrades to the global post-processor. This fallback ensures zero runtime crashes but yields slightly higher continuous bias.

---

## 5. Strategic Development Roadmap

| Phase | Milestone Description | Target Timeline |
| :--- | :--- | :--- |
| **Phase 1 (Achieved)** | Complete India-wide data architecture, 763-district GIS boundaries, 8-class hierarchical regime classifier, verified Western Ghats post-processing suite, 122 automated test cases. | Q3 2026 |
| **Phase 2 (Near-Term)** | Direct integration of NCMRWF NCUM operational 4 km model outputs and IMD Doppler Weather Radar (DWR) composite reflectivity feeds. | Q1 2027 |
| **Phase 3 (Medium-Term)** | Multi-basin hydrological routing expansion (coupling post-processed rainfall with SWAT / HEC-HMS runoff models for flood discharge forecasting). | Q3 2027 |
| **Phase 4 (Long-Term)** | Full sub-kilometer convective-scale downscaling with physics-informed neural operators (PINOs) across all 36 Indian States and UTs. | 2028 |
