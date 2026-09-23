# VarshaPurvanumanAI (SIH26080) — API Data Contracts & Validation Specifications

**Ministry of Earth Sciences (MoES) / Smart India Hackathon 2024**  
**Contract Version**: `v1.0.0`  
**Schema Implementation**: Pydantic v2.13.5

---

## 1. Input Data Contracts

### 1.1 `RainfallPredictionRequest` / `RegimePredictionRequest`
Both endpoints accept either a pre-engineered 29-feature dictionary matching the model training matrix or high-level physical NWP variables.

```python
class RainfallPredictionRequest(BaseModel):
    features: Optional[Dict[str, float]] = None
    nwp_rainfall: Optional[float] = Field(default=None, ge=0.0)
    wind_speed_ms: Optional[float] = Field(default=None, ge=0.0)
    u_wind_10m: Optional[float] = None
    v_wind_10m: Optional[float] = None
    temperature_2m: Optional[float] = None
    relative_humidity_2m: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    surface_pressure: Optional[float] = Field(default=None, gt=500.0, lt=1100.0)
    cape: Optional[float] = Field(default=None, ge=0.0)
    month: Optional[int] = Field(default=None, ge=1, le=12)
    day_of_year: Optional[int] = Field(default=None, ge=1, le=366)
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    forecast_lead_time: Optional[float] = Field(default=1.0, ge=0.0)
```

#### Field Validation Rules:
1. **Empty Payload Check**: An empty JSON object `{}` is rejected with `422 Unprocessable Content`. Either `features` or at least one physical parameter must be supplied.
2. **Physical Bounds**:
   - `nwp_rainfall >= 0.0` mm (rainfall cannot be negative).
   - `wind_speed_ms >= 0.0` m/s.
   - `0.0 <= relative_humidity_2m <= 100.0` %.
   - `500.0 < surface_pressure < 1100.0` hPa.
   - `cape >= 0.0` J/kg.
   - `-90.0 <= latitude <= 90.0`, `-180.0 <= longitude <= 180.0`.
3. **Leakage Shield**: If `features` dictionary contains keys matching `observed`, `obs_rain`, `target`, `label`, or `true_regime`, request is rejected with `422`.
4. **NaN / Infinity Filter**: Any non-finite float value raises an immediate `422` error.

---

## 2. Canonical 29-Feature Alignment

When high-level meteorological parameters are provided, the `FeatureService` synthesizes the exact canonical 29-feature column order required by the pre-trained models:

| Index | Feature Name | Unit / Type | Computation / Source |
|---|---|---|---|
| 0 | `nwp_rainfall` | mm | Input raw NWP forecast |
| 1 | `log_nwp_rainfall` | log(1 + mm) | $\ln(1 + \text{nwp\_rainfall})$ |
| 2 | `wind_speed_ms` | m/s | 10m wind speed |
| 3 | `u_wind_10m` | m/s | Zonal wind component |
| 4 | `v_wind_10m` | m/s | Meridional wind component |
| 5 | `temperature_2m` | °C | 2m surface air temperature |
| 6 | `relative_humidity_2m` | % | 2m relative humidity |
| 7 | `dew_point_depression` | °C | $(100 - \text{RH}) / 5$ |
| 8 | `surface_pressure` | hPa | Surface atmospheric pressure |
| 9 | `cape` | J/kg | Convective available potential energy |
| 10 | `w_max_convective` | m/s | $\sqrt{2 \times \max(0, \text{CAPE})}$ |
| 11 | `month` | int [1-12] | Calendar month |
| 12 | `day_of_year` | int [1-366] | Day of year |
| 13 | `sin_doy` | float [-1, 1] | $\sin(2\pi \times \text{DOY} / 365.25)$ |
| 14 | `cos_doy` | float [-1, 1] | $\cos(2\pi \times \text{DOY} / 365.25)$ |
| 15 | `sin_month` | float [-1, 1] | $\sin(2\pi \times \text{Month} / 12)$ |
| 16 | `cos_month` | float [-1, 1] | $\cos(2\pi \times \text{Month} / 12)$ |
| 17 | `is_monsoon_season` | binary {0, 1} | 1 if Month in [6, 7, 8, 9] else 0 |
| 18 | `is_monsoon_core` | binary {0, 1} | 1 if Month in [7, 8] else 0 |
| 19 | `is_ne_monsoon` | binary {0, 1} | 1 if Month in [10, 11, 12] else 0 |
| 20 | `forecast_lead_time` | days | Forecast lead time |
| 21 | `latitude` | degrees | Point latitude |
| 22 | `longitude` | degrees | Point longitude |
| 23 | `in_core_monsoon_zone` | binary {0, 1} | $18.0 \le \text{Lat} \le 27.0 \land 72.0 \le \text{Lon} \le 88.0$ |
| 24 | `in_western_ghats_belt` | binary {0, 1} | $8.0 \le \text{Lat} \le 21.0 \land 73.0 \le \text{Lon} \le 75.5$ |
| 25 | `in_northeast_hills` | binary {0, 1} | $22.0 \le \text{Lat} \le 29.0 \land 89.0 \le \text{Lon} \le 97.0$ |
| 26 | `dist_to_coast_approx_km` | km | Distance proxy to Indian coastline |
| 27 | `nwp_rainfall_lag1` | mm | Lag-1 rainfall proxy (defaults to NWP) |
| 28 | `nwp_rainfall_rolling3` | mm | 3-day rolling rainfall proxy |

---

## 3. Output Data Contracts

### 3.1 `RegimePredictionResponse`
```python
class RegimePredictionResponse(BaseModel):
    predicted_regime: str  # ACTIVE_MONSOON, BREAK_MONSOON, COASTAL_OROGRAPHIC, DEPRESSION, OTHER
    probabilities: Dict[str, float]  # Class posterior probabilities, sum ~ 1.0
    confidence: float  # max(probabilities)
    model_version: str  # "v1.0.0-phase4"
    data_status: str  # "REAL_DATA"
    timestamp: str  # ISO-8601 UTC
```

### 3.2 `RainfallPredictionResponse`
```python
class RainfallPredictionResponse(BaseModel):
    raw_nwp_rainfall_mm: float
    predicted_regime: str
    regime_probabilities: Dict[str, float]
    selected_model: str  # e.g., "dedicated_break_monsoon" or "global_fallback"
    corrected_rainfall_mm: float  # Enforced >= 0.0
    model_version: str  # "v1.0.0-phase6"
    data_status: str  # "REAL_DATA"
    prediction_source: str  # "verified_model_artifacts"
    timestamp: str  # ISO-8601 UTC
```

### 3.3 `ProbabilityThresholdItem` & `ProbabilityPredictionResponse`
```python
class ProbabilityThresholdItem(BaseModel):
    threshold_mm: float  # 2.5, 7.5, 15.6, 64.5, 115.6
    threshold_name: str  # "Rainy Day", "Surge Proxy", "Moderate Rain", "Heavy Rain", "Very Heavy Rain"
    category: str  # "OPERATIONAL" or "EXPERIMENTAL"
    exceedance_probability: float  # [0.0, 1.0] Platt-calibrated
    decision_threshold_tau: float  # Optimal decision threshold
    advisory_status: str  # "NORMAL_ADVISORY" or "ELEVATED_RISK"

class ProbabilityPredictionResponse(BaseModel):
    probabilities: List[ProbabilityThresholdItem]
    disclaimer: str
    model_version: str  # "v1.0.0-phase7"
    data_status: str  # "REAL_DATA"
    timestamp: str  # ISO-8601 UTC
```

### 3.4 `CombinedForecastResponse`
```python
class CombinedForecastResponse(BaseModel):
    raw_nwp_rainfall_mm: float
    predicted_regime: str
    regime_probabilities: Dict[str, float]
    selected_model: str
    corrected_rainfall_mm: float
    heavy_rainfall_probabilities: List[ProbabilityThresholdItem]
    model_metadata: Dict[str, str]
    data_status: str  # "REAL_DATA"
    prediction_source: str  # "verified_model_artifacts"
    timestamp: str  # ISO-8601 UTC
```

### 3.5 `DistrictForecastResponse`
```python
class DistrictForecastResponse(BaseModel):
    district_id: str
    name: str
    latitude: float
    longitude: float
    coverage_status: str  # "BENCHMARK_ACTIVE" or "DATA_UNAVAILABLE" or "UNKNOWN_DISTRICT"
    forecast: Optional[CombinedForecastResponse]
    message: Optional[str]
    data_status: str  # "REAL_DATA"
```

### 3.6 `VerificationSummaryResponse`
```python
class FSSStatusItem(BaseModel):
    metric: str = "FSS"
    status: str = "NOT_COMPUTABLE"
    reason: str

class VerificationSummaryResponse(BaseModel):
    test_period: str
    test_sample_count: int
    continuous_metrics: Dict[str, Dict[str, float]]
    categorical_metrics: Dict[str, Any]
    uncertainty_intervals_95: Dict[str, Any]
    fss: FSSStatusItem
    scientific_conclusion: str
    data_status: str = "REAL_DATA"
```
