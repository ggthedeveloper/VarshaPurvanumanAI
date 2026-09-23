# Feature Quality & Engineering Report
## Project: Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts (SIH26080)
**Report Date:** 2026-09-22  
**Phase:** Phase 3 Feature Engineering  
**Standard:** Strictly Empirical Statistics — Zero Target Leakage — No Fabricated Values

---

### 1. Dataset Partitioning & Sample Sizes

The primary multi-year Summer Monsoon benchmark dataset ([`data/processed/paired_monsoon_benchmark.csv`](file:///Users/gg/Desktop/VarhsaPurvanumanAI/data/processed/paired_monsoon_benchmark.csv)) consists of **397 real, continuous daily paired instances** combining real NOAA GFS 0.25° NWP forecasts with real IMD 0.25° gridded rainfall observations.

A strict chronological split was executed to eliminate temporal look-ahead leakage:

| Split Set | Start Date (UTC) | End Date (UTC) | Operational Period | Sample Count | Percentage |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **TRAIN** | 2021-06-01 | 2022-09-30 | Summer Monsoon (JJAS) 2021 & 2022 | **244** | 61.5% |
| **VALIDATION** | 2023-06-01 | 2023-09-30 | Summer Monsoon (JJAS) 2023 | **122** | 30.7% |
| **TEST** | 2024-06-01 | 2024-07-01 | Summer Monsoon (June) 2024 | **31** | 7.8% |
| **TOTAL** | 2021-06-01 | 2024-07-01 | 4 Summer Monsoon Seasons | **397** | 100.0% |

- **Temporal Integrity Verification:** Maximum training date (`2022-09-30`) is strictly earlier than minimum validation date (`2023-06-01`). Maximum validation date (`2023-09-30`) is strictly earlier than minimum test date (`2024-06-01`). Verified zero temporal overlap.

---

### 2. Feature Dimensions & Missingness

- **Total Engineered Features:** 29 numerical features (cataloged in [`docs/FEATURE_CATALOG.md`](file:///Users/gg/Desktop/VarhsaPurvanumanAI/docs/FEATURE_CATALOG.md))
- **Missingness in Training Matrix (`X_train`):**
  - Atmospheric NWP predictors: 0 missing values (100% complete)
  - Temporal predictors: 0 missing values (100% complete)
  - Spatial predictors: 0 missing values (100% complete)
  - Historical antecedent lags (`nwp_rainfall_lag1`, `nwp_rainfall_rolling3`): Only 2 boundary days at the seasonal onset of June 1 where preceding non-monsoon days were uninitialized (imputed strictly using training-set median values).
- **Target Missingness (`y_train`):** 0 missing values in matched records.

---

### 3. Summary Statistics of Core Meteorological Predictors

Calculated from raw training instances before standard scaling:

| Feature Name | Category | Units | Minimum | Maximum | Mean | Std Dev |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `nwp_rainfall` | NWP | mm | 0.00 | 129.90 | 6.24 | 12.12 |
| `log_nwp_rainfall`| NWP | - | 0.00 | 4.87 | 1.15 | 1.18 |
| `temperature_2m` | NWP | °C | 21.40 | 31.59 | 24.50 | 1.90 |
| `relative_humidity_2m` | NWP | % | 41.33 | 96.88 | 81.76 | 9.79 |
| `dew_point_depression` | NWP | °C | 0.62 | 11.73 | 3.65 | 1.96 |
| `surface_pressure` | NWP | hPa | 932.77 | 944.11 | 939.95 | 2.02 |
| `wind_speed_ms` | NWP | m/s | 1.83 | 9.86 | 5.38 | 1.62 |
| `u_wind_10m` | NWP | m/s | -1.53 | 9.77 | 4.95 | 1.90 |
| `v_wind_10m` | NWP | m/s | -4.42 | 4.34 | 0.81 | 1.34 |
| `cape` | NWP | J/kg | 32.50 | 2580.40 | 567.80 | 412.15 |
| `w_max_convective` | NWP | m/s | 8.06 | 71.84 | 31.25 | 12.45 |

---

### 4. Correlation with Real Observed Target (`observed_rainfall`)

Empirical Pearson correlations computed on the training set ($N = 244$):

| Rank | Feature | Description | Pearson $r$ |
| :---: | :--- | :--- | :---: |
| 1 | `log_nwp_rainfall` | Log-transformed forecast rainfall | **+0.3768** |
| 2 | `wind_speed_ms` | 24-hour maximum wind speed | -0.2851 |
| 3 | `nwp_rainfall` | Raw NWP forecast precipitation | **+0.2590** |
| 4 | `u_wind_10m` | Zonal low-level westerly wind component | -0.2410 |
| 5 | `cos_month` | Seasonal cosine progression | +0.2129 |
| 6 | `relative_humidity_2m` | Mean column relative humidity | +0.1874 |
| 7 | `surface_pressure` | Mean surface atmospheric pressure | -0.1652 |

**Key Meteorological Insight:**  
The raw NWP rainfall exhibits a moderate positive correlation ($r = 0.2590$) with observations, but the log-transformed forecast rainfall substantially increases linear correlation to **$r = 0.3768$**, validating our physical hypothesis that variance-stabilizing transformations better capture monsoon rainfall dynamics.

---

### 5. Empirical Target Distribution (IMD Official Categories)

Measured across all 397 real observations:

| IMD Rainfall Category | Daily Accumulation Range | Sample Count | Percentage |
| :--- | :---: | :---: | :---: |
| **No Rain** | $< 0.1$ mm | 184 | 46.35% |
| **Very Light Rain** | $0.1$ to $2.4$ mm | 76 | 19.14% |
| **Light Rain** | $2.5$ to $15.5$ mm | 96 | 24.18% |
| **Moderate Rain** | $15.6$ to $64.4$ mm | 40 | 10.08% |
| **Heavy Rain** | $64.5$ to $115.5$ mm | 1 | 0.25% |
| **Very Heavy Rain** | $115.6$ to $204.4$ mm | 0 | 0.00% |
| **Extremely Heavy Rain**| $\ge 204.5$ mm | 0 | 0.00% |

- **Extreme Event Frequency:** Heavy rainfall occurred on 1 day ($0.25\%$) in this specific Western Ghats benchmark node during the sample period. No artificial oversampling or synthetic points were generated, preserving true operational class imbalance.
