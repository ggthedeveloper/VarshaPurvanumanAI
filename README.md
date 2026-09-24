# VarshaPurvanumanAI (SIH26080)
## Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts

[![Backend Tests](https://img.shields.io/badge/pytest-85%20passed-brightgreen.svg)]()
[![Frontend Tests](https://img.shields.io/badge/vitest-20%20passed-brightgreen.svg)]()
[![System Tests](https://img.shields.io/badge/tests-105%2F105%20passed-brightgreen.svg)]()
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

### 4. Operational Scope: Station-Level Benchmark vs. District Products

> [!IMPORTANT]
> **PUNE BENCHMARK STATION (18.50°N, 73.80°E)**
> - The currently active verified telemetry in this repository is strictly a **historical station-level benchmark replay** for the Pune station ($18.50^\circ\text{N}, 73.80^\circ\text{E}$) using the held-out test sample from June 30, 2024 (`sample_timestamp: 2024-07-01 00:00:00+00:00`).
> - It is **NOT** presented as a live forecast, nor as a district-level forecast for Pune District or any other district.
> - The dashboard architecture fully supports live district-level forecast ingestion when multi-station gridded observations become operationally connected.
> - For all unmonitored districts, the API and dashboard strictly return:
>   ```json
>   "coverage_status": "DATA_UNAVAILABLE",
>   "forecast_mode": "DATA_UNAVAILABLE",
>   "forecast": null
>   ```
> - The application **never fabricates or interpolates** rainfall data for unmonitored districts. All UI panels explicitly show `N/A` for missing predictors, regime, confidence, and probabilities.

---

### 5. Machine Learning Models & Checkpoints

All model artifacts are stored in `models/` and tracked with exact SHA-256 integrity:

1. **Synoptic Regime Classifier (`models/regime_classifier.pkl` - 332 KB):**
   - **Algorithm:** `GradientBoostingClassifier`
   - **Hyperparameters:** `n_estimators=50`, `max_depth=3`, `learning_rate=0.05`, `random_state=42`
   - **Input Features:** 29 physical atmospheric predictors
   - **Training Set:** JJAS 2021–2022 (244 daily samples)
   - **Validation Set:** JJAS 2023 (122 daily samples)
   - **Target Regimes:** `ACTIVE_MONSOON`, `BREAK_MONSOON`, `COASTAL_OROGRAPHIC`, `DEPRESSION`, `OTHER`
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

#### Deterministic Error Metrics
| Metric | Raw NWP (Baseline A) | Global ML (Baseline B) | Regime-Aware ML |
|:---|:---:|:---:|:---:|
| **RMSE (mm)** | 11.6205 | **9.0288** | 9.6061 |
| **MAE (mm)** | 8.3466 | **6.6294** | 6.6610 |
| **Mean Bias (mm)** | +2.7582 (Over-forecast) | **-1.5741** | -2.3517 |
| **Pearson Correlation ($r$)** | **0.4090** | 0.2928 | 0.1020 |

#### Categorical Contingency & Threat Scores
| Threshold | Observed Events | Forecast Events (Raw NWP) | POD (Raw NWP) | FAR (Raw NWP) | CSI (Raw NWP) | ETS (Raw NWP) |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| $\ge 2.5\text{ mm}$ (Rainy Day) | 13 | 18 | 0.7692 | 0.4444 | 0.4762 | 0.1823 |
| $\ge 7.5\text{ mm}$ (Moderate Rain) | 10 | 13 | 0.6000 | 0.5385 | 0.3529 | 0.1411 |
| $\ge 15.6\text{ mm}$ (Heavy Outlier) | 6 | 7 | 0.3333 | 0.7143 | 0.1818 | 0.0669 |
| $\ge 64.5\text{ mm}$ (Heavy Rain) | 0 | 0 | *Not Computable* | *Not Computable* | *Not Computable* | *Not Computable* |
| $\ge 115.6\text{ mm}$ (Very Heavy Rain) | 0 | 0 | *Not Computable* | *Not Computable* | *Not Computable* | *Not Computable* |

- **Fractions Skill Score (FSS):** Documented strictly as `NOT COMPUTABLE` for point-based station verification. FSS requires 2D spatial grid fields.
- **June 2024 Test Distribution:** The June 2024 held-out test period was dominated by the `OTHER` regime according to the project's regime classifier (28 ground-truth `OTHER` days, 3 ground-truth `COASTAL_OROGRAPHIC` days). Active monsoon troughs, prolonged break spells, and depressions had 0 occurrences in June 2024 at this station.
- **Extreme Threshold Caveat:** No observed rainfall events $\ge 64.5$ mm or $\ge 115.6$ mm occurred in the June 2024 test period; verification metrics for these thresholds are truthfully reported as `INSUFFICIENT TEST EVENTS`.

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
│   ├── global_postprocessor.pkl
│   ├── regime_classifier.pkl
│   ├── regime_postprocessors/
│   └── probability/
├── data/                     # Authoritative datasets & boundaries
│   ├── raw/boundaries/       # 675 district GeoJSON boundary files
│   └── processed/            # Chronologically split feature & target tables
├── reports/                  # Scientific evaluation reports and final_metrics.json
├── src/                      # Scientific pipeline core
│   ├── features/             # 29-feature extractor & chronological splitter
│   ├── ingestion/            # GFS and IMD observation parsers
│   ├── metrics/              # WMO/IMD continuous & categorical metrics
│   ├── postprocessing/       # Global & regime-aware model architectures
│   ├── probability/          # Calibrated exceedance probability engine
│   ├── regime_classifier/    # Gradient boosting regime classifier
│   └── verification/         # End-to-end verification engine
└── tests/                    # 15 test suites covering full system (84 tests)
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

# Run all 85 backend and integration tests
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
DEMO_PASSWORD=Varsha@SIH2026

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
- **Login Credentials:** Username: `sih_judge`, Password: `Varsha@SIH2026`
- **Or Click:** "Quick SIH Demo Access" for 1-click evaluation access.

---

### 9. Scientific Disclaimers & Official Boundaries

1. **Not Official IMD Forecasting:** This system is an academic and applied AI research prototype developed for Smart India Hackathon (SIH 2026). It does not replace official forecasts, bulletins, or warnings issued by the India Meteorological Department (IMD) or the Ministry of Earth Sciences (MoES).
2. **No Weather Warning Fabrication:** Color-coded exceedance alerts on the dashboard indicate statistical model probabilities based on historical thresholds; they are not official meteorological warnings.
3. **Structured Pruning Reference:** In related machine learning compression research, the term **CoFi** refers strictly to **CoFi-Pruning** (*"Structured Pruning Learns Compact and Accurate Models"*, Xia et al.), a structured neural pruning framework.
