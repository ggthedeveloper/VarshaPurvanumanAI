"""
Comprehensive Meteorological Forecast Evaluator for SIH26080.
Orchestrates continuous, categorical, spatial, and regime-stratified evaluation.
"""
from typing import Dict, Any, List, Optional, Union
import numpy as np
import pandas as pd

from .continuous import rmse, mae, mean_bias, pearson_r
from .categorical import evaluate_threshold_metrics
from .spatial import fractions_skill_score_1d


class ForecastEvaluator:
    """Computes standard MoES and WMO forecast verification scores."""

    DEFAULT_THRESHOLDS = [2.5, 15.6, 64.5]  # IMD Rainy Day (2.5mm), Moderate (15.6mm), Heavy (64.5mm)

    @classmethod
    def evaluate(
        cls,
        y_true: Union[np.ndarray, pd.Series],
        y_pred: Union[np.ndarray, pd.Series],
        thresholds: Optional[List[float]] = None,
        regimes: Optional[Union[np.ndarray, pd.Series]] = None
    ) -> Dict[str, Any]:
        """
        Evaluates predictions against ground truth observations.

        Parameters:
        -----------
        y_true : array-like
            Ground truth observed rainfall (mm/day).
        y_pred : array-like
            Forecasted/corrected rainfall (mm/day).
        thresholds : list of float, optional
            Precipitation thresholds for categorical evaluation.
        regimes : array-like, optional
            Regime labels for stratified performance analysis.
        """
        y_t = np.asarray(y_true, dtype=float)
        # Enforce physical non-negative constraint
        y_p = np.maximum(0.0, np.asarray(y_pred, dtype=float))

        if len(y_t) != len(y_p):
            raise ValueError(f"Length mismatch: {len(y_t)} observations vs {len(y_p)} predictions.")

        thresh_list = thresholds or cls.DEFAULT_THRESHOLDS

        # 1. Continuous Metrics
        cont_metrics = {
            "rmse": rmse(y_t, y_p),
            "mae": mae(y_t, y_p),
            "mean_bias": mean_bias(y_t, y_p),
            "pearson_r": pearson_r(y_t, y_p),
            "sample_count": len(y_t),
            "mean_observed": float(np.mean(y_t)),
            "mean_forecast": float(np.mean(y_p)),
        }

        # 2. Categorical & FSS Metrics across thresholds
        cat_metrics = {}
        for thr in thresh_list:
            thr_key = f"thresh_{thr}mm"
            eval_thr = evaluate_threshold_metrics(y_t, y_p, thr)
            eval_thr["FSS"] = fractions_skill_score_1d(y_t, y_p, thr)
            cat_metrics[thr_key] = eval_thr

        # 3. Regime-Stratified Analysis (if regimes provided)
        regime_breakdown = {}
        if regimes is not None:
            reg_series = pd.Series(regimes).values
            unique_regs = sorted(list(set(reg_series)))
            for reg in unique_regs:
                mask = (reg_series == reg)
                n_samples = int(np.sum(mask))
                if n_samples == 0:
                    continue
                y_t_reg = y_t[mask]
                y_p_reg = y_p[mask]

                reg_res = {
                    "sample_count": n_samples,
                    "mean_observed": float(np.mean(y_t_reg)),
                    "mean_forecast": float(np.mean(y_p_reg)),
                    "rmse": rmse(y_t_reg, y_p_reg),
                    "mae": mae(y_t_reg, y_p_reg),
                    "mean_bias": mean_bias(y_t_reg, y_p_reg),
                    "pearson_r": pearson_r(y_t_reg, y_p_reg),
                }
                regime_breakdown[reg] = reg_res

        return {
            "continuous": cont_metrics,
            "categorical": cat_metrics,
            "regime_breakdown": regime_breakdown,
        }
