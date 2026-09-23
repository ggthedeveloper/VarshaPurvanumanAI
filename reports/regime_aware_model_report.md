# Regime-Aware AI Post-Processing Model Report

## 1. System Architecture & Core Innovation
Under Problem Statement **SIH26080**, the fundamental innovation is conditioning meteorological post-processing on the synoptic weather regime. Standard global regression models suffer from conditional mean shrinkage—systematically under-forecasting active convective surges while producing spurious rainfall during dry break spells.

The **Regime-Aware Post-Processing System** implements a hierarchical two-stage architecture:

```
                      NWP Forecast (t=0)
                              |
                              v
               Phase 4 Regime Classifier
               (Predicts Regime & Probabilities)
                              |
          +------------+------+------+------------+
          |            |             |            |
          v            v             v            v
       Active        Break       Depression    Coastal/
       Model         Model         Model      Orographic
       (N=23)        (N=29)        (N=26)       (N=20)
          |            |             |            |
          +------------+------+------+------------+
                              |
                     OTHER / Fallback Model
                            (N=146)
                              |
                              v
                   Physically Bounded Rainfall
                     (Output >= 0.0 mm/day)
```

---

## 2. Training Sample Size Audit & Model Instantiation

In accordance with strict MoES scientific requirements, dedicated regime models were only instantiated after verifying real training sample availability in the chronological training partition (JJAS 2021 + JJAS 2022, **N = 244**):

| Weather Regime | Real Training Samples | Model Status | Dedicated Algorithm | Hyperparameters |
| :--- | :--- | :--- | :--- | :--- |
| **`OTHER`** | 146 | Dedicated Model | Random Forest Regressor | `n_estimators=100, max_depth=5, min_samples_leaf=3` |
| **`BREAK_MONSOON`** | 29 | Dedicated Model | Regularized RF Regressor | `n_estimators=100, max_depth=3, min_samples_leaf=2` |
| **`DEPRESSION`** | 26 | Dedicated Model | Regularized RF Regressor | `n_estimators=100, max_depth=3, min_samples_leaf=2` |
| **`ACTIVE_MONSOON`** | 23 | Dedicated Model | Regularized RF Regressor | `n_estimators=100, max_depth=3, min_samples_leaf=2` |
| **`COASTAL_OROGRAPHIC`**| 20 | Dedicated Model | Regularized RF Regressor | `n_estimators=100, max_depth=3, min_samples_leaf=2` |
| **Global Fallback** | 244 (Pooled) | Operational Fallback | Random Forest Regressor | `n_estimators=100, max_depth=5, min_samples_leaf=3` |

### Fallback Policy:
- Minimum sample threshold for dedicated model instantiation: **15 real samples**.
- Because all 5 canonical regimes possessed $\ge 20$ real samples in training, all 5 regimes qualified for dedicated specialized regressors.
- For moderate sample sizes ($20 \le N < 40$), decision tree depth was constrained (`max_depth=3`, `min_samples_leaf=2`) to guard against $P > N$ variance inflation.
- The global model is preserved as an active fallback for unclassified or out-of-domain instances.

---

## 3. Operational Inference vs Oracle Evaluation

In strict adherence to real-time deployment constraints, the system separates:
1. **Operational Evaluation:** Uses the predicted regime from the trained Phase 4 classifier (`models/regime_classifier.pkl`). Routing decisions are made strictly using NWP forecast and spatial features available at initialization time ($t=0$).
2. **Oracle Evaluation:** Routes instances according to ground-truth regime labels to establish the theoretical upper bound of regime-conditioning assuming perfect regime classification.

---

## 4. Empirical Performance Summary

### Held-Out Test Set (June 2024, N = 31 Daily Samples)

| Evaluation Mode | RMSE (mm) | MAE (mm) | Mean Bias (mm) | Pearson $r$ | Rainy Day CSI ($\ge 2.5$) | Rainy Day POD |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Raw NWP (Baseline A)** | 11.6205 | 8.3466 | +2.7582 | 0.4090 | 0.4762 | 0.7692 |
| **Global ML (Baseline B)** | 9.0288 | 6.6294 | -1.5741 | 0.2928 | 0.4400 | 0.8462 |
| **Regime-Aware (Operational)** | **9.6061** | **6.6610** | **-2.3517** | **0.1020** | **0.4400** | **0.8462** |
| **Regime-Aware (Oracle)** | **9.5409** | **6.5802** | **-2.4325** | **0.1401** | **0.4400** | **0.8462** |

### Validation Set (JJAS 2023, N = 122 Daily Samples)

| Evaluation Mode | RMSE (mm) | MAE (mm) | Mean Bias (mm) | Pearson $r$ | Rainy Day CSI ($\ge 2.5$) | Rainy Day POD |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Raw NWP (Baseline A)** | 8.8670 | 4.0097 | +0.7547 | 0.4672 | 0.4043 | 0.6129 |
| **Global ML (Baseline B)** | 7.0862 | 3.8070 | +0.2249 | 0.4963 | 0.4107 | 0.7419 |
| **Regime-Aware (Operational)** | **7.6740** | **4.6622** | **+0.9186** | **0.3857** | **0.4000** | **0.7097** |
| **Regime-Aware (Oracle)** | **7.1785** | **4.3583** | **+1.1176** | **0.4964** | **0.4074** | **0.7097** |

---

## 5. Physical Bound & Audit Trace
- **Non-Negative Constraint:** Corrected rainfall is strictly bounded ($\hat{y} = \max(0.0, y)$). No negative rainfall is ever produced.
- **Traceability:** Every test prediction is logged in [data/processed/predictions_trace_test.csv](file:///Users/gg/Desktop/VarhsaPurvanumanAI/data/processed/predictions_trace_test.csv) with timestamp, coordinates, raw NWP, predicted regime, regime probability, selected correction model, corrected output, and observed ground truth.
