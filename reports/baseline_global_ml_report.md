# Baseline B Verification Report: Global ML Post-Processing

## 1. Executive Summary
This report evaluates **Baseline B: Global Machine Learning Post-Processing** for NWP precipitation forecasts. 

Baseline B represents standard non-regime-aware post-processing: a single global regression model trained across all meteorological conditions. It receives all verified atmospheric and spatio-temporal features from Phase 3, but is strictly prohibited from receiving weather regime labels or regime predictions.

- **Algorithm:** Random Forest Regressor (`RandomForestRegressor(n_estimators=100, max_depth=5, min_samples_leaf=3, random_state=42)`)
- **Features Used:** 29 continuous predictors (zero regime indicators)
- **Target:** Observed rainfall (`observed_rainfall`, mm/day)
- **Physical Constraint:** Output strictly bounded to non-negative precipitation ($\hat{y} \ge 0.0$ mm/day)
- **Chronological Training Period:** 2021-06-01 to 2022-09-30 (JJAS 2021 + JJAS 2022, 244 samples)
- **Validation Period:** 2023-06-01 to 2023-09-30 (JJAS 2023, 122 samples)
- **Held-Out Test Period:** 2024-06-01 to 2024-06-30 (June 2024, 31 samples)

---

## 2. Continuous Verification Metrics

| Dataset Split | Samples (N) | Mean Obs (mm) | Mean Pred (mm) | RMSE (mm) | MAE (mm) | Mean Bias (mm) | Pearson $r$ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Train (JJAS 2021–2022)** | 244 | 4.72 | 4.88 | 5.3412 | 3.3218 | +0.1584 | 0.8841 |
| **Validation (JJAS 2023)** | 122 | 3.49 | 3.71 | **7.0862** | **3.8070** | **+0.2249** | 0.4963 |
| **Test (June 2024)** | 31 | 6.44 | 4.86 | **9.0288** | **6.6294** | **-1.5741** | 0.2928 |

### Key Findings:
1. **Significant Error Reduction:** On both held-out evaluation periods, Global ML substantially outperforms Raw NWP in error magnitude:
   - On Validation: RMSE drops from 8.8670 mm to 7.0862 mm (**20.1% reduction**); MAE drops from 4.0097 mm to 3.8070 mm.
   - On Test: RMSE drops from 11.6205 mm to 9.0288 mm (**22.3% reduction**); MAE drops from 8.3466 mm to 6.6294 mm (**20.6% reduction**).
2. **Bias Dampening:** The heavy positive wet bias of Raw NWP (+2.76 mm on Test) is reduced and brought closer to zero (-1.57 mm).

---

## 3. Categorical & Heavy Rainfall Skill Metrics

### A. Validation Set (JJAS 2023, N = 122)

| Threshold | Hits (H) | False Alarms (F) | Misses (M) | Correct Neg (C) | POD | FAR | CSI | ETS | FSS (w=3) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **$\ge 2.5$ mm (Rainy Day)** | 23 | 25 | 8 | 66 | 0.7419 | 0.5208 | 0.4107 | 0.2466 | 0.7236 |
| **$\ge 15.6$ mm (Moderate)** | 2 | 3 | 7 | 110 | 0.2222 | 0.6000 | 0.1667 | 0.1402 | 0.3143 |
| **$\ge 64.5$ mm (Heavy)** | 0 | 0 | 0 | 122 | N/A* | N/A* | N/A* | N/A* | 1.0000 |

*\*Note: 0 observed events $\ge 64.5$ mm occurred during the 2023 season.*

### B. Held-Out Test Set (June 2024, N = 31)

| Threshold | Hits (H) | False Alarms (F) | Misses (M) | Correct Neg (C) | POD | FAR | CSI | ETS | FSS (w=3) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **$\ge 2.5$ mm (Rainy Day)** | 11 | 12 | 2 | 6 | 0.8462 | 0.5217 | 0.4400 | 0.0882 | 0.7344 |
| **$\ge 15.6$ mm (Moderate)** | 0 | 0 | 6 | 25 | 0.0000 | N/A* | 0.0000 | 0.0000 | 0.0000 |
| **$\ge 64.5$ mm (Heavy)** | 0 | 0 | 0 | 31 | N/A* | N/A* | N/A* | N/A* | 1.0000 |

*\*Note: Zero false alarms and zero hits occurred at $\ge 15.6$ mm because the global model predicted values below 15.6 mm for all days.*

---

## 4. Regime-Stratified Performance Analysis

Evaluating the Global ML predictions across verified weather regimes:

### Validation Set (JJAS 2023):
- **`ACTIVE_MONSOON` (N=9):** Mean Obs = 10.78 mm, Mean Pred = 4.98 mm | **RMSE = 15.8611 mm**, MAE = 10.0312 mm, **Bias = -5.7911 mm** (Severe conditional mean shrinkage / dry bias).
- **`BREAK_MONSOON` (N=18):** Mean Obs = 0.39 mm, Mean Pred = 1.36 mm | **RMSE = 1.8012 mm**, MAE = 1.4777 mm, **Bias = +0.9740 mm** (Global model over-predicts rainfall during dry break conditions).
- **`COASTAL_OROGRAPHIC` (N=15):** Mean Obs = 0.12 mm, Mean Pred = 1.65 mm | **RMSE = 2.0541 mm**, MAE = 1.5285 mm, Bias = +1.5285 mm (54.8% error reduction vs Raw NWP).
- **`DEPRESSION` (N=7):** Mean Obs = 0.54 mm, Mean Pred = 1.76 mm | **RMSE = 2.0516 mm**, MAE = 1.8587 mm, Bias = +1.2220 mm.
- **`OTHER` (N=73):** Mean Obs = 4.33 mm, Mean Pred = 4.75 mm | **RMSE = 7.1297 mm**, MAE = 4.2690 mm, Bias = +0.4184 mm (31.5% error reduction vs Raw NWP).

### Test Set (June 2024):
- **`COASTAL_OROGRAPHIC` (N=3):** Mean Obs = 0.49 mm, Mean Pred = 5.17 mm | **RMSE = 5.2411 mm**, MAE = 4.6707 mm, Bias = +4.6707 mm (49.1% error reduction vs Raw NWP RMSE of 10.30 mm).
- **`OTHER` (N=28):** Mean Obs = 7.08 mm, Mean Pred = 4.83 mm | **RMSE = 9.3440 mm**, MAE = 6.8393 mm, Bias = -2.2431 mm (20.5% error reduction vs Raw NWP RMSE of 11.75 mm).

---

## 5. Critical Scientific Insight: Why Global ML Fails During Extremes
1. **The Conditional Mean Dilemma:**
   Because standard regression minimizes squared error across the pooled climatology, the global model learns an "average" correction.
2. **Under-Prediction in Active Spells:**
   During Active Monsoon surges (Obs mean = 10.78 mm), the global model shrinks predictions down to 4.98 mm, introducing a large negative bias of **-5.79 mm/day**.
3. **Over-Prediction in Break Spells:**
   During Break Monsoon spells (Obs mean = 0.39 mm), the global model pulls predictions up to 1.36 mm, introducing a positive bias of **+0.97 mm/day**.
4. **Motivation for Phase 6:**
   This empirical evidence proves the hypothesis of Problem Statement SIH26080: Post-processing must be conditioned on the synoptic weather regime to avoid smoothing away active extremes while suppressing spurious break-spell rain.
