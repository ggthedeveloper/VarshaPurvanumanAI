# Phase 7 Scientific Report: Heavy Rainfall Probability & Warning Layer

## 1. Context & Motivation

A major finding of Phase 5 and Phase 6 was that deterministic point forecasting cannot adequately serve operational heavy rainfall warning requirements. When trained under squared error (MSE) loss, machine learning regressors predict the conditional mean:
$$\hat{y}(x) = \mathbb{E}[Y \mid X = x]$$
Because rainfall distributions are zero-inflated and heavy-tailed, the conditional mean is heavily shrunk toward the climatological median ($0 - 4$ mm). Consequently, even on days when convective dynamics produced $20 - 30$ mm of rain, deterministic regression models never predicted values above $11.08$ mm, producing zero hits ($\text{POD} = 0.000$) for moderate and heavy rain alerts.

Phase 7 resolves this structural deficiency by directly forecasting the **Probability of Exceedance**:
$$\hat{p}_T(x) = \hat{P}(Y \ge T \mid X = x)$$
allowing forecasters to set risk-sensitive operational decision cutoffs ($\tau$).

---

## 2. Threshold Performance & Comparison with Deterministic Models

| Metric | Deterministic Baseline B (Phase 5) | Regime-Aware Deterministic (Phase 6) | Global Probability Model (Phase 7) |
|:---|:---:|:---:|:---:|
| **$\ge 15.6$ mm Hits (H)** | 0 | 0 | **4** |
| **$\ge 15.6$ mm Misses (M)** | 6 | 6 | **2** |
| **$\ge 15.6$ mm False Alarms (F)**| 0 | 0 | 13 |
| **$\ge 15.6$ mm POD (Recall)** | 0.0000 | 0.0000 | **0.6667 (66.7%)** |
| **$\ge 15.6$ mm CSI (Threat Score)**| 0.0000 | 0.0000 | **0.2105** |
| **$\ge 15.6$ mm ETS** | 0.0000 | 0.0000 | **0.0452** |
| **$\ge 15.6$ mm Brier Score** | N/A | N/A | **0.1643** |

### Key Takeaway
While deterministic regression suffered complete detection failure ($\text{POD} = 0.0$), the **Phase 7 Global Probability Model successfully detected $66.7\%$ of moderate/heavy rainfall events** (4 out of 6 observed events in the held-out June 2024 test period).

---

## 3. Operational Warning Layer Architecture

```
                       CALIBRATED EXCEEDANCE PROBABILITY
                                  P(Y >= T)
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v                                                         v
   P(Y >= T) < tau                                           P(Y >= T) >= tau
+-------------------------+                               +-------------------------+
|    NORMAL ADVISORY      |                               |    ELEVATED RISK        |
|  (Standard monitoring)  |                               |    WATCH / ADVISORY     |
+-------------------------+                               +-------------------------+
```

### Distinction Between Model Probability and Official IMD Warnings
> [!IMPORTANT]
> A model probability output is **NOT** an official IMD weather warning.
> In operational meteorology:
> - **Model Probability**: An objective, calibrated statistical estimate of event likelihood conditioned on NWP inputs.
> - **Official Warning**: An authoritative administrative designation (e.g., IMD Yellow/Orange/Red Alert) issued by official meteorologists incorporating vulnerability, impact exposure, radar nowcasts, and multi-model consensus.
> The Phase 7 system provides probabilistic decision guidance to human forecasters; it does not replace statutory authority.

---

## 4. Analysis of Extreme Thresholds (>= 64.5 mm and >= 115.6 mm)

### Empirical Event Counts
- **IMD Heavy Rainfall ($\ge 64.5$ mm)**:
  - Training Set (244 days): 1 event ($0.41\%$).
  - Validation Set (122 days): 0 events ($0.00\%$).
  - Test Set (31 days): 0 events ($0.00\%$).
- **IMD Very Heavy Rainfall ($\ge 115.6$ mm)**:
  - Training Set (244 days): 0 events ($0.00\%$).
  - Validation Set (122 days): 0 events ($0.00\%$).
  - Test Set (31 days): 0 events ($0.00\%$).

### Scientific Assessment
1. **Zero Positive Cases in Test Cohort**:
   In the 31-day held-out test cohort (June 2024), maximum observed daily rainfall was $30.45$ mm. No heavy ($\ge 64.5$ mm) or very heavy ($\ge 115.6$ mm) events occurred.
2. **Proper Handling of Undefined Metrics**:
   - In accordance with SIH26080 scientific guidelines, ROC-AUC and PR-AUC are explicitly declared as **INSUFFICIENT CLASS VARIATION**.
   - Brier Score is mathematically computable and equals $0.0000$ (since models predict near-zero probabilities on non-event days).
   - No synthetic events were generated to artificially inflate sample counts.
