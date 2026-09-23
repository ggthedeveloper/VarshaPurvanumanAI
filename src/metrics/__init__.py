"""
Meteorological Verification Metrics Package for SIH26080.
"""
from .continuous import rmse, mae, mean_bias, pearson_r
from .categorical import (
    compute_contingency_table,
    pod,
    far,
    csi,
    ets,
    evaluate_threshold_metrics
)
from .probabilistic import (
    brier_score,
    brier_score_decomposition,
    brier_skill_score,
    roc_auc_metric,
    pr_auc_metric,
    expected_calibration_error,
    maximum_calibration_error,
    compute_calibration_curve,
    evaluate_probability_forecast,
)
from .spatial import fractions_skill_score_1d, fractions_skill_score_2d
from .evaluator import ForecastEvaluator

__all__ = [
    "rmse",
    "mae",
    "mean_bias",
    "pearson_r",
    "compute_contingency_table",
    "pod",
    "far",
    "csi",
    "ets",
    "evaluate_threshold_metrics",
    "brier_score",
    "brier_score_decomposition",
    "brier_skill_score",
    "roc_auc_metric",
    "pr_auc_metric",
    "expected_calibration_error",
    "maximum_calibration_error",
    "compute_calibration_curve",
    "evaluate_probability_forecast",
    "fractions_skill_score_1d",
    "fractions_skill_score_2d",
    "ForecastEvaluator",
]
