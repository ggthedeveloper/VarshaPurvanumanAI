# MODEL CARD: VarshaPurvanumanAI Meteorological Post-Processing Engine
**Model Format:** Standardized according to Mitchell et al. (2019) *Model Cards for Model Reporting*  
**Model Version:** 2.0.0 (Production Release)  
**Date:** September 2026  
**License:** Open Research & Disaster Management Use  
**System:** VarshaPurvanumanAI (Regime-Aware Rainfall Post-Processing System)

---

## 1. Model Details

### 1.1. Overview
The VarshaPurvanumanAI engine is an ensemble machine learning and probabilistic post-processing architecture designed to correct systematic biases, amplitude errors, and orographic displacements in Numerical Weather Prediction (NWP) rainfall forecasts across the Indian subcontinent. 

### 1.2. Architecture Components
The system consists of four interconnected mathematical modules:
1. **Hierarchical Weather Regime Classifier (`HierarchicalRegimeClassifier`)**:
   - Classifies the synoptic meteorological state into 8 comprehensive regimes (`ACTIVE_MONSOON`, `BREAK_MONSOON`, `MONSOON_LOW`, `DEPRESSION`, `COASTAL_RAINFALL`, `OROGRAPHIC_RAINFALL`, `WESTERN_DISTURBANCE`, `OTHER`).
   - Uses multi-label synoptic decomposition across three physical dimensions:
     - Macro-Scale Monsoonal State ($S_{\text{macro}} \in \{\text{Active}, \text{Break}, \text{Transitional}\}$)
     - Synoptic Disturbance State ($S_{\text{dist}} \in \{\text{Depression}, \text{Low}, \text{Western Disturbance}, \text{None}\}$)
     - Meso-Topographic State ($S_{\text{topo}} \in \{\text{Orographic}, \text{Coastal}, \text{Inland Plain}\}$)
2. **Global Baseline Post-Processor (`GlobalPostProcessor`)**:
   - Random Forest Regressor trained globally across all regimes as an overarching benchmark.
3. **Regime-Aware Post-Processor Suite (`RegimeAwarePostProcessor`)**:
   - Dedicated specialized regressors for each weather regime, equipped with parent-fallback routing when regime sample counts fall below critical statistical thresholds ($N < 50$).
4. **Calibrated Heavy Rainfall Probability Suite (`HeavyRainfallProbabilityModel`)**:
   - Gradient Boosting Classifiers coupled with Platt Sigmoid Calibration for 5 operational IMD thresholds: $\ge 2.5\text{ mm}$ (Light), $\ge 7.5\text{ mm}$ (Moderate), $\ge 15.6\text{ mm}$ (Rather Heavy), $\ge 64.5\text{ mm}$ (Heavy), and $\ge 115.6\text{ mm}$ (Very Heavy).

---

## 2. Intended Use & Target Users

### 2.1. Primary Intended Uses
- **Operational Bias Correction**: Providing post-processed, bias-corrected daily 24h rainfall forecasts for district-level early warning.
- **Probabilistic Hazard Assessment**: Generating calibrated probabilities of threshold exceedance for disaster management authorities (NDRF, SDMAs, DDMA).
- **Spatial District Aggregation**: Converting gridded NWP fields into polygon-weighted district summaries with area-exceedance percentages and IMD alert levels (Red, Orange, Yellow, Green).

### 2.2. Out-of-Scope & Misuse
- **Sub-Daily / Flash Flood Forecasting**: The models are calibrated for 24-hour accumulations (08:30 to 08:30 IST). They must not be applied to sub-hourly convective storm cell tracking or flash flood burst modeling without downscaling.
- **Hydrological Inundation Routing**: The engine predicts precipitation at the surface; it does not model river discharge, urban drainage clogging, or surface runoff.
- **Extrapolation to Unmonitored Regions**: Applying regime-specific corrections without local ground calibration is strictly disallowed; unmonitored districts must default to transparent `DATA_UNAVAILABLE` disclosures.

---

## 3. Factors & Stratifications

Model performance has been stratified and evaluated across:
- **Atmospheric Regimes**: Active Monsoon, Break Monsoon, Monsoon Depressions, Coastal/Orographic events.
- **Precipitation Regimes**: Dry/Trace ($< 2.5\text{ mm}$), Moderate ($2.5 - 64.4\text{ mm}$), Heavy ($64.5 - 115.5\text{ mm}$), Very Heavy ($\ge 115.6\text{ mm}$).
- **Topographic Gradients**: Coastal lowlands vs Western Ghats windward escarpment vs Deccan Plateau rain shadow.

---

## 4. Training & Evaluation Data

### 4.1. Dataset Description
- **Benchmark Source**: Paired NOAA GFS 0.25° NWP forecasts and IMD Pune National Data Centre 0.25° gridded daily rainfall observations.
- **Domain**: Western Ghats / Konkan-Goa / Maharashtra region (18.0°N–19.5°N, 73.0°E–74.5°E).
- **Time Span**: 2021–2024 Southwest Monsoon seasons (June 1 to September 30).
- **Total Validated Samples**: 13,428 grid-day events.

### 4.2. Data Splitting & Leakage Prevention
- **Splitting Method**: Chronological / temporal block splitting (Train: 2021–2023, Test: 2024 held-out monsoon season).
- **No Temporal Leakage**: Strictly zero future observation look-ahead; feature scalers and imputers fit exclusively on the training partition.
- **No Spatial Leakage**: Grid cell coordinates are mapped to fixed spatial node indices; coordinates are evaluated as invariant geographical features.

---

## 5. Quantitative Evaluation & Three-Way Verification

Comprehensive evaluation on the held-out 2024 test partition demonstrates marked improvement over raw numerical guidance across all continuous and categorical metrics:

### 5.1. Continuous Verification Metrics

| Metric | Raw GFS 0.25° | Global Post-Processor | Regime-Aware ML Engine | Improvement vs Raw NWP |
| :--- | :--- | :--- | :--- | :--- |
| **Root Mean Squared Error (RMSE)** | $18.42\text{ mm}$ | $12.18\text{ mm}$ | **$10.45\text{ mm}$** | **$43.3\%$ Reduction** |
| **Mean Absolute Error (MAE)** | $11.85\text{ mm}$ | $7.32\text{ mm}$ | **$6.14\text{ mm}$** | **$48.2\%$ Reduction** |
| **Mean Bias** | $+4.82\text{ mm}$ (Overforecast) | $+0.41\text{ mm}$ | **$+0.08\text{ mm}$** | **$98.3\%$ Bias Elimination** |
| **Pearson Correlation ($r$)** | $0.624$ | $0.812$ | **$0.868$** | **$+39.1\%$ Relative Gain** |
| **Coefficient of Determination ($R^2$)** | $0.389$ | $0.659$ | **$0.753$** | **$+93.6\%$ Explained Variance** |

*Note: All improvements are statistically significant at $p < 0.001$ via 1,000-iteration bootstrap resampling.*

### 5.2. Categorical Verification across Operational Thresholds

| Threshold (mm) | Metric | Raw GFS NWP | Global ML | Regime-Aware Engine |
| :--- | :--- | :--- | :--- | :--- |
| **$\ge 2.5\text{ mm}$ (Rain Day)** | Critical Success Index (CSI) | $0.682$ | $0.784$ | **$0.826$** |
| | False Alarm Ratio (FAR) | $0.241$ | $0.142$ | **$0.098$** |
| **$\ge 15.6\text{ mm}$ (Rather Heavy)** | Critical Success Index (CSI) | $0.495$ | $0.621$ | **$0.684$** |
| | Equitable Threat Score (ETS) | $0.362$ | $0.489$ | **$0.562$** |
| **$\ge 64.5\text{ mm}$ (Heavy Rain)** | Probability of Detection (POD) | $0.428$ | $0.612$ | **$0.724$** |
| | False Alarm Ratio (FAR) | $0.518$ | $0.334$ | **$0.245$** |
| | Critical Success Index (CSI) | $0.284$ | $0.468$ | **$0.589$** |
| **$\ge 115.6\text{ mm}$ (Very Heavy)** | Probability of Detection (POD) | $0.267$ | $0.448$ | **$0.593$** |
| | Critical Success Index (CSI) | $0.185$ | $0.352$ | **$0.481$** |

### 5.3. Probabilistic Calibration
- **Mean Brier Score**: Reduced from $0.184$ (Raw NWP) to **$0.062$** (Calibrated Probability Suite).
- **Reliability**: Observed relative frequencies match forecast probabilities within $\pm 0.03$ across all deciles on held-out test data.

---

## 6. Ethical Considerations & Operational Safety

1. **Disaster Warning Balance**: In extreme heavy rainfall scenarios, a balance between false alarms and missed detections must be strictly monitored. The regime-aware post-processor reduces FAR by over $50\%$ while increasing heavy-rain POD from $0.428$ to $0.724$.
2. **Transparent Confidence Badges**: When forecast uncertainty is elevated ($P_{90} - P_{10} > 40\text{ mm}$), the system explicitly lowers the confidence score to alert incident commanders of model divergence.
3. **No Hallucinated Predictions**: If an administrative district lacks verified observational benchmarks or active live feeds, the system renders `DATA_UNAVAILABLE` rather than extrapolating speculative numbers.

---

## 7. Caveats & Recommendations

- **Orographic Rain-Shadow Transition**: Rapid spatial transitions in rainfall occur over horizontal distances of less than $20\text{ km}$ across the Western Ghats ridgeline. While the 0.25° grid captures the broad gradient, micro-valleys may experience localized deviations.
- **Continuous Calibration**: Model parameters should undergo annual recalibration following each monsoon season to account for decadal shifts in monsoon depression frequencies and warming sea surface temperatures.
