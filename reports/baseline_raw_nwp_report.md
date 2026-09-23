# Baseline A Verification Report: Raw NWP Forecast

## 1. Executive Summary
This report evaluates **Baseline A: Raw NOAA GFS 0.25° NWP Forecast** without any machine learning post-processing or empirical bias correction. It serves as the uncorrected physical benchmark against which ML post-processing (Phase 5 Global ML and Phase 6 Regime-Aware ML) is rigorously compared.

- **NWP Source:** NOAA Global Forecast System (GFS) 0.25° resolution
- **Observation Reference:** IMD 0.25° daily gridded observation benchmark (Pai et al. / IMD)
- **Forecast Horizon:** Lead time +24 hours (accumulated over 24h matching IMD 03:00 UTC standard)
- **Evaluation Discipline:** Identical held-out periods (Validation: JJAS 2023, Test: June 2024)

---

## 2. Continuous Verification Metrics

| Dataset Split | Samples (N) | Mean Obs (mm) | Mean NWP (mm) | RMSE (mm) | MAE (mm) | Mean Bias (mm) | Pearson $r$ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Train (JJAS 2021–2022)** | 244 | 4.72 | 6.86 | 13.9175 | 6.7953 | +2.1440 | 0.3842 |
| **Validation (JJAS 2023)** | 122 | 3.49 | 4.24 | 8.8670 | 4.0097 | +0.7547 | 0.4672 |
| **Test (June 2024)** | 31 | 6.44 | 9.20 | 11.6205 | 8.3466 | +2.7582 | 0.4090 |

### Key Physical Observations:
1. **Persistent Positive Bias (Over-Prediction):** Raw GFS displays a persistent positive wet bias across all three evaluation periods (+2.14 mm on Train, +0.75 mm on Validation, +2.76 mm on Test).
2. **Topographic Amplification:** Over the Western Ghats / Pune terrain, NWP grid-scale parameterized convection over-estimates precipitation volume, leading to high RMSE ($8.87$ to $13.92$ mm).

---

## 3. Categorical & Heavy Rainfall Skill Metrics

### A. Validation Set (JJAS 2023, N = 122)

| Threshold | Hits (H) | False Alarms (F) | Misses (M) | Correct Neg (C) | POD | FAR | CSI | ETS | FSS (w=3) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **$\ge 2.5$ mm (Rainy Day)** | 19 | 16 | 12 | 75 | 0.6129 | 0.4571 | 0.4043 | 0.2652 | 0.7507 |
| **$\ge 15.6$ mm (Moderate)** | 5 | 7 | 4 | 106 | 0.5556 | 0.5833 | 0.3125 | 0.2722 | 0.5279 |
| **$\ge 64.5$ mm (Heavy)** | 0 | 0 | 0 | 122 | N/A* | N/A* | N/A* | N/A* | 1.0000 |

*\*Note: 0 observed events $\ge 64.5$ mm occurred during the 2023 validation season at this station. In accordance with SIH26080 guidelines, undefined zero-denominator metrics are reported as N/A rather than fabricated.*

### B. Held-Out Test Set (June 2024, N = 31)

| Threshold | Hits (H) | False Alarms (F) | Misses (M) | Correct Neg (C) | POD | FAR | CSI | ETS | FSS (w=3) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **$\ge 2.5$ mm (Rainy Day)** | 10 | 8 | 3 | 10 | 0.7692 | 0.4444 | 0.4762 | 0.1823 | 0.8426 |
| **$\ge 15.6$ mm (Moderate)** | 2 | 5 | 4 | 20 | 0.3333 | 0.7143 | 0.1818 | 0.0669 | 0.4918 |
| **$\ge 64.5$ mm (Heavy)** | 0 | 0 | 0 | 31 | N/A* | N/A* | N/A* | N/A* | 1.0000 |

---

## 4. Regime-Stratified Performance Analysis

Evaluating the Raw NWP baseline separately across verified weather regimes:

### Validation Set (JJAS 2023):
- **`ACTIVE_MONSOON` (N=9):** Mean Obs = 10.78 mm, Mean NWP = 8.79 mm | **RMSE = 12.2250 mm**, MAE = 8.2127 mm, Bias = -1.9864 mm (GFS under-forecasts vigorous active surges).
- **`BREAK_MONSOON` (N=18):** Mean Obs = 0.39 mm, Mean NWP = 0.46 mm | **RMSE = 1.1307 mm**, MAE = 0.7083 mm, Bias = +0.0702 mm (Well captured low precipitation during trough foothill migration).
- **`COASTAL_OROGRAPHIC` (N=15):** Mean Obs = 0.12 mm, Mean NWP = 1.64 mm | **RMSE = 4.5481 mm**, MAE = 1.5215 mm, Bias = +1.5215 mm (Over-predicts spillover onto the lee ridge).
- **`DEPRESSION` (N=7):** Mean Obs = 0.54 mm, Mean NWP = 0.33 mm | **RMSE = 0.7795 mm**, MAE = 0.4950 mm, Bias = -0.2093 mm.
- **`OTHER` (N=73):** Mean Obs = 4.33 mm, Mean NWP = 5.52 mm | **RMSE = 10.4091 mm**, MAE = 5.1539 mm, Bias = +1.1963 mm.

### Test Set (June 2024):
- **`COASTAL_OROGRAPHIC` (N=3):** Mean Obs = 0.49 mm, Mean NWP = 7.70 mm | **RMSE = 10.2966 mm**, MAE = 7.2056 mm, Bias = +7.2056 mm (Severe topographic over-forecast).
- **`OTHER` (N=28):** Mean Obs = 7.08 mm, Mean NWP = 9.36 mm | **RMSE = 11.7535 mm**, MAE = 8.4689 mm, Bias = +2.2817 mm.

---

## 5. Baseline A Operational Deficiencies
1. **Severe False Alarm Ratio at Moderate Thresholds:** At $\ge 15.6$ mm, Raw NWP produces a False Alarm Ratio of 71.4% on Test and 58.3% on Validation.
2. **Topographic Rain Trapping:** Raw GFS generates heavy precipitation along mountain barriers that do not realize in ground rain gauges, necessitating machine-learning downscaling and post-processing.
