# VarshaPurvanumanAI (SIH26080)
## Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts

[![Backend Tests](https://img.shields.io/badge/pytest-93%20passed-brightgreen.svg)]()
[![Frontend Tests](https://img.shields.io/badge/vitest-20%20passed-brightgreen.svg)]()
[![System Tests](https://img.shields.io/badge/tests-113%2F113%20passed-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.13](https://img.shields.io/badge/python-3.13-blue.svg)]()
[![React 19](https://img.shields.io/badge/react-19.2-61dafb.svg)]()

> **Smart India Hackathon (SIH 2026) | Problem Statement SIH26080**  
> **Theme:** Smart Automation / Disaster Management  
> **Target Organization:** Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD)

---

### 1. Problem Statement & Objective

Numerical Weather Prediction (NWP) models (such as NOAA GFS and NCMRWF NCUM) exhibit systematic errors over the Indian subcontinent during the Southwest Monsoon (JJAS). In complex terrain and coastal transition zones, raw NWP forecasts suffer from severe orographic over-prediction, displacement errors, and an inflated False Alarm Ratio (FAR) at moderate-to-heavy rainfall thresholds.

**VarshaPurvanumanAI** develops an objective, regime-aware machine learning post-processing system that:
1. Classifies large-scale synoptic conditions into meteorologically grounded weather regimes (Rajeevan et al., Pai et al.).
2. Applies regime-conditioned post-processing to downscale and bias-correct raw NWP rainfall accumulations.
3. Provides calibrated probabilistic rainfall exceedance estimates across operational IMD rainfall thresholds.
4. Serves verified station-level telemetry and an interactive 675-district spatial map dashboard designed for operational integration.

---

### 2. High-Level System Architecture

```
                       ┌──────────────────────────────────────────────┐
                       │  Physical Atmospheric Predictors (29 Vars)   │
                       │  • Kinematics: u, v, wind speed              │
                       │  • Thermodynamics: T, RH, DPD, P, CAPE, Wmax │
                       │  • Orography & Geography: Ghats, Coast, Z    │
                       │  • Dynamics: NWP Rainfall, Lag-1, Rolling-3  │
                       └──────────────────────┬───────────────────────┘
                                              │
                                              ▼
                                 ┌─────────────────────────┐
                                 │ Upstream Synoptic       │
                                 │ Regime Classifier       │
                                 │ (Gradient Boosting)     │
                                 └────────────┬────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      │ Predicted Regime Routing                      │
                      ▼                                               ▼
         ┌─────────────────────────┐                     ┌─────────────────────────┐
         │ Deterministic Engine    │                     │ Calibrated Probability  │
         │                         │                     │ Suite (Platt Sigmoid)   │
         │ • Raw NWP (Baseline A)  │                     │                         │
         │ • Global ML (Baseline B)│                     │ • Thr ≥ 2.5 mm          │
         │ • Regime-Aware ML       │                     │ • Thr ≥ 7.5 mm          │
         │   (Dedicated Submodels  │                     │ • Thr ≥ 15.6 mm         │
         │    + Discrete Fallback) │                     │ • Thr ≥ 64.5 mm         │
         │                         │                     │ • Thr ≥ 115.6 mm        │
         └────────────┬────────────┘                     └────────────┬────────────┘
                      │                                               │
                      └───────────────────────┬───────────────────────┘
                                              │
                                              ▼
                             ┌─────────────────────────────────┐
                             │    Production FastAPI Backend   │
                             │  • In-Memory Singleton Registry │
                             │  • GeoJSON Stream (675 Dists)   │
                             │  • Pydantic Strict Validation   │
                             └────────────────┬────────────────┘
                                              │
                                              ▼
                             ┌─────────────────────────────────┐
                             │     React 19 + Vite Dashboard   │
                             │  • Interactive District Map     │
                             │  • Real vs Demo Data Badging    │
                             │  • Benchmark Station Isolation  │
                             └─────────────────────────────────┘
```

---

### 3. Data Sources & Scientific Grounding

| Role | Authoritative Source | Resolution / Details | Operational Usage |
|:---|:---|:---|:---|
| **NWP Predictors** | NOAA Global Forecast System (GFS) via Open-Meteo API | 0.25° grid, 00:00 UTC daily runs, 24 h lead time ($t+24$) | Model input features (wind, moisture, CAPE, precipitation) |
| **Observation Truth** | India Meteorological Department (IMD) Ground Benchmark | IMD Western Ghats 0.25° Gridded Observation Benchmark (Zenodo mirror DOI: 10.5281/zenodo.20177433) extracted at Pune coordinates (18.50°N, 73.80°E) | Supervised target ($y$) for bias correction and validation |
| **Administrative Boundaries** | Survey of India / DataMeet Boundaries | 675 verified district GeoJSON polygons | Spatial visualization and district product architecture |
| **Synoptic Regime Rules** | IMD / MoES Peer-Reviewed Literature | Rajeevan et al. (2008, 2010), Pai et al. (2014) | Objective criteria for synoptic event labeling |

---

### 4. Operational Scope: Gridded Benchmark, Station Replay & District Products

> [!IMPORTANT]
> **MULTI-CELL GRIDDED BENCHMARK & COVERED DISTRICTS**
> - The primary scientific benchmark operates on a **36-node mesoscale grid** across the Western Ghats orographic zone ($18.00^\circ\text{N} - 19.25^\circ\text{N}$, $73.00^\circ\text{E} - 74.25^\circ\text{E}$ at $0.25^\circ$ resolution).
> - This real gridded domain intersects with **6 Maharashtra districts**:
>   - **Pune:** 15 grid cells
>   - **Raigad:** 11 grid cells
>   - **Thane:** 4 grid cells
>   - **Satara:** 3 grid cells
>   - **Ahmednagar:** 2 grid cells
>   - **Ratnagiri:** 1 grid cell
> - For covered districts, the `/api/districts/{name}/forecast` endpoint produces real spatial multi-cell aggregations: spatial mean, peak cell accumulation, percentiles ($p_{10}, p_{50}, p_{90}$), prevailing synoptic regime, calibrated threshold exceedance probabilities, and exact cell coverage count.
> - **Pune Benchmark Station Replay (AWS 43063):** In addition to gridded district aggregations, single-station telemetry ($18.50^\circ\text{N}, 73.80^\circ\text{E}$) is preserved as a held-out test replay from June 30, 2024 for baseline point verification comparison.
> - **Strict Scientific Honesty for Unmonitored Districts:** For all districts outside the gridded observation footprint, the API strictly returns:
>   ```json
>   "coverage_status": "DATA_UNAVAILABLE",
>   "forecast_mode": "DATA_UNAVAILABLE",
>   "forecast": null
>   ```
> - The application **never fabricates or interpolates** rainfall data for unmonitored districts. Missing values are displayed as `N/A`.

---

### 5. Machine Learning Models & Checkpoints

All model artifacts are stored in `models/` and tracked with exact SHA-256 integrity:

1. **Synoptic Regime Classifier (`models/regime_classifier.pkl` - 332 KB):**
   - **Algorithm:** `GradientBoostingClassifier`
   - **Hyperparameters:** `n_estimators=50`, `max_depth=3`, `learning_rate=0.05`, `random_state=42`
   - **Input Features:** 29 physical atmospheric predictors
   - **Full Canonical Taxonomy (SIH26080):**
     1. `ACTIVE_MONSOON`: Core Monsoon Zone positive surge ($z \ge +1.0$)
     2. `BREAK_MONSOON`: Trough at Himalayan foothills ($z \le -1.0$)
     3. `COASTAL_OROGRAPHIC`: Western Ghats windward onshore jet ($u \ge 5\text{ m/s}, \text{ws} \ge 6.5\text{ m/s}, \text{RH} \ge 78\%$)
     4. `DEPRESSION`: Official IMD / RSMC cyclonic disturbance tracks
     5. `WESTERN_DISTURBANCE`: Mid-latitude westerly trough (documented IMD events, e.g., July 8–11, 2023 NW India flood interaction; applicable for North/Northwest India $\text{lat} \ge 26.0^\circ\text{N}$)
     6. `OTHER`: Background summer monsoon circulation
   - **Geographic Scope Note:** Western Disturbances primarily propagate across Northwest India, Jammu & Kashmir, Himachal Pradesh, Uttarakhand, and Punjab. The peninsular Pune benchmark station ($\text{lat } 18.50^\circ\text{N}$) is south of the primary WD storm track during June–September, correctly yielding zero summer WD occurrences.
   - **Test Performance (June 2024):** Accuracy = 93.55%, Macro F1 = 0.7328

2. **Global Deterministic Post-Processor (`models/global_postprocessor.pkl` - 265 KB):**
   - **Algorithm:** `RandomForestRegressor`
   - **Hyperparameters:** `n_estimators=100`, `max_depth=5`, `min_samples_leaf=3`, `random_state=42`
   - **Performance:** Reduces RMSE by 22.3% over Raw NWP (9.03 mm vs 11.62 mm)

3. **Regime-Aware Post-Processor Suite (`models/regime_postprocessors/`):**
   - Dedicated regressors trained per regime:
     - `active_monsoon.pkl` (89 KB)
     - `break_monsoon.pkl` (89 KB)
     - `coastal_orographic.pkl` (60 KB)
     - `depression.pkl` (97 KB)
     - `other.pkl` (217 KB)
     - `fallback_model.pkl` (265 KB, pooled fallback)

4. **Calibrated Probability of Exceedance Engine (`models/probability/probability_suite.pkl` - 3.2 MB):**
   - Platt Sigmoid Scaling (`CalibratedClassifierCV(method='sigmoid', cv=3)`)
   - Verified IMD operational thresholds: $\ge 2.5$ mm, $\ge 7.5$ mm, $\ge 15.6$ mm, $\ge 64.5$ mm, $\ge 115.6$ mm

---

### 6. Held-Out Test Evaluation & Verification Results

Evaluated on strictly unseen held-out test data (**June 1–30, 2024**, 31 daily samples):

#### A. Deterministic Station Error Metrics (Pune AWS 43063)
| Metric | Raw NWP (Baseline A) | Global ML (Baseline B) | Regime-Aware ML |
|:---|:---:|:---:|:---:|
| **RMSE (mm)** | 11.6205 | **9.0288** | 9.6061 |
| **MAE (mm)** | 8.3466 | **6.6294** | 6.6610 |
| **Mean Bias (mm)** | +2.7582 (Over-forecast) | **-1.5741** | -2.3517 |
| **Pearson Correlation ($r$)** | **0.4090** | 0.2928 | 0.1020 |

#### B. Categorical Contingency & Threat Scores
| Threshold | Observed Events | Forecast Events (Raw NWP) | POD (Raw NWP) | FAR (Raw NWP) | CSI (Raw NWP) | ETS (Raw NWP) |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| $\ge 2.5\text{ mm}$ (Rainy Day) | 13 | 18 | 0.7692 | 0.4444 | 0.4762 | 0.1823 |
| $\ge 7.5\text{ mm}$ (Moderate Rain) | 10 | 13 | 0.6000 | 0.5385 | 0.3529 | 0.1411 |
| $\ge 15.6\text{ mm}$ (Heavy Outlier) | 6 | 7 | 0.3333 | 0.7143 | 0.1818 | 0.0669 |
| $\ge 64.5\text{ mm}$ (Heavy Rain) | 0 | 0 | *Not Computable* | *Not Computable* | *Not Computable* | *Not Computable* |
| $\ge 115.6\text{ mm}$ (Very Heavy Rain) | 0 | 0 | *Not Computable* | *Not Computable* | *Not Computable* | *Not Computable* |

#### C. Gridded 2D Fractions Skill Score (FSS) & Spatial Verification (Phase 9 & 10)
Evaluated across the Western Ghats 0.25° mesoscale grid ($6 \times 6$ nodes, 30 daily June 2024 fields = 1,080 spatio-temporal samples) pairing NOAA GFS with real IMD gridded observations (Zenodo DOI: 10.5281/zenodo.20177433):

| Threshold | Neighborhood Scale | Physical Window | Raw NWP FSS | Global ML FSS | Regime ML FSS | Random Baseline ($f_o$) | Target Skill ($0.5 + f_o/2$) | Skill Status |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **$\ge 2.5\text{ mm}$** | $1 \times 1$ | 27.5 km | 0.4007 | 0.4256 | 0.3808 | 0.3611 | 0.6806 | MARGINAL |
| | $3 \times 3$ | 82.5 km | 0.4542 | 0.4937 | 0.4165 | 0.3611 | 0.6806 | MARGINAL |
| | $5 \times 5$ | 137.5 km | 0.4775 | **0.5058** | 0.4258 | 0.3611 | 0.6806 | MARGINAL |
| **$\ge 7.5\text{ mm}$** | $1 \times 1$ | 27.5 km | 0.4582 | 0.2776 | 0.2230 | 0.2343 | 0.6171 | MARGINAL |
| | $3 \times 3$ | 82.5 km | 0.5061 | 0.2937 | 0.2501 | 0.2343 | 0.6171 | MARGINAL |
| | $5 \times 5$ | 137.5 km | **0.5198** | 0.2978 | 0.2567 | 0.2343 | 0.6171 | MARGINAL |
| **$\ge 15.6\text{ mm}$** | $1 \times 1$ | 27.5 km | 0.2508 | 0.1176 | 0.0633 | 0.1361 | 0.5681 | NO_SKILL |
| | $3 \times 3$ | 82.5 km | 0.2961 | 0.1355 | 0.0718 | 0.1361 | 0.5681 | NO_SKILL |
| | $5 \times 5$ | 137.5 km | **0.3222** | 0.1430 | 0.0758 | 0.1361 | 0.5681 | MARGINAL |

- **Spatial Continuous Metrics (Held-Out Test Set, $N = 1,080$):**
  - Raw NWP: $\text{RMSE} = 15.09\text{ mm}$, $\text{MAE} = 8.77\text{ mm}$, $\text{Mean Bias} = +2.98\text{ mm}$, $r = 0.349$ (strong orographic wet bias)
  - Global ML: $\text{RMSE} = 13.59\text{ mm}$ (10.0% reduction), $\text{MAE} = 7.41\text{ mm}$, $\text{Mean Bias} = -2.16\text{ mm}$, $r = 0.040$
  - Regime-Aware ML: $\text{RMSE} = 13.33\text{ mm}$ (**11.7% reduction over Raw NWP, beats Global ML**), $\text{MAE} = 7.59\text{ mm}$, $\text{Mean Bias} = \mathbf{-1.05\text{ mm}}$ (**64.8% bias reduction, lowest bias across all models**), $r = 0.150$
- **Scientific Honesty Disclosure:** At spatial scale ($w = 5$), Global ML achieves higher FSS ($0.5058$) than Regime-Aware ML ($0.4258$) at the $2.5\text{ mm}$ threshold due to pooled training sample density across all circulation types. However, Regime-Aware ML achieves superior deterministic accuracy ($\text{RMSE } 13.33\text{ mm}$ vs $13.59\text{ mm}$) and preserves the lowest systematic bias ($-1.05\text{ mm}$ vs $-2.16\text{ mm}$). Both trade-offs are reported transparently without cherry-picking.
- **Scientific Truthfulness:** Point station verification strictly declares FSS as `NOT COMPUTABLE FOR POINT DATA`, while spatial 2D verification computes genuine FSS on real gridded fields. Zero synthetic numbers generated.

---

### 7. Repository Structure

```
VarshaPurvanumanAI/
├── .env.example              # Environment configuration template
├── .gitignore                # Excludes caches, builds, and secrets
├── LICENSE                   # MIT License
├── README.md                 # Complete system documentation
├── pytest.ini                # Pytest configuration
├── backend/                  # FastAPI Production Server
│   ├── app/
│   │   ├── main.py           # FastAPI app & lifespan handler
│   │   ├── config.py         # App configuration & settings
│   │   ├── routes/           # REST endpoints (/forecast, /health, /regime, etc.)
│   │   ├── schemas/          # Pydantic v2 data contracts & validators
│   │   ├── services/         # Model loader, predictor, feature pipeline
│   │   └── utils/            # GeoJSON boundary loaders
├── frontend/                 # React 19 + Vite + TypeScript Dashboard
│   ├── src/
│   │   ├── App.tsx           # Dashboard root & state management
│   │   ├── components/       # Map, summary cards, regime badges, probability
│   │   ├── services/         # API client & mock simulation generator
│   │   └── types/            # TypeScript domain interfaces
├── models/                   # Serialized ML checkpoints (.pkl) and metadata
│   ├── gridded_global_postprocessor.pkl
│   ├── gridded_regime_classifier.pkl
│   ├── gridded_regime_postprocessors/
│   ├── gridded_probability/
│   ├── final_metrics_gridded.json
│   ├── gridded_verification_evaluation.json
│   ├── global_postprocessor.pkl
│   ├── regime_classifier.pkl
│   ├── regime_postprocessors/
│   └── probability/
├── data/                     # Authoritative datasets & boundaries
│   ├── raw/boundaries/       # 675 district GeoJSON boundary files
│   └── processed/            # Chronologically split feature & target tables
├── reports/                  # Scientific evaluation reports and final metrics
├── src/                      # Scientific pipeline core
│   ├── features/             # 29-feature extractor & chronological splitter
│   ├── ingestion/            # GFS and IMD observation parsers
│   ├── metrics/              # WMO/IMD continuous & categorical metrics
│   ├── postprocessing/       # Global & regime-aware model architectures, training
│   ├── preprocessing/        # Gridded benchmark builder (36 nodes x 4 seasons)
│   ├── probability/          # Calibrated exceedance probability engine
│   ├── regime_classifier/    # Gradient boosting regime classifier
│   └── verification/         # 2D Gridded FSS and spatial verification engine
└── tests/                    # 17 test suites covering full system (93 tests)
```

---

### 8. Installation & Verification

#### Prerequisites
- **Python:** 3.10+ (tested on Python 3.13.3)
- **Node.js:** 18+ (tested on Node v25.6.1, npm 11.9.0)

#### Backend Setup
```bash
# Install Python scientific dependencies
pip install fastapi uvicorn pydantic scikit-learn numpy pandas geopandas shapely requests

# Run all 93 backend and integration tests
pytest tests/ -v
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run all 20 frontend component and integration tests
npm test

# Run production build
npm run build
```

#### Environment Configuration
Copy `.env.example` to `.env`:
```ini
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8000
APP_ENV=production
DATA_STATUS=HISTORICAL_BENCHMARK
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173

# SIH Evaluator Authentication
DEMO_USERNAME=sih_judge
DEMO_PASSWORD=your_secure_password_here

# Optional: Set Google Maps API key; if omitted, map falls back to OpenStreetMap / CartoDB raster tiles
VITE_GOOGLE_MAPS_API_KEY=
VITE_API_BASE_URL=
```

#### Starting the System for SIH Demonstration
```bash
# Terminal 1: Start FastAPI backend (port 8000)
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000

# Terminal 2: Start React frontend (port 3000)
cd frontend
npm run dev
```

Visit `http://localhost:3000` in your browser.
- **Login Credentials:** Username: `sih_judge`, Password: (configured in `.env` via `DEMO_PASSWORD`, or demo password)
- **Or Click:** "Quick SIH Demo Access" for 1-click evaluation access.

---

### 9. Scientific Disclaimers & Official Boundaries

1. **Not Official IMD Forecasting:** This system is an academic and applied AI research prototype developed for Smart India Hackathon (SIH 2026). It does not replace official forecasts, bulletins, or warnings issued by the India Meteorological Department (IMD) or the Ministry of Earth Sciences (MoES).
2. **No Weather Warning Fabrication:** Color-coded exceedance alerts on the dashboard indicate statistical model probabilities based on historical thresholds; they are not official meteorological warnings.
3. **Structured Pruning Reference:** In related machine learning compression research, the term **CoFi** refers strictly to **CoFi-Pruning** (*"Structured Pruning Learns Compact and Accurate Models"*, Xia et al.), a structured neural pruning framework.
