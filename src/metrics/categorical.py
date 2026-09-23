"""
Categorical Meteorological Contingency Table Metrics for SIH26080.
Implements Probability of Detection (POD), False Alarm Ratio (FAR),
Critical Success Index (CSI), and Equitable Threat Score (ETS / Gilbert Skill Score).
"""
from typing import Dict, Any, Union, Optional
import numpy as np
import pandas as pd


def compute_contingency_table(
    y_true: Union[np.ndarray, pd.Series],
    y_pred: Union[np.ndarray, pd.Series],
    threshold: float
) -> Dict[str, int]:
    """
    Computes 2x2 contingency table elements for a given precipitation threshold (mm/day).

    Parameters:
    -----------
    y_true : array-like
        Observed rainfall values.
    y_pred : array-like
        Forecasted rainfall values.
    threshold : float
        Rainfall threshold (e.g., 2.5 mm for rainy day, 15.6 mm for moderate, 64.5 mm for heavy).

    Returns:
    --------
    dict containing:
        'H': Hits (pred >= thr and true >= thr)
        'F': False Alarms (pred >= thr and true < thr)
        'M': Misses (pred < thr and true >= thr)
        'C': Correct Rejections (pred < thr and true < thr)
        'total': Total number of valid paired cases (N)
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)

    if len(y_t) != len(y_p):
        raise ValueError(f"Array length mismatch: {len(y_t)} vs {len(y_p)}")

    obs_event = y_t >= threshold
    pred_event = y_p >= threshold

    h = int(np.sum(obs_event & pred_event))
    f = int(np.sum((~obs_event) & pred_event))
    m = int(np.sum(obs_event & (~pred_event)))
    c = int(np.sum((~obs_event) & (~pred_event)))

    return {
        "H": h,
        "F": f,
        "M": m,
        "C": c,
        "total": len(y_t),
        "observed_events": int(np.sum(obs_event)),
        "forecast_events": int(np.sum(pred_event)),
    }


def pod(H: int, M: int) -> Optional[float]:
    """
    Probability of Detection (Hit Rate): H / (H + M).
    Range: [0, 1]. Perfect: 1.
    """
    denominator = H + M
    if denominator == 0:
        return None
    return float(H / denominator)


def far(H: int, F: int) -> Optional[float]:
    """
    False Alarm Ratio: F / (H + F).
    Range: [0, 1]. Perfect: 0.
    """
    denominator = H + F
    if denominator == 0:
        return None
    return float(F / denominator)


def csi(H: int, F: int, M: int) -> Optional[float]:
    """
    Critical Success Index (Threat Score): H / (H + F + M).
    Range: [0, 1]. Perfect: 1.
    """
    denominator = H + F + M
    if denominator == 0:
        return None
    return float(H / denominator)


def ets(H: int, F: int, M: int, C: int, N: int) -> Optional[float]:
    """
    Equitable Threat Score (Gilbert Skill Score): (H - H_exp) / (H + F + M - H_exp).
    Hits by chance: H_exp = (H + M) * (H + F) / N.
    Range: [-1/3, 1]. Perfect: 1. Value <= 0 indicates no skill over random chance.
    """
    if N == 0:
        return None
    h_exp = ((H + M) * (H + F)) / float(N)
    denominator = H + F + M - h_exp
    if denominator == 0:
        return None
    score = (H - h_exp) / denominator
    return float(score)


def evaluate_threshold_metrics(
    y_true: Union[np.ndarray, pd.Series],
    y_pred: Union[np.ndarray, pd.Series],
    threshold: float
) -> Dict[str, Any]:
    """
    Computes complete categorical verification metrics for a specified rainfall threshold.
    """
    table = compute_contingency_table(y_true, y_pred, threshold)
    h, f, m, c, n = table["H"], table["F"], table["M"], table["C"], table["total"]

    return {
        "threshold_mm": threshold,
        "contingency_table": table,
        "POD": pod(h, m),
        "FAR": far(h, f),
        "CSI": csi(h, f, m),
        "ETS": ets(h, f, m, c, n),
        "sufficient_events": (table["observed_events"] > 0)
    }
