"""
Spatial & Neighborhood Verification Metrics for SIH26080.
Implements Fractions Skill Score (FSS) based on Roberts & Lean (2008).
Supports both 1D temporal/station neighborhoods and 2D spatial gridded fields.
"""
from typing import Union, Optional
import numpy as np
import pandas as pd


def fractions_skill_score_1d(
    y_true: Union[np.ndarray, pd.Series],
    y_pred: Union[np.ndarray, pd.Series],
    threshold: float,
    window_size: int = 3
) -> Optional[float]:
    """
    Computes Fractions Skill Score over a 1D sequence or time series neighborhood.

    Parameters:
    -----------
    y_true : array-like
        Observed values.
    y_pred : array-like
        Forecasted values.
    threshold : float
        Event binary threshold (mm/day).
    window_size : int
        Size of the centered moving window.

    Returns:
    --------
    float: FSS value in [0, 1]. Perfect score = 1.0.
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)

    if len(y_t) != len(y_p):
        raise ValueError(f"Array length mismatch: {len(y_t)} vs {len(y_p)}")
    if len(y_t) == 0:
        return None

    obs_binary = (y_t >= threshold).astype(float)
    pred_binary = (y_p >= threshold).astype(float)

    # Compute rolling fractions
    p_obs = pd.Series(obs_binary).rolling(window=window_size, min_periods=1, center=True).mean().values
    p_pred = pd.Series(pred_binary).rolling(window=window_size, min_periods=1, center=True).mean().values

    fbs = np.mean((p_pred - p_obs) ** 2)
    fbs_worst = np.mean(p_pred ** 2 + p_obs ** 2)

    if fbs_worst == 0.0:
        # Both observed and predicted fields contain zero events across the period
        return 1.0

    fss = 1.0 - (fbs / fbs_worst)
    return float(np.clip(fss, 0.0, 1.0))


def fractions_skill_score_2d(
    grid_true: np.ndarray,
    grid_pred: np.ndarray,
    threshold: float,
    window_size: int = 3
) -> Optional[float]:
    """
    Computes standard 2D Fractions Skill Score over a spatial grid (Roberts & Lean 2008).

    Parameters:
    -----------
    grid_true : 2D np.ndarray (lat x lon)
        Observed gridded precipitation.
    grid_pred : 2D np.ndarray (lat x lon)
        Forecasted gridded precipitation.
    threshold : float
        Event binary threshold (mm/day).
    window_size : int
        Odd integer square window dimension.
    """
    if grid_true.shape != grid_pred.shape:
        raise ValueError(f"Grid shape mismatch: {grid_true.shape} vs {grid_pred.shape}")
    if grid_true.ndim != 2:
        raise ValueError(f"Expected 2D grids, got shape {grid_true.shape}")

    obs_binary = (grid_true >= threshold).astype(float)
    pred_binary = (grid_pred >= threshold).astype(float)

    from scipy.ndimage import uniform_filter
    p_obs = uniform_filter(obs_binary, size=window_size, mode="constant", cval=0.0)
    p_pred = uniform_filter(pred_binary, size=window_size, mode="constant", cval=0.0)

    fbs = np.mean((p_pred - p_obs) ** 2)
    fbs_worst = np.mean(p_pred ** 2 + p_obs ** 2)

    if fbs_worst == 0.0:
        return 1.0

    fss = 1.0 - (fbs / fbs_worst)
    return float(np.clip(fss, 0.0, 1.0))
