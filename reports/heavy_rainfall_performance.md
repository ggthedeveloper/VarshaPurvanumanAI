# Heavy & Moderate Rainfall Categorical Performance Report

## 1. Context & Official IMD Thresholds
Problem Statement **SIH26080** explicitly emphasizes heavy rainfall warning capability. In Indian meteorological operations, the India Meteorological Department (IMD) defines the following official daily precipitation thresholds:

1. **Rainy Day Threshold:** $\ge 2.5$ mm/day (distinguishes non-measurable trace from active rain)
2. **Moderate Rainfall Threshold:** $\ge 15.6$ mm/day (15.6 to 64.4 mm/day)
3. **Heavy Rainfall Threshold:** $\ge 64.5$ mm/day (64.5 to 115.5 mm/day)
4. **Very Heavy Rainfall Threshold:** $\ge 115.6$ mm/day

---

## 2. Categorical Skill Scores on Held-Out Test Set (June 2024, N = 31)

### A. Threshold: $\ge 2.5$ mm/day (Rainy Day, 13 Observed Events / 41.9% Climatology)

| Model | Hits (H) | False Alarms (F) | Misses (M) | POD | FAR | CSI | ETS | FSS (w=3) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Model A: Raw NWP** | 10 | 8 | 3 | 0.7692 | **0.4444** | **0.4762** | **0.1823** | **0.8426** |
| **Model B: Global ML** | **11** | 12 | **2** | **0.8462** | 0.5217 | 0.4400 | 0.0882 | 0.7344 |
| **Model C: Regime-Aware (Op)** | **11** | 12 | **2** | **0.8462** | 0.5217 | 0.4400 | 0.0882 | 0.7324 |
| **Model C: Regime-Aware (Orc)**| **11** | 12 | **2** | **0.8462** | 0.5217 | 0.4400 | 0.0882 | 0.7324 |

#### Analysis:
- Both ML models increase the Probability of Detection (POD) from 76.9% to **84.6%** (capturing 11 out of 13 rain events vs. 10 for Raw NWP).
- Raw NWP has slightly higher ETS (0.1823 vs 0.0882) due to fewer false alarms on borderline dry days (8 vs 12).

---

### B. Threshold: $\ge 15.6$ mm/day (Moderate Rainfall, 6 Observed Events / 19.4% Climatology)

| Model | Hits (H) | False Alarms (F) | Misses (M) | POD | FAR | CSI | ETS | FSS (w=3) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Model A: Raw NWP** | **2** | 5 | 4 | **0.3333** | 0.7143 | **0.1818** | **0.0669** | **0.4918** |
| **Model B: Global ML** | 0 | 0 | 6 | 0.0000 | N/A* | 0.0000 | 0.0000 | 0.0000 |
| **Model C: Regime-Aware (Op)** | 0 | 0 | 6 | 0.0000 | N/A* | 0.0000 | 0.0000 | 0.0000 |
| **Model C: Regime-Aware (Orc)**| 0 | 0 | 6 | 0.0000 | N/A* | 0.0000 | 0.0000 | 0.0000 |

*\*Note: 0 false alarms and 0 hits occurred because regression models predicted rainfall values between 8 and 14 mm on those days.*

---

### C. Threshold: $\ge 64.5$ mm/day (Heavy Rainfall, 0 Observed Events)
- **Status:** **INSUFFICIENT OBSERVED EVENTS** (0 occurrences $\ge 64.5$ mm in June 2024 at this station).
- In accordance with SIH26080 scientific guidelines, undefined zero-denominator scores are not fabricated.

---

## 3. Categorical Skill Scores on Validation Season (JJAS 2023, N = 122)

### A. Threshold: $\ge 2.5$ mm/day (31 Observed Events / 25.4% Climatology)

| Model | Hits (H) | False Alarms (F) | Misses (M) | POD | FAR | CSI | ETS | FSS (w=3) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Model A: Raw NWP** | 19 | 16 | 12 | 0.6129 | **0.4571** | 0.4043 | **0.2652** | **0.7507** |
| **Model B: Global ML** | **23** | 25 | **8** | **0.7419** | 0.5208 | **0.4107** | 0.2466 | 0.7236 |
| **Model C: Regime-Aware (Op)** | 22 | 26 | 9 | 0.7097 | 0.5417 | 0.4000 | 0.2227 | 0.7103 |
| **Model C: Regime-Aware (Orc)**| 22 | 25 | 9 | 0.7097 | 0.5319 | 0.4074 | 0.2360 | 0.7176 |

---

### B. Threshold: $\ge 15.6$ mm/day (9 Observed Events / 7.4% Climatology)

| Model | Hits (H) | False Alarms (F) | Misses (M) | POD | FAR | CSI | ETS | FSS (w=3) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Model A: Raw NWP** | **5** | 7 | 4 | **0.5556** | **0.5833** | **0.3125** | **0.2722** | **0.5279** |
| **Model B: Global ML** | 2 | **3** | 7 | 0.2222 | 0.6000 | 0.1667 | 0.1402 | 0.3143 |
| **Model C: Regime-Aware (Op)** | 1 | 6 | 8 | 0.1111 | 0.8571 | 0.0909 | 0.0531 | 0.2415 |
| **Model C: Regime-Aware (Orc)**| 2 | 7 | 7 | 0.2222 | 0.7778 | 0.1250 | 0.0898 | 0.2755 |

---

## 4. Fundamental Finding & Bridge to Phase 7
1. **The Deterministic Regression Paradox:**
   Minimizing continuous squared error ($L_2$ loss) forces regression models to predict the expected value $E[Y|X]$. By definition, expected values pull extreme convective peaks toward the mean. Consequently, while Global ML and Regime-Aware ML achieve a **22% reduction in continuous RMSE**, their deterministic threshold scores at $\ge 15.6$ mm decline because point forecasts rarely exceed extreme cutoffs.
2. **Why Phase 7 is Essential:**
   Heavy rainfall warning operations cannot rely exclusively on deterministic regression point estimates. **Phase 7 (Heavy Rainfall Probability Modeling)** will directly address this by constructing calibrated probabilistic classifiers that output $P(\text{Rainfall} \ge 64.5\text{ mm})$ and $P(\text{Rainfall} \ge 115.6\text{ mm})$, providing the specialized probabilistic warning capability mandated by MoES.
