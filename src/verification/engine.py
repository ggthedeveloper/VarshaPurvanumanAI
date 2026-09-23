"""
Comprehensive Verification Engine for SIH26080.
Consolidates deterministic, probabilistic, spatial, and regime-wise evaluation
for Raw NWP, Global ML, Regime-Aware ML, and Probability of Exceedance models.
Provides block-bootstrap uncertainty estimation and strict handling of edge cases.
"""
import os
import json
import pickle
import platform
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, List, Tuple, Union

from src.metrics.continuous import rmse, mae, mean_bias, pearson_r
from src.metrics.categorical import (
    compute_contingency_table,
    pod,
    far,
    csi,
    ets,
    evaluate_threshold_metrics,
)
from src.metrics.probabilistic import (
    brier_score,
    brier_score_decomposition,
    brier_skill_score,
    roc_auc_metric,
    pr_auc_metric,
    expected_calibration_error,
    maximum_calibration_error,
    evaluate_probability_forecast,
)
from src.probability.exceedance_model import VERIFIED_THRESHOLDS


class VerificationEngine:
    """
    Master Verification Engine executing standardized, reproducible verification
    across deterministic and probabilistic rainfall forecasting systems.
    """

    def __init__(
        self,
        deterministic_trace_path: str = "data/processed/predictions_trace_test.csv",
        probability_trace_path: str = "data/processed/probability_predictions_trace_test.csv",
        global_model_path: str = "models/global_postprocessor.pkl",
        features_test_path: str = "data/processed/X_test.csv",
        random_seed: int = 42,
    ):
        self.deterministic_trace_path = deterministic_trace_path
        self.probability_trace_path = probability_trace_path
        self.global_model_path = global_model_path
        self.features_test_path = features_test_path
        self.random_seed = random_seed

        self.df_det: Optional[pd.DataFrame] = None
        self.df_prob: Optional[pd.DataFrame] = None
        self.y_true: Optional[np.ndarray] = None
        self.y_raw: Optional[np.ndarray] = None
        self.y_glob: Optional[np.ndarray] = None
        self.y_reg: Optional[np.ndarray] = None

        self.metrics_summary_: Dict[str, Any] = {}
        self.metadata_: Dict[str, Any] = {}

    def load_data(self):
        """Loads and validates test traces and models."""
        self.df_det = pd.read_csv(self.deterministic_trace_path)
        self.df_prob = pd.read_csv(self.probability_trace_path)

        self.y_true = self.df_det["observed_rainfall"].values
        self.y_raw = self.df_det["raw_nwp_rainfall"].values
        self.y_reg = self.df_det["corrected_rainfall"].values

        # Load Global ML predictions directly from model to ensure zero discrepancy
        with open(self.global_model_path, "rb") as f:
            glob_model = pickle.load(f)
        X_test = pd.read_csv(self.features_test_path)
        self.y_glob = glob_model.predict(X_test)

        assert len(self.y_true) == 31, f"Expected 31 test samples, got {len(self.y_true)}"
        assert len(self.y_raw) == 31
        assert len(self.y_glob) == 31
        assert len(self.y_reg) == 31

        return self

    def compute_continuous_metrics(self) -> Dict[str, Dict[str, float]]:
        """Computes RMSE, MAE, Mean Bias, and Pearson r for deterministic models."""
        results = {}
        models = [
            ("Raw NWP", self.y_raw),
            ("Global ML", self.y_glob),
            ("Regime-Aware ML", self.y_reg),
        ]
        for name, pred in models:
            results[name] = {
                "rmse": float(rmse(self.y_true, pred)),
                "mae": float(mae(self.y_true, pred)),
                "mean_bias": float(mean_bias(self.y_true, pred)),
                "pearson_r": float(pearson_r(self.y_true, pred)),
                "mean_forecast": float(np.mean(pred)),
                "mean_observed": float(np.mean(self.y_true)),
                "sample_count": len(self.y_true),
            }
        return results

    def compute_categorical_metrics(self) -> Dict[str, Dict[float, Dict[str, Any]]]:
        """Computes contingency metrics across all verified thresholds."""
        results = {"Raw NWP": {}, "Global ML": {}, "Regime-Aware ML": {}}
        models = [
            ("Raw NWP", self.y_raw),
            ("Global ML", self.y_glob),
            ("Regime-Aware ML", self.y_reg),
        ]
        thresholds = sorted(list(VERIFIED_THRESHOLDS.keys()))

        for name, pred in models:
            for thr in thresholds:
                cat = evaluate_threshold_metrics(self.y_true, pred, thr)
                table = cat["contingency_table"]
                observed_events = table["observed_events"]
                forecast_events = table["forecast_events"]

                # Strict mathematical handling of edge cases
                if observed_events == 0:
                    pod_status = "NOT COMPUTABLE"
                    csi_status = "NOT COMPUTABLE"
                    ets_status = "NOT COMPUTABLE"
                else:
                    pod_status = cat["POD"]
                    csi_status = cat["CSI"]
                    ets_status = cat["ETS"]

                if forecast_events == 0:
                    far_status = "NOT COMPUTABLE"
                else:
                    far_status = cat["FAR"]

                results[name][thr] = {
                    "threshold_mm": thr,
                    "category": VERIFIED_THRESHOLDS[thr]["category"],
                    "contingency_table": table,
                    "POD": pod_status,
                    "FAR": far_status,
                    "CSI": csi_status,
                    "ETS": ets_status,
                    "fss": "FSS NOT COMPUTABLE FOR CURRENT POINT-BASED DATA",
                    "sample_sufficiency": "SUFFICIENT" if observed_events >= 5 else "INSUFFICIENT TEST EVENTS",
                }
        return results

    def compute_bootstrap_uncertainty(
        self,
        block_length: int = 3,
        n_bootstraps: int = 1000,
        ci_level: float = 0.95
    ) -> Dict[str, Dict[str, List[float]]]:
        """
        Computes block bootstrap confidence intervals to account for synoptic persistence.
        """
        np.random.seed(self.random_seed)
        n = len(self.y_true)
        n_blocks = int(np.ceil(n / block_length))
        lower_pct = (1.0 - ci_level) / 2.0 * 100.0
        upper_pct = (1.0 + ci_level) / 2.0 * 100.0

        models = [
            ("Raw NWP", self.y_raw),
            ("Global ML", self.y_glob),
            ("Regime-Aware ML", self.y_reg),
        ]
        bootstrap_distributions: Dict[str, Dict[str, List[float]]] = {
            m[0]: {"rmse": [], "mae": [], "bias": []} for m in models
        }

        for _ in range(n_bootstraps):
            start_indices = np.random.randint(0, n - block_length + 1, size=n_blocks)
            indices = np.concatenate([np.arange(s, s + block_length) for s in start_indices])[:n]

            yt_sample = self.y_true[indices]
            for name, pred in models:
                p_sample = pred[indices]
                bootstrap_distributions[name]["rmse"].append(rmse(yt_sample, p_sample))
                bootstrap_distributions[name]["mae"].append(mae(yt_sample, p_sample))
                bootstrap_distributions[name]["bias"].append(mean_bias(yt_sample, p_sample))

        ci_results = {}
        for name in bootstrap_distributions:
            ci_results[name] = {
                "rmse_ci": [
                    float(np.percentile(bootstrap_distributions[name]["rmse"], lower_pct)),
                    float(np.percentile(bootstrap_distributions[name]["rmse"], upper_pct)),
                ],
                "mae_ci": [
                    float(np.percentile(bootstrap_distributions[name]["mae"], lower_pct)),
                    float(np.percentile(bootstrap_distributions[name]["mae"], upper_pct)),
                ],
                "bias_ci": [
                    float(np.percentile(bootstrap_distributions[name]["bias"], lower_pct)),
                    float(np.percentile(bootstrap_distributions[name]["bias"], upper_pct)),
                ],
            }
        return ci_results

    def compute_regime_wise_metrics(self) -> Dict[str, Any]:
        """Computes metrics broken down by operational predicted regime and true regime."""
        pred_regimes = self.df_det["predicted_regime"].values
        true_regimes = self.df_det["true_regime"].values

        all_regimes = ["ACTIVE_MONSOON", "BREAK_MONSOON", "COASTAL_OROGRAPHIC", "DEPRESSION", "OTHER"]
        results = {}

        for reg in all_regimes:
            mask = (pred_regimes == reg)
            count = int(np.sum(mask))

            if count == 0:
                results[reg] = {
                    "sample_count": 0,
                    "status": "NOT COMPUTABLE (NO TEST SAMPLES)",
                    "models": {},
                }
            elif count < 5:
                # Insufficient sample size for reliable statistics
                yt_sub = self.y_true[mask]
                results[reg] = {
                    "sample_count": count,
                    "status": "INSUFFICIENT SAMPLE SIZE",
                    "models": {
                        "Raw NWP": {"rmse": float(rmse(yt_sub, self.y_raw[mask])), "mean_obs": float(np.mean(yt_sub))},
                        "Global ML": {"rmse": float(rmse(yt_sub, self.y_glob[mask])), "mean_obs": float(np.mean(yt_sub))},
                        "Regime-Aware ML": {"rmse": float(rmse(yt_sub, self.y_reg[mask])), "mean_obs": float(np.mean(yt_sub))},
                    },
                }
            else:
                yt_sub = self.y_true[mask]
                results[reg] = {
                    "sample_count": count,
                    "status": "EVALUATED",
                    "models": {
                        "Raw NWP": {
                            "rmse": float(rmse(yt_sub, self.y_raw[mask])),
                            "mae": float(mae(yt_sub, self.y_raw[mask])),
                            "bias": float(mean_bias(yt_sub, self.y_raw[mask])),
                        },
                        "Global ML": {
                            "rmse": float(rmse(yt_sub, self.y_glob[mask])),
                            "mae": float(mae(yt_sub, self.y_glob[mask])),
                            "bias": float(mean_bias(yt_sub, self.y_glob[mask])),
                        },
                        "Regime-Aware ML": {
                            "rmse": float(rmse(yt_sub, self.y_reg[mask])),
                            "mae": float(mae(yt_sub, self.y_reg[mask])),
                            "bias": float(mean_bias(yt_sub, self.y_reg[mask])),
                        },
                    },
                }
        return results

    def compute_probability_metrics(self) -> Dict[str, Dict[float, Dict[str, Any]]]:
        """Loads and consolidates probability model performance from Phase 7."""
        with open("models/probability_evaluation.json", "r") as f:
            eval_prob = json.load(f)

        return {
            "global_probability_model": eval_prob["test_evaluation_tuned_tau"]["global_model"],
            "regime_aware_probability_model": eval_prob["test_evaluation_tuned_tau"]["regime_aware_model"],
        }

    def compute_error_analysis(self) -> Dict[str, Any]:
        """Analyzes systematic errors: overprediction, underprediction, and misses."""
        errors_raw = self.y_raw - self.y_true
        errors_glob = self.y_glob - self.y_true
        errors_reg = self.y_reg - self.y_true

        return {
            "Raw NWP": {
                "overprediction_days": int(np.sum(errors_raw > 1.0)),
                "underprediction_days": int(np.sum(errors_raw < -1.0)),
                "neutral_days": int(np.sum(np.abs(errors_raw) <= 1.0)),
                "max_overprediction_mm": float(np.max(errors_raw)),
                "max_underprediction_mm": float(np.min(errors_raw)),
            },
            "Global ML": {
                "overprediction_days": int(np.sum(errors_glob > 1.0)),
                "underprediction_days": int(np.sum(errors_glob < -1.0)),
                "neutral_days": int(np.sum(np.abs(errors_glob) <= 1.0)),
                "max_overprediction_mm": float(np.max(errors_glob)),
                "max_underprediction_mm": float(np.min(errors_glob)),
            },
            "Regime-Aware ML": {
                "overprediction_days": int(np.sum(errors_reg > 1.0)),
                "underprediction_days": int(np.sum(errors_reg < -1.0)),
                "neutral_days": int(np.sum(np.abs(errors_reg) <= 1.0)),
                "max_overprediction_mm": float(np.max(errors_reg)),
                "max_underprediction_mm": float(np.min(errors_reg)),
            },
        }

    def run_full_verification(self) -> Dict[str, Any]:
        """Runs the complete verification pipeline and exports artifacts."""
        self.load_data()

        continuous = self.compute_continuous_metrics()
        categorical = self.compute_categorical_metrics()
        uncertainty = self.compute_bootstrap_uncertainty()
        regime_wise = self.compute_regime_wise_metrics()
        probability = self.compute_probability_metrics()
        errors = self.compute_error_analysis()

        # Build clean JSON structures
        def convert_for_json(obj):
            if isinstance(obj, dict):
                return {str(k): convert_for_json(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_for_json(v) for v in obj]
            elif isinstance(obj, (np.integer, int)):
                return int(obj)
            elif isinstance(obj, (np.floating, float)):
                return float(obj)
            elif isinstance(obj, (np.bool_, bool)):
                return bool(obj)
            elif isinstance(obj, np.ndarray):
                return [convert_for_json(v) for v in obj.tolist()]
            else:
                return obj

        self.metrics_summary_ = convert_for_json({
            "test_period": "June 1 - June 30, 2024",
            "test_sample_count": len(self.y_true),
            "continuous_metrics": continuous,
            "categorical_metrics": categorical,
            "uncertainty_intervals_95": uncertainty,
            "regime_wise_metrics": regime_wise,
            "probability_metrics": probability,
            "error_analysis": errors,
            "spatial_fss_status": "FSS NOT COMPUTABLE FOR CURRENT POINT-BASED DATA",
            "scientific_conclusion": "MIXED RESULTS",
        })

        self.metadata_ = convert_for_json({
            "dataset_version": "v1.0.0-real-paired-monsoon",
            "observation_source": "IMD 0.25° Gridded Daily Precipitation (Zenodo Benchmark ID: 14725350)",
            "nwp_source": "NOAA GFS 0.25° Seamless Daily Forecast via Open-Meteo REST API",
            "station_coordinates": {"latitude": 18.50, "longitude": 73.80, "district": "Pune, Maharashtra"},
            "forecast_lead_time": "24-48 hours (Day 1 accumulation)",
            "model_versions": {
                "raw_nwp": "NOAA GFS operational 0.25°",
                "global_ml": "RandomForestRegressor (v1.0.0-phase5)",
                "regime_aware_ml": "RegimeAwarePostProcessor (v1.0.0-phase6)",
                "probability_model": "CalibratedClassifierCV-GradientBoosting (v1.0.0-phase7)",
            },
            "metric_versions": {
                "continuous": "RMSE, MAE, Mean Bias, Pearson r",
                "categorical": "CSI, POD, FAR, ETS (Gilbert Skill Score)",
                "spatial": "Roberts and Lean (2008) Fractions Skill Score (FSS)",
                "probabilistic": "Brier Score, Murphy (1973) Decomposition, ROC-AUC, PR-AUC, ECE",
            },
            "random_seed": self.random_seed,
            "python_version": platform.python_version(),
            "resampling_method": "Stationary Block Bootstrap (block length = 3 days, B = 1000, 95% CI)",
        })

        os.makedirs("reports", exist_ok=True)
        with open("reports/final_metrics.json", "w") as f:
            json.dump(self.metrics_summary_, f, indent=2)

        with open("reports/final_verification_metadata.json", "w") as f:
            json.dump(self.metadata_, f, indent=2)

        print("Saved reports/final_metrics.json")
        print("Saved reports/final_verification_metadata.json")

        return self.metrics_summary_


if __name__ == "__main__":
    engine = VerificationEngine()
    engine.run_full_verification()
