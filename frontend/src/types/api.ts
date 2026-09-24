/**
 * VarshaPurvanumanAI (SIH26080) - Core API Types
 * Strict typed mirror of Phase 9 FastAPI schemas.
 */

export type DataStatus =
  | 'REAL_DATA'
  | 'HISTORICAL_BENCHMARK'
  | 'DEMO_DATA'
  | 'LIVE_NWP'
  | 'OPERATIONAL_NWP'
  | 'DATA_UNAVAILABLE';

export type SynopticRegime =
  | 'ACTIVE_MONSOON'
  | 'BREAK_MONSOON'
  | 'COASTAL_OROGRAPHIC'
  | 'DEPRESSION'
  | 'OTHER';

export type CoverageStatus =
  | 'BENCHMARK_ACTIVE'
  | 'PROCESSED_BENCHMARK'
  | 'OPERATIONAL_ACTIVE'
  | 'REFERENCE_ONLY'
  | 'DATA_UNAVAILABLE'
  | 'UNKNOWN_DISTRICT';

export type AppRoute =
  | 'dashboard'
  | 'forecast'
  | 'regime'
  | 'probability'
  | 'verification'
  | 'districts'
  | 'provenance'
  | 'health';

export interface UserProfile {
  username: string;
  name: string;
  role: string;
  is_demo: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
  message: string;
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
  model_status: {
    regime_classifier: string;
    global_postprocessor: string;
    regime_postprocessor: string;
    probability_suite: string;
    feature_provenance: string;
  };
  data_status: DataStatus;
  environment: string;
}

export interface ModelInfoItem {
  model_version: string;
  algorithm?: string;
  architecture?: string;
  supported_classes?: string[];
  dedicated_submodels?: string[];
  routing_mode?: string;
  calibration_method?: string;
  supported_thresholds?: number[];
  rmse_reduction_pct?: number;
  status: string;
}

export interface ModelInfoResponse {
  regime_classifier: ModelInfoItem;
  global_postprocessor: ModelInfoItem;
  regime_aware_postprocessor: ModelInfoItem;
  probability_suite: ModelInfoItem;
  verified_thresholds: Record<string, { name: string; category: string }>;
  data_status: DataStatus;
}

export interface RegimePredictionRequest {
  nwp_rainfall?: number;
  wind_speed_ms?: number;
  u_wind_10m?: number;
  v_wind_10m?: number;
  temperature_2m?: number;
  relative_humidity_2m?: number;
  surface_pressure?: number;
  cape?: number;
  month?: number;
  day_of_year?: number;
  latitude?: number;
  longitude?: number;
  forecast_lead_time?: number;
  features?: Record<string, number>;
}

export interface RegimePredictionResponse {
  predicted_regime: SynopticRegime;
  probabilities: Record<SynopticRegime, number>;
  confidence: number;
  model_version: string;
  data_status: DataStatus;
  timestamp: string;
}

export interface RainfallPredictionResponse {
  raw_nwp_rainfall_mm: number;
  predicted_regime: SynopticRegime;
  regime_probabilities: Record<string, number>;
  selected_model: string;
  corrected_rainfall_mm: number;
  model_version: string;
  data_status: DataStatus;
  prediction_source: string;
  timestamp: string;
}

export interface ProbabilityThresholdItem {
  threshold_mm: number;
  threshold_name: string;
  category: 'OPERATIONAL' | 'EXPERIMENTAL';
  exceedance_probability: number;
  decision_threshold_tau: number;
  advisory_status: 'NORMAL_ADVISORY' | 'ELEVATED_RISK';
}

export interface ProbabilityPredictionResponse {
  probabilities: ProbabilityThresholdItem[];
  disclaimer: string;
  model_version: string;
  data_status: DataStatus;
  timestamp: string;
}

export interface CombinedForecastResponse {
  raw_nwp_rainfall_mm: number;
  predicted_regime: SynopticRegime;
  regime_probabilities: Record<string, number>;
  selected_model: string;
  corrected_rainfall_mm: number;
  heavy_rainfall_probabilities: ProbabilityThresholdItem[];
  model_metadata: Record<string, string>;
  data_status: DataStatus;
  forecast_mode?: string;
  sample_timestamp?: string;
  prediction_source: string;
  timestamp: string;
}

export interface DistrictItem {
  district_id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  coverage_status: CoverageStatus;
  raw_nwp_rainfall_mm?: number | null;
  corrected_rainfall_mm?: number | null;
  predicted_regime?: string | null;
}

export interface DistrictListResponse {
  total_districts: number;
  active_districts: number;
  districts: DistrictItem[];
  data_status: DataStatus;
}

export interface DistrictForecastResponse {
  district_id: string;
  name: string;
  latitude: number;
  longitude: number;
  coverage_status: CoverageStatus;
  forecast: CombinedForecastResponse | null;
  message: string;
  forecast_mode?: string;
  sample_timestamp?: string;
  data_status: DataStatus;
}

export interface ContinuousMetricsItem {
  rmse: number;
  mae: number;
  mean_bias: number;
  pearson_r: number;
  mean_forecast: number;
  mean_observed: number;
  sample_count: number;
}

export interface CategoricalThresholdMetrics {
  threshold_mm: number;
  category: string;
  contingency_table: {
    H: number;
    F: number;
    M: number;
    C: number;
    total: number;
    observed_events: number;
    forecast_events: number;
  };
  POD: number;
  FAR: number;
  CSI: number;
  ETS: number;
}

export interface FSSStatusItem {
  metric: 'FSS';
  status: 'NOT_COMPUTABLE' | 'COMPUTABLE';
  reason: string;
}

export interface VerificationSummaryResponse {
  test_period: string;
  test_sample_count: number;
  continuous_metrics: {
    'Raw NWP': ContinuousMetricsItem;
    'Global ML': ContinuousMetricsItem;
    'Regime-Aware ML': ContinuousMetricsItem;
  };
  categorical_metrics: Record<string, Record<string, CategoricalThresholdMetrics>>;
  uncertainty_intervals_95: Record<string, Record<string, [number, number]>>;
  fss: FSSStatusItem;
  scientific_conclusion: string;
  data_status: DataStatus;
}

export interface ProbabilityMetricItem {
  threshold_mm: number;
  brier_score: number;
  roc_auc: number | string;
  pr_auc: number | string;
  reliability_slope: number | string;
  optimal_tau: number;
  contingency_at_optimal_tau: Record<string, any>;
  observed_positive_rate: number;
  forecast_positive_rate: number;
}

export interface VerificationProbabilityResponse {
  global_model: Record<string, ProbabilityMetricItem>;
  regime_aware_model: Record<string, ProbabilityMetricItem>;
  data_status: DataStatus;
}

export interface VerificationRegimesResponse {
  regimes: Record<string, Record<string, ContinuousMetricsItem>>;
  data_status: DataStatus;
}
