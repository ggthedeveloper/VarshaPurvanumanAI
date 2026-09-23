# VarshaPurvanumanAI (SIH26080) — REST API Reference Documentation

**MoES / SIH26080**: AI/ML-Powered Weather-Regime-Aware Post-Processing of Monsoon Rainfall Forecasts  
**Service Version**: `v1.0.0`  
**Protocol**: HTTP/1.1 & HTTP/2  
**Base URL**: `http://127.0.0.1:8000`  
**Data Provenance Status**: `REAL_DATA` (Zenodo Benchmark IMD 0.25° + GFS 0.25°)

---

## 1. Global Specifications & Operational Rules

### 1.1 Strict Real Data Integrity
- This API strictly evaluates and serves verified model artifacts trained in Phases 4, 5, 6, and 7.
- **Zero Data Fabrication**: Meteorological observations and NWP inputs are never simulated or generated synthetically.
- **District Coverage**: Pune District (18.50°N, 73.80°E) is the verified active benchmark station (`BENCHMARK_ACTIVE`). All non-monitored districts return transparent `DATA_UNAVAILABLE` status.
- **Spatial Verification (FSS)**: Fractions Skill Score is reported as `NOT_COMPUTABLE` because current evaluation data is point-based and lacks the required 2-D spatial forecast/observation grid.

### 1.2 Common HTTP Headers
- `Content-Type: application/json`
- `X-Response-Time-Ms`: Processing duration measured in milliseconds.
- `Access-Control-Allow-Origin`: Configured for authorized frontend origins (`http://localhost:3000`, `http://localhost:5173`).

---

## 2. Endpoint Catalog

| Method | Endpoint | Description | Lifecycle Source |
|---|---|---|---|
| `GET` | `/api/health` | Service health, startup state, loaded model inventory | System Lifespan |
| `GET` | `/api/models` | Architecture, version metadata, and calibration specs | Models Registry |
| `POST` | `/api/regime/predict` | Synoptic monsoon weather regime classification | Phase 4 Model |
| `POST` | `/api/rainfall/predict` | Deterministic point NWP rainfall bias-correction | Phase 6 Model |
| `POST` | `/api/rainfall/probability` | Multi-threshold calibrated probability of exceedance | Phase 7 Model |
| `POST` | `/api/forecast` | Consolidated operational deterministic + exceedance suite | Phases 4 + 6 + 7 |
| `GET` | `/api/districts` | Authoritative administrative district catalog | Official Centroids |
| `GET` | `/api/district/{district_id}/forecast` | Station-specific forecast retrieval or honest unavailability | Benchmark Trace |
| `GET` | `/api/verification/summary` | Consolidated verification metrics & FSS status | Phase 8 Engine |
| `GET` | `/api/verification/thresholds` | Threshold-by-threshold categorical verification | Phase 8 Engine |
| `GET` | `/api/verification/regimes` | Synoptic regime stratified continuous metrics | Phase 8 Engine |
| `GET` | `/api/verification/probability` | Reliability, Brier score, ROC-AUC for probability suite | Phase 8 Engine |

---

## 3. Detailed Endpoint Specifications

### 3.1 Health & Service Inspection

#### `GET /api/health`
Returns service readiness, loaded models status, and environment provenance.

**Request:**
```bash
curl -X GET "http://127.0.0.1:8000/api/health"
```

**Response (`200 OK`):**
```json
{
  "status": "ok",
  "service": "VarshaPurvanumanAI Backend",
  "version": "1.0.0",
  "model_status": {
    "regime_classifier": "loaded",
    "global_postprocessor": "loaded",
    "regime_postprocessor": "loaded",
    "probability_suite": "loaded",
    "feature_provenance": "loaded"
  },
  "data_status": "REAL_DATA",
  "environment": "production"
}
```

---

#### `GET /api/models`
Returns immutable architecture specifications and hyperparameters for all loaded model artifacts.

**Request:**
```bash
curl -X GET "http://127.0.0.1:8000/api/models"
```

**Response (`200 OK`):**
```json
{
  "regime_classifier": {
    "model_version": "v1.0.0-phase4",
    "algorithm": "GradientBoostingClassifier (n_estimators=100, max_depth=4)",
    "supported_classes": [
      "ACTIVE_MONSOON",
      "BREAK_MONSOON",
      "COASTAL_OROGRAPHIC",
      "DEPRESSION",
      "OTHER"
    ],
    "status": "loaded"
  },
  "global_postprocessor": {
    "model_version": "v1.0.0-phase5",
    "algorithm": "RandomForestRegressor (n_estimators=100, max_depth=8)",
    "rmse_reduction_pct": 22.3,
    "status": "loaded"
  },
  "regime_aware_postprocessor": {
    "model_version": "v1.0.0-phase6",
    "architecture": "Hierarchical Regime Conditioning with Discrete Fallback",
    "dedicated_submodels": [
      "ACTIVE_MONSOON",
      "BREAK_MONSOON",
      "COASTAL_OROGRAPHIC",
      "DEPRESSION",
      "OTHER"
    ],
    "routing_mode": "hard (operational predicted regime routing)",
    "status": "loaded"
  },
  "probability_suite": {
    "model_version": "v1.0.0-phase7",
    "calibration_method": "Platt Sigmoid Scaling (cv=3)",
    "supported_thresholds": [2.5, 7.5, 15.6, 64.5, 115.6],
    "status": "loaded"
  },
  "verified_thresholds": {
    "2.5": { "name": "Rainy Day", "category": "OPERATIONAL" },
    "7.5": { "name": "Surge Proxy", "category": "EXPERIMENTAL" },
    "15.6": { "name": "Moderate Rain", "category": "OPERATIONAL" },
    "64.5": { "name": "Heavy Rain", "category": "OPERATIONAL" },
    "115.6": { "name": "Very Heavy Rain", "category": "OPERATIONAL" }
  },
  "data_status": "REAL_DATA"
}
```

---

### 3.2 Operational AI Forecast Pipelines

#### `POST /api/regime/predict`
Classifies synoptic meteorological state into one of 5 verified categories: `ACTIVE_MONSOON`, `BREAK_MONSOON`, `COASTAL_OROGRAPHIC`, `DEPRESSION`, `OTHER`.

**Request:**
```bash
curl -X POST "http://127.0.0.1:8000/api/regime/predict" \
     -H "Content-Type: application/json" \
     -d '{
       "nwp_rainfall": 12.5,
       "wind_speed_ms": 5.4,
       "u_wind_10m": 4.2,
       "v_wind_10m": -1.1,
       "temperature_2m": 27.5,
       "relative_humidity_2m": 88.0,
       "surface_pressure": 980.0,
       "cape": 1450.0,
       "month": 6,
       "day_of_year": 180,
       "latitude": 18.5204,
       "longitude": 73.8567
     }'
```

**Response (`200 OK`):**
```json
{
  "predicted_regime": "OTHER",
  "probabilities": {
    "ACTIVE_MONSOON": 0.0107,
    "BREAK_MONSOON": 0.0081,
    "COASTAL_OROGRAPHIC": 0.0154,
    "DEPRESSION": 0.0207,
    "OTHER": 0.9451
  },
  "confidence": 0.9451,
  "model_version": "v1.0.0-phase4",
  "data_status": "REAL_DATA",
  "timestamp": "2026-09-22T19:56:21.194450Z"
}
```

---

#### `POST /api/rainfall/predict`
Applies Regime-Aware AI Post-Processing to raw NWP forecast precipitation. Dynamically classifies the synoptic regime, routes input through the dedicated regressor, and clips to physically valid non-negative values.

**Request:**
```bash
curl -X POST "http://127.0.0.1:8000/api/rainfall/predict" \
     -H "Content-Type: application/json" \
     -d '{
       "nwp_rainfall": 12.5,
       "wind_speed_ms": 5.4,
       "u_wind_10m": 4.2,
       "v_wind_10m": -1.1,
       "temperature_2m": 27.5,
       "relative_humidity_2m": 88.0,
       "surface_pressure": 980.0,
       "cape": 1450.0,
       "month": 6,
       "day_of_year": 180,
       "latitude": 18.5204,
       "longitude": 73.8567
     }'
```

**Response (`200 OK`):**
```json
{
  "raw_nwp_rainfall_mm": 12.5,
  "predicted_regime": "OTHER",
  "regime_probabilities": {
    "ACTIVE_MONSOON": 0.0107,
    "BREAK_MONSOON": 0.0081,
    "COASTAL_OROGRAPHIC": 0.0154,
    "DEPRESSION": 0.0207,
    "OTHER": 0.9451
  },
  "selected_model": "dedicated_OTHER",
  "corrected_rainfall_mm": 6.84,
  "model_version": "v1.0.0-phase6",
  "data_status": "REAL_DATA",
  "prediction_source": "verified_model_artifacts",
  "timestamp": "2026-09-22T19:56:21.202945Z"
}
```

---

#### `POST /api/rainfall/probability`
Estimates well-calibrated posterior probabilities $P(\text{Rainfall} \ge T)$ across 5 verified thresholds.

**Request:**
```bash
curl -X POST "http://127.0.0.1:8000/api/rainfall/probability" \
     -H "Content-Type: application/json" \
     -d '{
       "nwp_rainfall": 12.5,
       "wind_speed_ms": 5.4,
       "u_wind_10m": 4.2,
       "v_wind_10m": -1.1,
       "temperature_2m": 27.5,
       "relative_humidity_2m": 88.0,
       "surface_pressure": 980.0,
       "cape": 1450.0,
       "month": 6,
       "day_of_year": 180,
       "latitude": 18.5204,
       "longitude": 73.8567
     }'
```

**Response (`200 OK`):**
```json
{
  "probabilities": [
    {
      "threshold_mm": 2.5,
      "threshold_name": "Rainy Day",
      "category": "OPERATIONAL",
      "exceedance_probability": 0.4931,
      "decision_threshold_tau": 0.3,
      "advisory_status": "ELEVATED_RISK"
    },
    {
      "threshold_mm": 7.5,
      "threshold_name": "Surge Proxy",
      "category": "EXPERIMENTAL",
      "exceedance_probability": 0.1391,
      "decision_threshold_tau": 0.2,
      "advisory_status": "NORMAL_ADVISORY"
    },
    {
      "threshold_mm": 15.6,
      "threshold_name": "Moderate Rain",
      "category": "OPERATIONAL",
      "exceedance_probability": 0.1985,
      "decision_threshold_tau": 0.1,
      "advisory_status": "ELEVATED_RISK"
    },
    {
      "threshold_mm": 64.5,
      "threshold_name": "Heavy Rain",
      "category": "OPERATIONAL",
      "exceedance_probability": 0.0002,
      "decision_threshold_tau": 0.5,
      "advisory_status": "NORMAL_ADVISORY"
    },
    {
      "threshold_mm": 115.6,
      "threshold_name": "Very Heavy Rain",
      "category": "OPERATIONAL",
      "exceedance_probability": 0.0,
      "decision_threshold_tau": 0.5,
      "advisory_status": "NORMAL_ADVISORY"
    }
  ],
  "disclaimer": "MODEL EXCEEDANCE PROBABILITIES ARE SCIENTIFIC NUMERICAL ESTIMATES AND DO NOT CONSTITUTE OFFICIAL IMD WEATHER WARNINGS.",
  "model_version": "v1.0.0-phase7",
  "data_status": "REAL_DATA",
  "timestamp": "2026-09-22T19:56:21.215766Z"
}
```

---

#### `POST /api/forecast`
Unified operational forecast returning deterministic bias-correction, synoptic regime classification, and exceedance risk advisories in a single call.

**Request:**
```bash
curl -X POST "http://127.0.0.1:8000/api/forecast" \
     -H "Content-Type: application/json" \
     -d '{
       "nwp_rainfall": 12.5,
       "wind_speed_ms": 5.4,
       "u_wind_10m": 4.2,
       "v_wind_10m": -1.1,
       "temperature_2m": 27.5,
       "relative_humidity_2m": 88.0,
       "surface_pressure": 980.0,
       "cape": 1450.0,
       "month": 6,
       "day_of_year": 180,
       "latitude": 18.5204,
       "longitude": 73.8567
     }'
```

**Response (`200 OK`):**
```json
{
  "raw_nwp_rainfall_mm": 12.5,
  "predicted_regime": "OTHER",
  "regime_probabilities": {
    "ACTIVE_MONSOON": 0.0107,
    "BREAK_MONSOON": 0.0081,
    "COASTAL_OROGRAPHIC": 0.0154,
    "DEPRESSION": 0.0207,
    "OTHER": 0.9451
  },
  "selected_model": "dedicated_OTHER",
  "corrected_rainfall_mm": 6.84,
  "heavy_rainfall_probabilities": [
    {
      "threshold_mm": 2.5,
      "threshold_name": "Rainy Day",
      "category": "OPERATIONAL",
      "exceedance_probability": 0.4931,
      "decision_threshold_tau": 0.3,
      "advisory_status": "ELEVATED_RISK"
    },
    {
      "threshold_mm": 7.5,
      "threshold_name": "Surge Proxy",
      "category": "EXPERIMENTAL",
      "exceedance_probability": 0.1391,
      "decision_threshold_tau": 0.2,
      "advisory_status": "NORMAL_ADVISORY"
    },
    {
      "threshold_mm": 15.6,
      "threshold_name": "Moderate Rain",
      "category": "OPERATIONAL",
      "exceedance_probability": 0.1985,
      "decision_threshold_tau": 0.1,
      "advisory_status": "ELEVATED_RISK"
    },
    {
      "threshold_mm": 64.5,
      "threshold_name": "Heavy Rain",
      "category": "OPERATIONAL",
      "exceedance_probability": 0.0002,
      "decision_threshold_tau": 0.5,
      "advisory_status": "NORMAL_ADVISORY"
    },
    {
      "threshold_mm": 115.6,
      "threshold_name": "Very Heavy Rain",
      "category": "OPERATIONAL",
      "exceedance_probability": 0.0,
      "decision_threshold_tau": 0.5,
      "advisory_status": "NORMAL_ADVISORY"
    }
  ],
  "model_metadata": {
    "regime_classifier": "Phase 4 GradientBoostingClassifier (v1.0.0-phase4)",
    "deterministic_postprocessor": "Phase 6 RegimeAwarePostProcessor (v1.0.0-phase6)",
    "probability_engine": "Phase 7 Platt-Calibrated Suite (v1.0.0-phase7)",
    "selected_submodel": "dedicated_OTHER"
  },
  "data_status": "REAL_DATA",
  "prediction_source": "verified_model_artifacts",
  "timestamp": "2026-09-22T19:56:21.233789Z"
}
```

---

### 3.3 Geographic & District Forecasts

#### `GET /api/districts`
Catalog of verified administrative district centroids across India.

**Request:**
```bash
curl -X GET "http://127.0.0.1:8000/api/districts"
```

**Response (`200 OK`):**
```json
{
  "total_districts": 78,
  "active_districts": 1,
  "districts": [
    {
      "district_id": "pune",
      "name": "Pune",
      "state": "Maharashtra",
      "latitude": 18.5204,
      "longitude": 73.8567,
      "coverage_status": "BENCHMARK_ACTIVE"
    },
    {
      "district_id": "nagpur",
      "name": "Nagpur",
      "state": "Maharashtra",
      "latitude": 21.1458,
      "longitude": 79.0882,
      "coverage_status": "REFERENCE_ONLY"
    }
  ],
  "data_status": "REAL_DATA"
}
```

---

#### `GET /api/district/{district_id}/forecast`
Retrieves benchmark station forecast or transparent unavailability notice.

**Active Station Query (`pune`):**
```bash
curl -X GET "http://127.0.0.1:8000/api/district/pune/forecast"
```
**Response (`200 OK`):**
```json
{
  "district_id": "pune",
  "name": "Pune",
  "latitude": 18.5204,
  "longitude": 73.8567,
  "coverage_status": "BENCHMARK_ACTIVE",
  "forecast": {
    "raw_nwp_rainfall_mm": 5.4,
    "predicted_regime": "OTHER",
    "corrected_rainfall_mm": 3.26
  },
  "message": "Real verified NWP + post-processed forecast from Pune benchmark station.",
  "data_status": "REAL_DATA"
}
```

**Non-Monitored Station Query (`nagpur`):**
```bash
curl -X GET "http://127.0.0.1:8000/api/district/nagpur/forecast"
```
**Response (`200 OK`):**
```json
{
  "district_id": "nagpur",
  "name": "Nagpur",
  "latitude": 21.1458,
  "longitude": 79.0882,
  "coverage_status": "DATA_UNAVAILABLE",
  "forecast": null,
  "message": "Real forecast data is currently available only for the Pune District benchmark station (18.50°N, 73.80°E). Forecasts for 'Nagpur' are not fabricated.",
  "data_status": "REAL_DATA"
}
```

---

### 3.4 Authoritative Verification Engine (Read-Only)

#### `GET /api/verification/summary`
Reports continuous metrics, categorical metrics, uncertainty bounds, and explicit `FSS` status from Phase 8.

**Request:**
```bash
curl -X GET "http://127.0.0.1:8000/api/verification/summary"
```

**Response (`200 OK`):**
```json
{
  "test_period": "June 1 - June 30, 2024",
  "test_sample_count": 31,
  "continuous_metrics": {
    "Raw NWP": { "rmse": 11.62, "mae": 8.35, "mean_bias": 2.76, "pearson_r": 0.41 },
    "Global ML": { "rmse": 9.03, "mae": 6.63, "mean_bias": -1.57, "pearson_r": 0.29 },
    "Regime-Aware ML": { "rmse": 9.61, "mae": 6.66, "mean_bias": -2.35, "pearson_r": 0.10 }
  },
  "fss": {
    "metric": "FSS",
    "status": "NOT_COMPUTABLE",
    "reason": "Current evaluation data is point-based and lacks the required 2-D spatial forecast/observation grid."
  },
  "scientific_conclusion": "Global ML achieves lowest overall RMSE (9.03 mm vs Raw NWP 11.62 mm, 22.3% error reduction). Regime-Aware ML provides dedicated regime routing (9.61 mm, 17.3% error reduction).",
  "data_status": "REAL_DATA"
}
```

---

## 4. Error Responses

The API uses standardized RFC 7807 compliant error bodies.

### 4.1 Schema / Validation Error (`422 Unprocessable Content`)
Returned when an input payload violates meteorological bounds, contains target leakage words, or has NaN values.

```json
{
  "error": "Validation Failure",
  "details": [
    "body -> nwp_rainfall: Input should be greater than or equal to 0"
  ],
  "data_status": "REAL_DATA"
}
```

### 4.2 Resource Not Found (`404 Not Found`)
```json
{
  "detail": "District 'unknown_district' is not recognized in the verified administrative registry."
}
```
