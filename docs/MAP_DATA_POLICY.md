# VarshaPurvanumanAI (SIH26080) — Geographic Data & Mapping Policy

**Ministry of Earth Sciences (MoES) / Smart India Hackathon 2024**  
**Policy Version**: `v1.0.0`

---

## 1. Principles of Geographic Data Integrity

In strict adherence to the SIH26080 problem statement and the guidelines of the Ministry of Earth Sciences (MoES) and India Meteorological Department (IMD), this system enforces a zero-tolerance policy against geographic fabrication:

1. **No Polygon Fabrication**: All administrative boundary polygons rendered on the dashboard map are sourced directly from verified repository assets (`data/raw/boundaries/DISTRICT_F-2.json`). Boundaries are never drawn, generated, or approximated algorithmically.
2. **No Coordinate Fabrication**: All 78 administrative district headquarters and centroids are defined according to verified Survey of India / IMD coordinates (`src/ingestion/observations/imd_district/district_centroids.py`).
3. **No Synthetic Spatial Interpolation**: When gridded spatial observations are not present, the system does not interpolate point observations across entire administrative districts.

---

## 2. Station-Level Benchmark Scope (Pune Station)

The active observational dataset paired with GFS NWP inputs corresponds to the **Pune Benchmark Station**:
- **WGS-84 Coordinates**: `18.50°N, 73.80°E`
- **Scope**: **Station-level benchmark** point forecast.
- **Rule**: This station is explicitly labeled:
  `"PUNE BENCHMARK STATION"`
  and:
  `"Station-level benchmark"`
- **Prohibition**: This station forecast is **never** labeled as a `"Pune District Spatial Forecast"` because assigning a single point measurement to an entire $15,643\text{ km}^2$ heterogeneous terrain (stretching from the Western Ghats crest to the Deccan plateau) constitutes a serious meteorological error.

---

## 3. Unmonitored Districts & Transparent Unavailability

- When an administrative district without verified local telemetry or active paired benchmarks is queried (e.g., Nagpur, Bhopal, Solapur), the system returns:
  `"DISTRICT-LEVEL DATA UNAVAILABLE"`
- The system explains that telemetry is currently restricted to the Pune Benchmark Station.
- **Prohibition**: The system **never** replaces missing district rainfall with `0.0 mm` or a synthetic number. Missing data remains explicitly `DATA UNAVAILABLE` or `N/A`.

---

## 4. Fractions Skill Score (FSS) Spatial Grid Requirements

The Fractions Skill Score (Roberts & Lean, 2008) evaluates spatial displacement error as a function of spatial scale.
- **Mathematical Requirement**: FSS requires simultaneous 2-D forecast grids $M(x, y)$ and 2-D gridded observation fields $O(x, y)$ (e.g., Doppler weather radar reflectivity composites or high-resolution satellite precipitation grids).
- **Current Dataset Constraint**: The current benchmark evaluation cohort is based on paired point-station observations.
- **Policy**: FSS is explicitly declared:
  **`NOT COMPUTABLE`**
  with the reason:
  *"Current evaluation data is point-based and does not provide the required 2-D spatial forecast/observation grid."*
- Displaying a synthetic or scalar approximation as an FSS score is strictly prohibited.
