# VarshaPurvanumanAI (SIH26080) — Backend Architecture & Service Design

**Ministry of Earth Sciences (MoES) / Smart India Hackathon 2024**  
**Core Problem Statement**: AI/ML-Powered Weather-Regime-Aware Post-Processing of Monsoon Rainfall Forecasts  
**Architecture Version**: `v1.0.0`

---

## 1. High-Level Architectural Overview

The backend service is engineered with FastAPI to serve as an immutable, low-latency API layer exposing the scientific model pipeline developed in Phases 4 through 8.

```mermaid
flowchart TD
    Client[Web UI / REST Client] -->|HTTP / JSON Request| Middleware[FastAPI Pipeline & CORS & Timing Middleware]
    Middleware --> Routers[FastAPI API Routers]

    subgraph Service Layer
        Routers -->|Inference Query| FeatureSvc[FeatureService]
        Routers -->|Model Query| PredSvc[PredictionService]
        Routers -->|District Query| DistSvc[DistrictService]
        Routers -->|Metric Query| VerifSvc[VerificationService]
    end

    subgraph Singleton Model Registry
        PredSvc --> Reg[ModelRegistry in Memory]
        Reg --> M1[Phase 4: Regime Classifier<br/>GradientBoostingClassifier]
        Reg --> M2[Phase 5: Global ML Regressor<br/>RandomForestRegressor]
        Reg --> M3[Phase 6: Regime-Aware Post-Processor<br/>Hierarchical Conditional Regressors]
        Reg --> M4[Phase 7: Calibrated Probability Suite<br/>Platt-Scaled Exceedance Suite]
        Reg --> M5[Feature Provenance & Scaler State]
    end

    subgraph Immutable Scientific File Storage
        M1 -.->|Load on Startup| Disk1[(models/regime_classifier.pkl)]
        M2 -.->|Load on Startup| Disk2[(models/global_postprocessor.pkl)]
        M3 -.->|Load on Startup| Disk3[(models/regime_postprocessors/)]
        M4 -.->|Load on Startup| Disk4[(models/probability/probability_suite.pkl)]
        VerifSvc -.->|Read-Only Read| Disk5[(reports/final_metrics.json)]
    end
```

---

## 2. Core Architectural Principles

### 2.1 Immutable Scientific Artifacts (No Retraining / Zero Drift)
The backend does not retrain, fine-tune, or mutate any model artifact. All models are treated as scientific constants loaded from designated checkpoints:
- **Phase 4**: `models/regime_classifier.pkl`
- **Phase 5**: `models/global_postprocessor.pkl`
- **Phase 6**: `models/regime_postprocessors/`
- **Phase 7**: `models/probability/probability_suite.pkl`

### 2.2 Singleton Lifespan Registry (`ModelRegistry`)
All model checkpoints and scaling transforms are loaded into memory once during application startup via the ASGI `lifespan` handler.
- **Cold Start Time**: ~0.45 seconds to load all 5 models and metadata into RAM.
- **Subsequent Inference Latency**: ~6 ms to 15 ms per prediction (well below the 50 ms SLA).
- **Zero Disk I/O During Inference**: In-flight prediction requests never touch the disk for model weights or pipeline state.

### 2.3 Strict Separation Between Scientific Estimation and Official Warnings
The backend adheres strictly to meteorological communication standards:
- Probability of exceedance outputs ($P(\text{Rainfall} \ge T)$) are communicated as scientific posterior risk estimates.
- Every response includes an explicit disclaimer:  
  `"MODEL EXCEEDANCE PROBABILITIES ARE SCIENTIFIC NUMERICAL ESTIMATES AND DO NOT CONSTITUTE OFFICIAL IMD WEATHER WARNINGS."`
- Advisory tags (`NORMAL_ADVISORY`, `ELEVATED_RISK`) are tied to scientifically verified optimal decision thresholds $\tau^*$, not arbitrary political alerts.

### 2.4 Real Data Transparency (Zero Synthetic Fabrication)
- When a district with verified meteorological data (such as Pune benchmark station) is requested, the system returns predictions driven by genuine historical GFS NWP inputs and validated IMD observations.
- When an unmonitored district (e.g., Nagpur) is queried, the API explicitly returns `DATA_UNAVAILABLE` with a clear explanation rather than fabricating synthetic weather data.
- The global data provenance header `data_status: REAL_DATA` is enforced across all operational endpoints.

---

## 3. Operational Routing Mechanics

The inference request flow follows the hierarchical design established in Phase 6:

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as FastAPI Router
    participant FeatureSvc as FeatureService
    participant PredSvc as PredictionService
    participant Registry as ModelRegistry

    Client->>API: POST /api/forecast (meteorological parameters)
    API->>FeatureSvc: prepare_feature_dataframe(req)
    FeatureSvc->>FeatureSvc: Compute cyclical, thermodynamic & wind derived features
    FeatureSvc->>FeatureSvc: Apply scaler transforms & validate zero leakage
    FeatureSvc-->>API: (df_features, raw_nwp_val)

    API->>PredSvc: predict_combined_forecast(df_features, raw_nwp_val)
    PredSvc->>Registry: regime_classifier.predict(df_features)
    Registry-->>PredSvc: predicted_regime, posterior probabilities

    PredSvc->>Registry: regime_postprocessor.predict(df_features, routing='operational')
    Note over PredSvc,Registry: Routes to dedicated regime regressor or fallback
    Registry-->>PredSvc: corrected_rainfall (clipped >= 0)

    PredSvc->>Registry: probability_suite.predict_proba(df_features, regime)
    Registry-->>PredSvc: calibrated exceedance probabilities across 5 thresholds

    PredSvc-->>API: CombinedForecastResponse
    API-->>Client: HTTP 200 OK + JSON Payload
```

---

## 4. Verification Integrity & Spatial FSS Transparency

The Verification Service (`/api/verification/*`) reads directly from `reports/final_metrics.json` generated by the Phase 8 Verification Engine:
- **No On-the-Fly Recalculations**: Prevents non-deterministic evaluation discrepancies.
- **Fractions Skill Score (FSS)**: Explicitly reported as:
  ```json
  {
    "metric": "FSS",
    "status": "NOT_COMPUTABLE",
    "reason": "Current evaluation data is point-based and lacks the required 2-D spatial forecast/observation grid."
  }
  ```
- **95% Bootstrap Confidence Intervals**: Embedded for all continuous metrics across Raw NWP, Global ML, and Regime-Aware ML.

---

## 5. Security & Reliability

- **Pydantic Validation**: All endpoints enforce physical boundary constraints ($[0, \infty)$ for precipitation and wind speed, $[0, 100]$ for relative humidity, $[-90, 90]$ for latitude).
- **Target Leakage Shield**: Request payloads with keys containing forbidden substring roots (`observed`, `target`, `true_regime`) are rejected with `422 Unprocessable Content`.
- **CORS Policies**: Strict whitelist origin filtering for Next.js/React development ports (`http://localhost:3000`, `http://localhost:5173`).
- **Timing & Performance Monitoring**: Middleware records exact microsecond-precision execution latency and injects it into both application logs and the `X-Response-Time-Ms` response header.
