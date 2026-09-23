"""
Continuous Meteorological Forecast Verification Metrics for SIH26080.
Implements Root Mean Square Error (RMSE), Mean Absolute Error (MAE),
Mean Bias, and Pearson Correlation Coefficient.
"""
from typing import Union
import numpy as np
import pandas as pd


def rmse(y_true: Union[np.ndarray, pd.Series], y_pred: Union[np.ndarray, pd.Series]) -> float:
    """Computes Root Mean Square Error (mm/day)."""
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)
    if len(y_t) == 0 or len(y_p) == 0:
        raise ValueError("Input arrays cannot be empty.")
    if len(y_t) != len(y_p):
        raise ValueError(f"Array length mismatch: {len(y_t)} vs {len(y_p)}")
    return float(np.sqrt(np.mean((y_p - y_t) ** 2)))


def mae(y_true: Union[np.ndarray, pd.Series], y_pred: Union[np.ndarray, pd.Series]) -> float:
    """Computes Mean Absolute Error (mm/day)."""
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)
    if len(y_t) == 0 or len(y_p) == 0:
        raise ValueError("Input arrays cannot be empty.")
    if len(y_t) != len(y_p):
        raise ValueError(f"Array length mismatch: {len(y_t)} vs {len(y_p)}")
    return float(np.mean(np.abs(y_p - y_t)))


def mean_bias(y_true: Union[np.ndarray, pd.Series], y_pred: Union[np.ndarray, pd.Series]) -> float:
    """Computes Mean Forecast Bias (mm/day): mean(y_pred - y_true). Positive = wet bias."""
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)
    if len(y_t) == 0 or len(y_p) == 0:
        raise ValueError("Input arrays cannot be empty.")
    if len(y_t) != len(y_p):
        raise ValueError(f"Array length mismatch: {len(y_t)} vs {len(y_p)}")
    return float(np.mean(y_p - y_t))


def pearson_r(y_true: Union[np.ndarray, pd.Series], y_pred: Union[np.ndarray, pd.Series]) -> float:
    """Computes Pearson Linear Correlation Coefficient."""
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)
    if len(y_t) == 0 or len(y_p) == 0:
        raise ValueError("Input arrays cannot be empty.")
    std_t = np.std(y_t)
    std_p = np.std(y_p)
    if std_t == 0.0 or std_p == 0.0:
        return 0.0
    corr = np.corrcoef(y_t, y_p)[0, 1]
    return float(corr) if not np.isnan(corr) else 0.0
