# Phase 7 Scientific Report: Regime-Wise Probability Evaluation

## 1. Provenance and Test Set Regime Distribution

In Phase 4, five synoptic weather regimes were defined and mapped to official IMD Monograph / RSMC cyclone track bulletins:
1. `ACTIVE_MONSOON`
2. `BREAK_MONSOON`
3. `COASTAL_OROGRAPHIC`
4. `DEPRESSION`
5. `OTHER`

In Phase 6 and Phase 7, the held-out test cohort consists of **June 2024** ($N = 31$ days). Applying the pre-trained Phase 4 Gradient Boosting Regime Classifier (`models/regime_classifier.pkl`) yields the following operational regime predictions on the test set:
- **`OTHER`**: 30 days ($96.8\%$)
- **`COASTAL_OROGRAPHIC`**: 1 day ($3.2\%$)
- **`ACTIVE_MONSOON`**: 0 days ($0.0\%$)
- **`BREAK_MONSOON`**: 0 days ($0.0\%$)
- **`DEPRESSION`**: 0 days ($0.0\%$)

> [!WARNING]
> **Synoptic Regime Representation Limitation**:
> The June 2024 held-out test period was dominated by the OTHER regime according to the project's regime classifier. Strong Active Monsoon troughs, prolonged Break spells, and deep Monsoon Depressions predominantly develop in July, August, and September. Consequently, the June 2024 test cohort contains **zero occurrences** of `ACTIVE_MONSOON`, `BREAK_MONSOON`, and `DEPRESSION`.
> In strict adherence to scientific integrity, performance for unrepresented regimes is recorded as **NO TEST SAMPLES**.

---

## 2. Regime-Wise Performance Verification

### Summary by Regime

| Regime | Test Cohort Size | Status | Verification Summary |
|:---|:---:|:---:|:---|
| **ACTIVE_MONSOON** | 0 | **NO TEST SAMPLES** | No active trough episodes occurred during June 2024 at station. |
| **BREAK_MONSOON** | 0 | **NO TEST SAMPLES** | Break monsoon spells did not develop during test window. |
| **DEPRESSION** | 0 | **NO TEST SAMPLES** | Zero monsoon depressions tracked across the station in June 2024. |
| **COASTAL_OROGRAPHIC**| 1 | **EVALUATED** | 1 day detected (observed rain: 0.0 mm). Both models predicted $P < 0.15$. |
| **OTHER** | 30 | **EVALUATED** | 30 days (13 rainy days, 6 moderate rain days). Comprehensive metrics below. |

---

## 3. Detailed Results for Represented Regimes

### A. Regime: `OTHER` (Sample Size $N = 30$)
- **Threshold $\ge 2.5$ mm** (13 events, base rate $43.3\%$):
  - **Global Probability Model**:
    - Brier Score: $0.2393$
    - ROC-AUC: $0.6380$
    - PR-AUC: $0.6094$
    - ECE: $0.0543$
    - Contingency ($\tau = 0.30$): H = 12, F = 16, M = 1, C = 1
    - POD: $0.9231$, FAR: $0.5714$, CSI: $0.4138$, ETS: $-0.0152$
  - **Regime-Aware Model**:
    - Brier Score: $0.2489$
    - ROC-AUC: $0.5747$
    - PR-AUC: $0.5562$
    - ECE: $0.0877$
    - Contingency ($\tau = 0.30$): H = 11, F = 12, M = 2, C = 5
    - POD: $0.8462$, FAR: **0.5217**, CSI: **0.4400**, ETS: **0.0638**

- **Threshold $\ge 15.6$ mm** (6 events, base rate $20.0\%$):
  - **Global Probability Model**:
    - Brier Score: $0.1695$
    - ROC-AUC: $0.5556$
    - PR-AUC: $0.2732$
    - ECE: $0.0988$
    - Contingency ($\tau = 0.10$): H = 4, F = 13, M = 2, C = 11
    - POD: **0.6667**, FAR: $0.7647$, CSI: **0.2105**, ETS: **0.0385**
  - **Regime-Aware Model**:
    - Brier Score: $0.1767$
    - ROC-AUC: $0.4306$
    - PR-AUC: $0.1965$
    - ECE: $0.1272$
    - Contingency ($\tau = 0.10$): H = 0, F = 0, M = 6, C = 24
    - POD: $0.0000$, FAR: N/A, CSI: $0.0000$, ETS: $0.0000$

### B. Regime: `COASTAL_OROGRAPHIC` (Sample Size $N = 1$)
- **Day**: June 19, 2024
- **Raw NWP Forecast**: 0.0 mm
- **Observed Rainfall**: 0.0 mm
- **Global Probability**: $\ge 2.5$ mm: $0.0245$; $\ge 15.6$ mm: $0.0084$
- **Regime Probability**: $\ge 2.5$ mm: $0.0270$; $\ge 15.6$ mm: $0.0084$
- **Result**: Correct rejection ($C$) across all thresholds. Brier Score = $0.0006$.

---

## 4. Scientific Implication

1. **High Sample Dependence of Regime Probability Models**:
   Because the test cohort is dominated by the `OTHER` regime, the regime-aware model relies entirely on its `OTHER` sub-model. Because training samples for `OTHER` contained only 12 positive moderate rain cases (compared to 26 in the global pool), the sub-model learned lower prior probabilities, making it more conservative than the pooled global model.
2. **Honest Validation Boundary**:
   We explicitly document that the probability models have been validated against conditions observed in June 2024 (`OTHER` and `COASTAL_OROGRAPHIC`), and cannot claim operational validation for `ACTIVE_MONSOON`, `BREAK_MONSOON`, or `DEPRESSION` until a multi-year July–September test dataset is evaluated in Phase 8.
