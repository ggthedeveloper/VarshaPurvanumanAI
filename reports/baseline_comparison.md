# Baseline Comparison Report: Raw NWP vs Global ML

## 1. Overview & Fair Comparison Guarantee
Under Problem Statement **SIH26080**, this experiment provides an empirical benchmark comparing:
- **Baseline A:** Raw NOAA GFS 0.25° NWP Forecast
- **Baseline B:** Global ML Post-Processing (Random Forest Regressor, zero regime awareness)

### Fair Comparison Conditions Satisfied:
1. **Identical Test Samples:** Both systems evaluated on the exact same 31 daily samples of June 2024.
2. **Identical Validation Samples:** Both systems evaluated on the exact same 122 daily samples of JJAS 2023.
3. **Identical Observation Reference:** Ground truth is the IMD 0.25° daily gridded observation benchmark (Pai et al. / IMD) at the same grid location.
4. **Identical Spatial Domain:** Pune / Western Ghats transition zone (18.45°N, 73.83°E).
5. **Identical Forecast Horizon:** 24-hour lead time ending at 03:00 UTC.
6. **Zero Future/Regime Leakage:** Feature pipelines fitted strictly on JJAS 2021–2022; regime labels excluded from Global ML.

---

## 2. Held-Out Test Set Comparison (June 2024, N = 31)

### Continuous Performance Summary

| Model | RMSE (mm) | MAE (mm) | Mean Bias (mm) | Pearson $r$ |
| :--- | :--- | :--- | :--- | :--- |
| **Baseline A: Raw NWP** | 11.6205 | 8.3466 | +2.7582 | **0.4090** |
| **Baseline B: Global ML** | **9.0288** | **6.6294** | **-1.5741** | 0.2928 |
| *Absolute Difference* | *-2.5917* | *-1.7172* | *-4.3323* | *-0.1162* |
| *Relative Change (%)* | **-22.30%** | **-20.57%** | *Wet $\rightarrow$ Dry* | *-28.41%* |

On the held-out test period, the measured RMSE was 11.6205 mm for Raw NWP and 9.0288 mm for Global ML. The measured MAE was 8.3466 mm for Raw NWP and 6.6294 mm for Global ML.

---

### Categorical & Spatial Skill Metrics (June 2024, N = 31)

#### Threshold $\ge 2.5$ mm/day (Rainy Day)
| Model | POD | FAR | CSI | ETS | FSS (w=3) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Baseline A: Raw NWP** | 0.7692 | **0.4444** | **0.4762** | **0.1823** | **0.8426** |
| **Baseline B: Global ML** | **0.8462** | 0.5217 | 0.4400 | 0.0882 | 0.7344 |

#### Threshold $\ge 15.6$ mm/day (Moderate Rainfall)
| Model | POD | FAR | CSI | ETS | FSS (w=3) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Baseline A: Raw NWP** | **0.3333** | 0.7143 | **0.1818** | **0.0669** | **0.4918** |
| **Baseline B: Global ML** | 0.0000 | N/A* | 0.0000 | 0.0000 | 0.0000 |

*\*Note: At $\ge 15.6$ mm, Global ML produced 0 hits and 0 false alarms because conditional mean regression smoothed forecasts below 15.6 mm for all test days.*

#### Threshold $\ge 64.5$ mm/day (Heavy Rainfall)
- **Observed Events:** 0 occurrences in June 2024.
- In accordance with scientific reporting standards, undefined zero-denominator skill scores are reported as `INSUFFICIENT EVENTS` rather than fabricated values.

---

## 3. Validation Set Comparison (JJAS 2023, N = 122)

### Continuous Performance Summary

| Model | RMSE (mm) | MAE (mm) | Mean Bias (mm) | Pearson $r$ |
| :--- | :--- | :--- | :--- | :--- |
| **Baseline A: Raw NWP** | 8.8670 | 4.0097 | +0.7547 | 0.4672 |
| **Baseline B: Global ML** | **7.0862** | **3.8070** | **+0.2249** | **0.4963** |
| *Relative Change (%)* | **-20.08%** | **-5.06%** | **-70.20%** | **+6.23%** |

---

### Categorical & Spatial Skill Metrics (JJAS 2023, N = 122)

#### Threshold $\ge 2.5$ mm/day (Rainy Day)
| Model | POD | FAR | CSI | ETS | FSS (w=3) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Baseline A: Raw NWP** | 0.6129 | **0.4571** | 0.4043 | **0.2652** | **0.7507** |
| **Baseline B: Global ML** | **0.7419** | 0.5208 | **0.4107** | 0.2466 | 0.7236 |

#### Threshold $\ge 15.6$ mm/day (Moderate Rainfall)
| Model | POD | FAR | CSI | ETS | FSS (w=3) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Baseline A: Raw NWP** | **0.5556** | **0.5833** | **0.3125** | **0.2722** | **0.5279** |
| **Baseline B: Global ML** | 0.2222 | 0.6000 | 0.1667 | 0.1402 | 0.3143 |

---

## 4. Regime-Stratified Comparative Breakdown

Even though Baseline B was trained as a single global model without regime labels, we stratify its errors across the verified synoptic weather regimes:

| Weather Regime | Sample Count | Raw NWP RMSE (mm) | Global ML RMSE (mm) | Raw NWP Bias (mm) | Global ML Bias (mm) | Regime Winner |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`ACTIVE_MONSOON`** | 9 (Val) | **12.2250** | 15.8611 | -1.9864 | -5.7911 | **Raw NWP** *(Global ML under-predicts)* |
| **`BREAK_MONSOON`** | 18 (Val) | **1.1307** | 1.8012 | **+0.0702** | +0.9740 | **Raw NWP** *(Global ML creates spurious rain)* |
| **`COASTAL_OROGRAPHIC`**| 15 (Val) | 4.5481 | **2.0541** | +1.5215 | +1.5285 | **Global ML** *(54.8% error reduction)* |
| **`COASTAL_OROGRAPHIC`**| 3 (Test) | 10.2966 | **5.2411** | +7.2056 | **+4.6707** | **Global ML** *(49.1% error reduction)* |
| **`DEPRESSION`** | 7 (Val) | **0.7795** | 2.0516 | **-0.2093** | +1.2220 | **Raw NWP** *(Peripheral station)* |
| **`OTHER` (Seasonal)** | 73 (Val) | 10.4091 | **7.1297** | +1.1963 | **+0.4184** | **Global ML** *(31.5% error reduction)* |
| **`OTHER` (Seasonal)** | 28 (Test) | 11.7535 | **9.3440** | +2.2817 | **-2.2431** | **Global ML** *(20.5% error reduction)* |

---

## 5. Summary Findings for Phase 6

1. **Overall Continuous Error:** Global ML significantly improves aggregate continuous metrics over Raw NWP (RMSE reduced by 22.3% on Test and 20.1% on Validation).
2. **Failure at Regime Extremes:**
   - In **Active Monsoon**, Global ML suffers from severe dry bias (-5.79 mm vs -1.99 mm for NWP), leading to higher RMSE than Raw NWP (15.86 mm vs 12.23 mm).
   - In **Break Monsoon**, Global ML introduces false wet bias (+0.97 mm) where Raw NWP was nearly bias-free (+0.07 mm).
   - In **Moderate Rainfall ($\ge 15.6$ mm)**, Global ML completely misses extreme events on the test set ($\text{POD} = 0.0$), whereas Raw NWP detected 33.3% of events.
3. **Core Conclusion:** A single global post-processing model is suboptimal for diverse synoptic regimes. **Regime-Aware Post-Processing (Phase 6)** is essential to apply regime-specific corrections that preserve intense precipitation in Active/Depression regimes while dampening false alarms during Break and Coastal Orographic conditions.
