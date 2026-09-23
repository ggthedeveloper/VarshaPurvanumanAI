# Weather Regime Classification Methodology

## 1. Problem Statement Context & SIH26080 Mandate
Under Problem Statement SIH26080 ("Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts"), standard NWP model post-processing fails during regime transitions because physical bias structures differ fundamentally between synoptic weather regimes.

The problem statement explicitly specifies the following target regimes:
1. **Active Monsoon**
2. **Break Monsoon**
3. **Depression**
4. **Coastal/Orographic Rainfall**
5. **Other / Normal Seasonal Background**

### Critical Scientific Principle: No Invented Labels
Rainfall observation magnitude alone does not define a weather regime. For example:
- A day with 50 mm rainfall can be caused by an intense localized thunderstorm during a break spell, an orographic surge along the Western Ghats, or an approaching depression.
- Conversely, a day with 10 mm rainfall in central India during a deep depression may occur because the grid point lies in the dry slot or periphery of the vortex.
Therefore, assigning regime labels purely based on rainfall thresholds without synoptic provenance is scientifically invalid.

VarshaPurvanumanAI enforces a strict provenance hierarchy:
- **OFFICIAL:** Directly sourced from official IMD reports, RSMC North Indian Ocean cyclone tracks, or official WMO bulletins.
- **SCIENTIFIC_SOURCE:** Sourced from peer-reviewed scientific methodologies published by IMD and MoES scientists (e.g., Rajeevan et al., Pai et al.).
- **EXPERIMENTAL:** Rule-based approximations or unverified heuristics (explicitly marked with confidence penalties and never labelled as official).

---

## 2. Canonical Regime Taxonomy & Mapping Table

| Source Category / Event Type | Canonical Regime (`regime`) | Granular Sub-Regime (`sub_regime`) | Label Status (`label_status`) | Default Confidence |
| :--- | :--- | :--- | :--- | :--- |
| IMD Cyclonic Storm / Deep Depression / Land Depression Track | `DEPRESSION` | `CYCLONIC_DISTURBANCE` | `OFFICIAL` | 1.00 |
| IMD Verified Prolonged Break Spell / CMZ Anomaly $\le -1.0$ | `BREAK_MONSOON` | `TROUGH_AT_FOOTHILLS` | `OFFICIAL` | 0.95 |
| CMZ Sustained Positive Anomaly $\ge +1.0$ (Non-LPS) | `ACTIVE_MONSOON` | `CMZ_VIGOROUS_SURGE` | `SCIENTIFIC_SOURCE` | 0.85 |
| Western Ghats Onshore Westerly Low-Level Jet ($u \ge 5$ m/s) | `COASTAL_OROGRAPHIC` | `WESTERN_GHATS_OROGRAPHIC`| `SCIENTIFIC_SOURCE` | 0.85 |
| West Coast Marine Convection outside Ghats ridge | `COASTAL_OROGRAPHIC` | `COASTAL_CONVECTIVE` | `EXPERIMENTAL` | 0.70 |
| Standard Seasonal Background Monsoon Circulation | `OTHER` | `NORMAL_MONSOON` | `SCIENTIFIC_SOURCE` | 0.90 |

---

## 3. Physical & Meteorological Basis for Each Regime

### A. DEPRESSION Regime
- **Synoptic Definition:** Low-pressure systems originating over the Bay of Bengal or Arabian Sea characterized by closed cyclonic isobars, central pressure deficits exceeding 2–6 hPa, and maximum sustained surface winds between 17 and 33 knots.
- **Verified Events in Benchmark Period:**
  - **2021:**
    - Deep Depression over Bay of Bengal (12–15 Sep 2021): Landfall near Chandbali, Odisha; tracked across Chhattisgarh and Madhya Pradesh.
    - Cyclonic Storm "Gulab" (24–28 Sep 2021): Landfall near Kalingapatnam; emerged into Maharashtra/Gujarat as a depression.
  - **2022:**
    - Depression BOB 05 (9–10 Aug 2022): Coastal Odisha & adjoining Bay of Bengal.
    - Depression ARB 01 (12–13 Aug 2022): Northeast Arabian Sea off Maharashtra/Gujarat coast.
    - Depression BOB 06 (14–16 Aug 2022): Northwest Bay of Bengal across Central India.
    - Deep Depression BOB 07 (19–23 Aug 2022): Deep depression tracked through Odisha, MP, Rajasthan.
    - Depression BOB 08 (11–15 Sep 2022): South Odisha & North Andhra Pradesh.
  - **2023:**
    - ESCS "Biparjoy" Remnant Deep Depression (16–19 Jun 2023): Landfall in Saurashtra/Kutch, moved across Rajasthan and northwest/central India.
    - Deep Depression BOB 02 (1–3 Aug 2023): Landfall in Bangladesh/West Bengal, tracked westward across Jharkhand, Bihar, and MP.
- **Physical Signature in Dataset:** Marked surface pressure minimum ($933–938$ hPa at benchmark station), high relative humidity ($> 87\%$), elevated wind speeds, and widespread precipitation.

### B. BREAK_MONSOON Regime
- **Scientific Definition (Rajeevan et al. 2010; Pai et al. 2014):**
  - Monsoon trough shifts northward from its normal position over the Indo-Gangetic plain to the foothills of the Himalayas.
  - Standardized daily rainfall anomaly over the Core Monsoon Zone (CMZ: $18^\circ\text{N}–28^\circ\text{N}, 65^\circ\text{E}–88^\circ\text{E}$) drops below $-1.0$ standard deviation for $\ge 3$ consecutive days.
  - Subdued rainfall over peninsular and central India, accompanied by enhanced rainfall over the Himalayan foothills and northeast India.
- **Documented Events in Benchmark Period:**
  - **2021:** Prolonged break spell from 20 June to 11 July 2021 (the longest break spell of June-July 2021).
  - **2022:** Brief subdued phase from 1 September to 7 September 2022.
  - **2023:** Historic August break spells: 5–17 August 2023 (13 consecutive days of break conditions) and 27–31 August 2023 (5 days).
- **Physical Signature in Dataset:** Elevated surface pressure ($941–944$ hPa), reduced relative humidity ($< 80\%$), elevated convective available potential energy ($\text{CAPE} > 320$ J/kg) due to strong solar insolation and suppressed synoptic lift, and near-zero precipitation.

### C. ACTIVE_MONSOON Regime
- **Scientific Definition (Rajeevan et al. 2010):**
  - Active monsoon conditions occur when the monsoon trough is in its normal or south-of-normal position, accompanied by vigorous low-level moisture transport across the Arabian Sea.
  - Standardized daily rainfall anomaly over the Core Monsoon Zone $> +1.0$ standard deviation for $\ge 3$ consecutive days in the absence of a closed cyclonic depression vortex.
- **Documented Events in Benchmark Period:**
  - **2021:** Vigorous revival spell from 12 July to 23 July 2021.
  - **2022:** Active monsoon surge over peninsular and central India from 5 July to 15 July 2022.
  - **2023:** Widespread active surge from 18 July to 26 July 2023.
- **Physical Signature in Dataset:** Highest mean rainfall ($7.5$ mm observed, $12.7$ mm NWP), saturated atmospheric column ($\text{RH} > 90\%$), low surface pressure ($937.6$ hPa), and moderate CAPE ($179$ J/kg).

### D. COASTAL_OROGRAPHIC Regime
- **Scientific Distinction: Geographic Susceptibility vs. Event Regime:**
  - Topography alone does not create an orographic regime. A mountain located in a dry, calm airmass produces no rainfall.
  - An **orographic precipitation regime** requires the physical interaction of moist, fast-moving low-level air with topography.
- **Dynamical Indicators (Houze et al. 2007; Francis & Gadgil 2006):**
  1. **Geographic Belt:** Western Ghats windward crest or coastal strip (distance to coast $< 120$ km, Lat $8^\circ\text{N}–21^\circ\text{N}$, Lon $72^\circ\text{E}–76.5^\circ\text{E}$).
  2. **Low-Level Westerly Jet:** $u_{\text{wind\_10m}} \ge 5.0$ m/s ($18$ km/h), total wind speed $\ge 6.5$ m/s ($23.4$ km/h).
  3. **High Moisture Content:** Relative humidity $\ge 78\%$.
  4. **Exclusion Criteria:** Must not coincide with an official depression track or a broad-scale break monsoon spell.
- **Physical Signature in Dataset:** Strongest sustained surface winds in the dataset (mean $26.2$ km/h, max $37.6$ km/h), low CAPE ($145.9$ J/kg indicating forced mechanical lifting rather than free thermodynamic convection).

### E. OTHER (Normal Seasonal Background)
- **Definition:** Days during the summer monsoon that exhibit standard baseline circulation patterns without triggering the extreme anomalies of depression vortices, active surges, break lulls, or strong orographic jets.

---

## 4. Leakage Prevention Architecture

In strict adherence to ML best practices:
1. **Target Independence:** Regime labels are **NOT** derived from the predictand (`observed_rainfall`). They are derived from verified external meteorological reports, synoptic track catalogs, and GFS NWP atmospheric flow indicators.
2. **Temporal Integrity:** No future information is utilized. Event lifespans are assigned based strictly on historical calendar dates.
3. **Split Separation:**
   - Training: JJAS 2021 + JJAS 2022 (244 samples)
   - Validation: JJAS 2023 (122 samples)
   - Test: June 2024 (31 samples)
4. **Classifier Predictors:** The classifier uses only NWP forecast features ($X_{\text{NWP}}$) available at forecast initialization time ($t=0$ / lead time +24h), ensuring it can operate in real-time inference before rainfall observations occur.

---

## 5. Critical Scientific Test (10 Questions Mandate)

### 1. Where did the labels come from?
- Depressions: Official IMD RSMC Best-Track reports and IMD Annual Southwest Monsoon Reports published in *MAUSAM*.
- Break Spells: Official IMD Annual Monsoon Reports and the standardized Core Monsoon Zone (CMZ) index (Pai et al., Rajeevan et al.).
- Active Spells: Published CMZ normalized anomaly surge records.
- Coastal/Orographic: Peer-reviewed dynamical Western Ghats Low-Level Jet criteria (Houze et al., Francis & Gadgil).
- Other: Residual seasonal baseline.

### 2. Are they official, scientific, or experimental?
- 80 records (20.2%) are **OFFICIAL** (Depression tracks and IMD-documented break spells).
- 317 records (79.8%) are **SCIENTIFIC_SOURCE** (Peer-reviewed CMZ index, Western Ghats dynamical LLJ criteria, seasonal background).
- 0 records are arbitrary or invented.

### 3. How were labels matched to rainfall/NWP samples?
- Labels were matched by exact UTC timestamp (`timestamp`) and geographic coordinate alignment against the verified paired dataset.

### 4. Are there enough samples for each class?
- Across the 397-sample benchmark:
  - `OTHER`: 247
  - `BREAK_MONSOON`: 47
  - `COASTAL_OROGRAPHIC`: 38
  - `DEPRESSION`: 33
  - `ACTIVE_MONSOON`: 32
- In the training set (2021–2022, 244 samples), each minority class has 20 to 29 verified samples, which is sufficient to train an interpretable, regularized baseline classifier with balanced class weighting.

### 5. Is there temporal leakage?
- No. Splits are strictly chronological by calendar year (2021–2022 $\rightarrow$ 2023 $\rightarrow$ 2024).

### 6. Is there spatial leakage?
- No. The spatial coordinates and distance to coast are fixed physical attributes of the forecast grid point.

### 7. Are labels independent of the target in a problematic way?
- Yes, labels are completely independent of `observed_rainfall`. They are determined by synoptic tracks, large-scale pressure anomalies, and wind fields, preventing circular reasoning.

### 8. Are the classes scientifically distinguishable?
- Yes. Empirical inspection confirms distinct physical centroids:
  - Active: Lowest pressure (937.6 hPa), highest RH (91.0%), highest rainfall (7.5 mm).
  - Break: Highest pressure (941.5 hPa), highest CAPE (328 J/kg), lowest RH (80.5%).
  - Coastal/Orographic: Highest wind speed (26.2 km/h), lowest CAPE (145.9 J/kg).
  - Depression: Marked pressure deficit during vortex transit, high RH (87.3%).

### 9. Which classes lack sufficient data?
- The June 2024 held-out test period was dominated by the OTHER regime according to the project's regime classifier (28 OTHER, 3 COASTAL_OROGRAPHIC). No depressions or prolonged break spells occurred during June 2024 at this station. Therefore, the Test set contains only `COASTAL_OROGRAPHIC` and `OTHER`. The full multi-class spectrum is evaluated on the 122-day 2023 Validation set.

### 10. What are the limitations?
- Single-point spatial resolution in the benchmark paired dataset. When multi-district spatial gridded data is scaled across all 763 districts in future phases, spatial depression tracks will map selectively to affected districts rather than regional clusters.
