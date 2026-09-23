# Phase 7 Scientific Report: Probability Calibration and Reliability Assessment

## 1. Calibration Methodology & Mathematical Framework

Probability calibration evaluates how closely predicted probabilities reflect true empirical event frequencies. In meteorological applications, a forecast probability of $0.70$ is well-calibrated if, across all occasions where $p = 0.70$ is forecast, the observed event occurs exactly $70\%$ of the time.

### Murphy (1973) Brier Score Decomposition
The overall Brier Score ($BS$) is decomposed into its fundamental components:
$$BS = REL - RES + UNC + VAR_{\text{within}}$$
where:
- **Reliability ($REL$)**: $\frac{1}{N} \sum_{k=1}^K n_k (\bar{p}_k - \bar{o}_k)^2$. Measures calibration error. Perfect: $0.0$. Lower is better.
- **Resolution ($RES$)**: $\frac{1}{N} \sum_{k=1}^K n_k (\bar{o}_k - \bar{o})^2$. Measures the model's ability to separate events with different conditional probabilities from the climatological base rate $\bar{o}$. Higher is better.
- **Uncertainty ($UNC$)**: $\bar{o}(1 - \bar{o})$. Climatological variance of the event in the sample. Dependent only on base rate.
- **Within-Bin Variance ($VAR_{\text{within}}$)**: Accounts for continuous probability dispersion within discrete calibration bins.

### Calibration Errors
- **Expected Calibration Error (ECE)**: Weighted absolute deviation across bins:
  $$ECE = \sum_{k=1}^K \frac{n_k}{N} |\bar{o}_k - \bar{p}_k|$$
- **Maximum Calibration Error (MCE)**: Worst-case deviation across non-empty bins:
  $$MCE = \max_k |\bar{o}_k - \bar{p}_k|$$

---

## 2. Quantitative Calibration Results (Held-Out Test Set)

### Threshold >= 2.5 mm / day (Rainy Day)
- **Base Rate ($\bar{o}$)**: $0.4194$ (13/31)
- **Uncertainty ($UNC$)**: $0.2435$

| Calibration Component | Global Probability Model | Regime-Aware Probability Model |
|:---|:---:|:---:|
| **Brier Score ($BS$)** | **0.2324** | 0.2418 |
| **Reliability ($REL$)** | **0.0051** | 0.0104 |
| **Resolution ($RES$)** | **0.0104** | 0.0100 |
| **Brier Skill Score ($BSS$)** | **+0.0454** | +0.0070 |
| **Expected Calibration Error ($ECE$)** | **0.0540** | 0.0889 |
| **Maximum Calibration Error ($MCE$)** | **0.1146** | 0.1285 |

### Threshold >= 15.6 mm / day (Moderate Rain)
- **Base Rate ($\bar{o}$)**: $0.1935$ (6/31)
- **Uncertainty ($UNC$)**: $0.1561$

| Calibration Component | Global Probability Model | Regime-Aware Probability Model |
|:---|:---:|:---:|
| **Brier Score ($BS$)** | **0.1643** | 0.1712 |
| **Reliability ($REL$)** | **0.0097** | 0.0144 |
| **Resolution ($RES$)** | **0.0021** | 0.0000 |
| **Brier Skill Score ($BSS$)** | -0.0524 | -0.0970 |
| **Expected Calibration Error ($ECE$)** | **0.0926** | 0.1201 |
| **Maximum Calibration Error ($MCE$)** | **0.1236** | 0.1201 |

---

## 3. Reliability Diagram Analysis

The calibration reliability diagram is preserved at:
[`reports/figures/reliability_diagram.png`](file:///Users/gg/Desktop/VarhsaPurvanumanAI/reports/figures/reliability_diagram.png)

1. **Threshold $\ge 2.5$ mm**:
   - Both Global and Regime-Aware models closely track the 1:1 diagonal ($y = x$).
   - The Global model achieves an exceptionally low $REL = 0.0051$ and $ECE = 0.0540$, indicating that forecast probabilities of rainy days reflect observed frequencies within a $5.4\%$ margin of error.
2. **Threshold $\ge 15.6$ mm**:
   - The Global model exhibits moderate calibration ($ECE = 0.0926$), generating probabilities in the $0.15 - 0.35$ range on days that experienced moderate rainfall.
   - The Regime-Aware model demonstrates over-shrinkage: because the dedicated `OTHER` sub-model was trained on only 12 positive cases, it shrinks probabilities toward zero, yielding $RES = 0.0000$ and failing to separate events from non-events.

---

## 4. Calibration Leakage Prevention Protocol

Strict measures were executed to prevent calibration leakage:
1. **Zero Test Data in Calibration**:
   Calibration maps were fitted solely on `X_train` using 3-fold cross-validation (`cv=3`).
2. **Independent Validation Set Verification**:
   The validation cohort (JJAS 2023, $N=122$) was evaluated without retraining the calibration map.
3. **Immutable Test Set**:
   Test set features and outcomes were processed in a single forward pass without parameter updates.
