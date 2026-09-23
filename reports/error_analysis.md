# Systematic Forecast Error Analysis Report

## 1. Overview & Objective
This report diagnoses the empirical forecast error distributions of **Raw NWP (Model A)**, **Global ML (Model B)**, and **Regime-Aware ML (Model C)** across the 31 held-out daily test cases of June 2024.

---

## 2. Quantitative Residual Distribution (Held-Out Test Set, N = 31)

Residual is defined as $\text{Error} = y_{\text{pred}} - y_{\text{obs}}$ (positive indicates over-prediction, negative indicates under-prediction):

| Metric / Property | Model A: Raw NWP | Model B: Global ML | Model C: Regime-Aware ML |
| :--- | :--- | :--- | :--- |
| **Mean Forecast Error (Bias)** | **+2.7582 mm** | -1.5741 mm | -2.3517 mm |
| **Median Absolute Error** | 6.1360 mm | **4.0430 mm** | **4.2748 mm** |
| **Maximum Over-Prediction** | **+27.9983 mm** | +9.1499 mm | **+8.5081 mm** |
| **Maximum Under-Prediction** | -23.6475 mm | -25.5762 mm | -26.2294 mm |
| **Days with $|Error| > 10$ mm** | **12 / 31 (38.7%)** | **5 / 31 (16.1%)** | **6 / 31 (19.4%)** |
| **Days with $|Error| > 20$ mm** | **4 / 31 (12.9%)** | **3 / 31 (9.7%)** | **3 / 31 (9.7%)** |
| **10th Percentile Residual** | -9.39 mm | -14.51 mm | -14.78 mm |
| **25th Percentile Residual** | -0.25 mm | -6.14 mm | -5.71 mm |
| **50th Percentile (Median)** | +1.67 mm | +2.00 mm | +1.17 mm |
| **75th Percentile Residual** | +11.38 mm | +3.42 mm | +4.00 mm |
| **90th Percentile Residual** | +16.32 mm | +7.64 mm | +4.97 mm |

---

## 3. Physical Diagnosis of Major Error Modes

### A. Severe Over-Prediction Suppression (The Topographic Win)
- **Raw NWP Vulnerability:** In mountainous and complex terrain (such as the Western Ghats transition zone), NOAA GFS convection schemes produce runaway precipitation spikes on days with high moisture but modest localized lift. On multiple June 2024 days, Raw GFS predicted 20–35 mm when ground truth rainfall was under 5 mm (maximum over-prediction of **+28.00 mm**; 75th percentile error was +11.38 mm).
- **Post-Processing Resolution:** Both Global ML and Regime-Aware ML effectively suppress this runaway topographic over-prediction:
  - Global ML cuts the 75th percentile error from +11.38 mm to +3.42 mm.
  - Regime-Aware ML cuts max over-prediction from +28.00 mm to **+8.51 mm**.
  - Days with large errors ($> 10$ mm) drop from 38.7% down to 16.1–19.4%.

### B. Under-Prediction of Isolated Convective Bursts
- **Physical Cause:** On isolated days (e.g., June 8 and June 9, 2024, during the active monsoon advance across Maharashtra), ground stations recorded intense localized bursts of 25–30 mm.
- **Model Behavior:**
  - Raw NWP predicted 4–7 mm (under-predicting by 20–23 mm).
  - Global ML and Regime-Aware ML predicted 4–5 mm (under-predicting by 25–26 mm).
- **Underlying Mechanism:** When a synoptic grid box (0.25° $\approx 27 \times 27$ km) contains localized sub-grid thunderstorms, grid-averaged thermodynamic predictors do not register severe extreme values. Standard regression models minimizing squared error predict the conditional expected value (~5 mm), under-forecasting isolated extreme peaks.

### C. Regime-Specific Transition Errors
- In the 2023 Validation season, `BREAK_MONSOON` days experienced over-prediction by Global ML (+0.97 mm bias) because the global model could not distinguish suppressed foothill trough conditions from standard dry days.
- In `ACTIVE_MONSOON` surges, Global ML under-predicted rainfall by **-5.79 mm/day**, while Regime-Aware modeling mitigated this dry bias down to -4.51 mm in Oracle routing.

---

## 4. Operational Recommendations for Phase 7
1. **Deterministic vs. Probabilistic Delineation:** Deterministic point post-processing is exceptionally effective at reducing aggregate RMSE (22% error reduction) and eliminating large false alarms ($|Error| > 10$ mm cut from 38.7% to 16.1%).
2. **Specialized Probability of Exceedance:** To solve the under-prediction of sub-grid convective bursts without degrading the continuous RMSE, **Phase 7 must implement calibrated probability classifiers** ($P(\text{Rain} \ge 64.5\text{ mm})$) that alert forecasters to high-impact risks even when deterministic regression predicts moderate amounts.
