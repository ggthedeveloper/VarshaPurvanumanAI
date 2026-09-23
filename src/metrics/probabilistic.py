"""
Probabilistic Meteorological Verification Metrics for SIH26080.
Implements Brier Score, Brier Score Decomposition (Murphy 1973),
Brier Skill Score, ROC-AUC, PR-AUC, Expected Calibration Error (ECE),
Maximum Calibration Error (MCE), and calibration curve data.
"""
from typing import Dict, Any, Union, Optional, Tuple, List
import numpy as np
import pandas as pd
from sklearn.metrics import (
    brier_score_loss,
    roc_auc_score,
    average_precision_score,
    precision_score,
    recall_score,
    f1_score,
)
from src.metrics.categorical import (
    compute_contingency_table,
    pod,
    far,
    csi,
    ets,
)


def brier_score(
    y_true: Union[np.ndarray, pd.Series],
    y_prob: Union[np.ndarray, pd.Series]
) -> float:
    """
    Computes the standard Brier Score: (1/N) * sum((p_i - y_i)^2).
    Range: [0, 1]. Perfect: 0.0.
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_prob, dtype=float)
    if len(y_t) != len(y_p):
        raise ValueError(f"Length mismatch: y_true ({len(y_t)}) vs y_prob ({len(y_p)})")
    if len(y_t) == 0:
        return 0.0
    return float(np.mean((y_p - y_t) ** 2))


def brier_score_decomposition(
    y_true: Union[np.ndarray, pd.Series],
    y_prob: Union[np.ndarray, pd.Series],
    n_bins: int = 10
) -> Dict[str, Optional[float]]:
    """
    Decomposes Brier Score into Reliability, Resolution, and Uncertainty components
    following Murphy (1973): BS = REL - RES + UNC.

    Parameters:
    -----------
    y_true : array-like (binary 0 or 1)
    y_prob : array-like (probabilities in [0, 1])
    n_bins : int, number of calibration bins (default: 10)

    Returns:
    --------
    dict with 'reliability', 'resolution', 'uncertainty', 'brier_score', and 'identity_error'
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_prob, dtype=float)
    n = len(y_t)
    if n == 0:
        return {
            "reliability": None,
            "resolution": None,
            "uncertainty": None,
            "brier_score": None,
            "identity_error": None
        }

    # Base rate / climatological sample mean
    o_bar = float(np.mean(y_t))
    uncertainty = float(o_bar * (1.0 - o_bar))

    # Form bins: [0, 0.1), [0.1, 0.2), ..., [0.9, 1.0]
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    bin_indices = np.digitize(y_p, bins) - 1
    # Adjust edge case where y_p == 1.0
    bin_indices = np.clip(bin_indices, 0, n_bins - 1)

    rel_sum = 0.0
    res_sum = 0.0
    var_within_sum = 0.0

    for k in range(n_bins):
        in_bin = (bin_indices == k)
        n_k = int(np.sum(in_bin))
        if n_k > 0:
            p_k_bar = float(np.mean(y_p[in_bin]))
            o_k_bar = float(np.mean(y_t[in_bin]))
            rel_sum += n_k * ((p_k_bar - o_k_bar) ** 2)
            res_sum += n_k * ((o_k_bar - o_bar) ** 2)
            var_within_sum += float(np.sum((y_p[in_bin] - p_k_bar) ** 2))

    reliability = float(rel_sum / n)
    resolution = float(res_sum / n)
    within_bin_variance = float(var_within_sum / n)
    bs = float(np.mean((y_p - y_t) ** 2))
    identity_diff = abs(bs - (reliability - resolution + uncertainty + within_bin_variance))

    return {
        "reliability": reliability,
        "resolution": resolution,
        "uncertainty": uncertainty,
        "within_bin_variance": within_bin_variance,
        "brier_score": bs,
        "identity_error": float(identity_diff)
    }


def brier_skill_score(
    y_true: Union[np.ndarray, pd.Series],
    y_prob: Union[np.ndarray, pd.Series],
    ref_prob: Optional[Union[float, np.ndarray]] = None
) -> Optional[float]:
    """
    Computes Brier Skill Score: BSS = 1 - (BS / BS_ref).
    By default, BS_ref is the climatological sample uncertainty o_bar * (1 - o_bar).
    Range: (-inf, 1]. Perfect: 1.0. Zero: no skill over climatology. Negative: worse than climatology.
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_prob, dtype=float)
    bs = brier_score(y_t, y_p)

    if ref_prob is None:
        o_bar = np.mean(y_t)
        bs_ref = float(o_bar * (1.0 - o_bar))
    elif isinstance(ref_prob, (int, float)):
        bs_ref = float(np.mean((ref_prob - y_t) ** 2))
    else:
        bs_ref = float(np.mean((np.asarray(ref_prob, dtype=float) - y_t) ** 2))

    if bs_ref <= 1e-12:
        # If all samples belong to single class, climatology error is 0, BSS undefined
        return None

    return float(1.0 - (bs / bs_ref))


def roc_auc_metric(
    y_true: Union[np.ndarray, pd.Series],
    y_prob: Union[np.ndarray, pd.Series]
) -> Optional[float]:
    """
    Calculates ROC-AUC score. Returns None if test set contains only one class.
    """
    y_t = np.asarray(y_true, dtype=int)
    y_p = np.asarray(y_prob, dtype=float)
    if len(np.unique(y_t)) < 2:
        return None
    try:
        return float(roc_auc_score(y_t, y_p))
    except Exception:
        return None


def pr_auc_metric(
    y_true: Union[np.ndarray, pd.Series],
    y_prob: Union[np.ndarray, pd.Series]
) -> Optional[float]:
    """
    Calculates Precision-Recall AUC (Average Precision).
    Returns None if test set contains only one class.
    """
    y_t = np.asarray(y_true, dtype=int)
    y_p = np.asarray(y_prob, dtype=float)
    if len(np.unique(y_t)) < 2:
        return None
    try:
        return float(average_precision_score(y_t, y_p))
    except Exception:
        return None


def expected_calibration_error(
    y_true: Union[np.ndarray, pd.Series],
    y_prob: Union[np.ndarray, pd.Series],
    n_bins: int = 10
) -> float:
    """
    Expected Calibration Error (ECE): weighted average gap between bin confidence and bin accuracy.
    ECE = sum_{k=1}^K (n_k / N) * |o_k_bar - p_k_bar|.
    Range: [0, 1]. Perfect: 0.0.
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_prob, dtype=float)
    n = len(y_t)
    if n == 0:
        return 0.0

    bins = np.linspace(0.0, 1.0, n_bins + 1)
    bin_indices = np.digitize(y_p, bins) - 1
    bin_indices = np.clip(bin_indices, 0, n_bins - 1)

    ece = 0.0
    for k in range(n_bins):
        in_bin = (bin_indices == k)
        n_k = int(np.sum(in_bin))
        if n_k > 0:
            p_k_bar = float(np.mean(y_p[in_bin]))
            o_k_bar = float(np.mean(y_t[in_bin]))
            ece += (n_k / n) * abs(o_k_bar - p_k_bar)

    return float(ece)


def maximum_calibration_error(
    y_true: Union[np.ndarray, pd.Series],
    y_prob: Union[np.ndarray, pd.Series],
    n_bins: int = 10
) -> float:
    """
    Maximum Calibration Error (MCE): maximum absolute difference between bin confidence and bin accuracy.
    MCE = max_k |o_k_bar - p_k_bar| for non-empty bins.
    Range: [0, 1]. Perfect: 0.0.
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_prob, dtype=float)
    n = len(y_t)
    if n == 0:
        return 0.0

    bins = np.linspace(0.0, 1.0, n_bins + 1)
    bin_indices = np.digitize(y_p, bins) - 1
    bin_indices = np.clip(bin_indices, 0, n_bins - 1)

    mce = 0.0
    for k in range(n_bins):
        in_bin = (bin_indices == k)
        n_k = int(np.sum(in_bin))
        if n_k > 0:
            p_k_bar = float(np.mean(y_p[in_bin]))
            o_k_bar = float(np.mean(y_t[in_bin]))
            gap = abs(o_k_bar - p_k_bar)
            if gap > mce:
                mce = gap

    return float(mce)


def compute_calibration_curve(
    y_true: Union[np.ndarray, pd.Series],
    y_prob: Union[np.ndarray, pd.Series],
    n_bins: int = 10
) -> Dict[str, List[float]]:
    """
    Computes empirical calibration bins: fraction of positives vs mean predicted value.
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_prob, dtype=float)
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    bin_indices = np.digitize(y_p, bins) - 1
    bin_indices = np.clip(bin_indices, 0, n_bins - 1)

    prob_pred = []
    prob_true = []
    bin_counts = []
    bin_centers = []

    for k in range(n_bins):
        center = float((bins[k] + bins[k + 1]) / 2.0)
        bin_centers.append(center)
        in_bin = (bin_indices == k)
        n_k = int(np.sum(in_bin))
        bin_counts.append(n_k)
        if n_k > 0:
            prob_pred.append(float(np.mean(y_p[in_bin])))
            prob_true.append(float(np.mean(y_t[in_bin])))
        else:
            prob_pred.append(center)
            prob_true.append(0.0)

    return {
        "bin_centers": bin_centers,
        "prob_pred": prob_pred,
        "prob_true": prob_true,
        "bin_counts": bin_counts
    }


def evaluate_probability_forecast(
    y_true: Union[np.ndarray, pd.Series],
    y_prob: Union[np.ndarray, pd.Series],
    decision_threshold: float = 0.5,
    threshold_mm: float = 2.5
) -> Dict[str, Any]:
    """
    Comprehensive verification of probabilistic rainfall forecast at specified exceedance threshold.

    Parameters:
    -----------
    y_true : binary target (0 or 1) indicating whether rainfall exceeded threshold_mm
    y_prob : forecast probability of exceedance [0, 1]
    decision_threshold : float, operational probability cutoff to trigger warning (e.g. 0.5)
    threshold_mm : float, physical rainfall threshold in mm (e.g. 2.5, 15.6, 64.5)
    """
    y_t = np.asarray(y_true, dtype=int)
    y_p = np.asarray(y_prob, dtype=float)
    n = len(y_t)
    n_pos = int(np.sum(y_t == 1))
    n_neg = int(np.sum(y_t == 0))

    bs = brier_score(y_t, y_p)
    decomp = brier_score_decomposition(y_t, y_p)
    bss = brier_skill_score(y_t, y_p)
    roc_auc = roc_auc_metric(y_t, y_p)
    pr_auc = pr_auc_metric(y_t, y_p)
    ece = expected_calibration_error(y_t, y_p)
    mce = maximum_calibration_error(y_t, y_p)

    # Contingency evaluation at decision threshold
    y_pred_binary = (y_p >= decision_threshold).astype(int)
    table = compute_contingency_table(y_t, y_pred_binary, threshold=0.5)
    h, f, m, c = table["H"], table["F"], table["M"], table["C"]

    # Precision, Recall, F1
    has_pos_pred = (h + f) > 0
    precision_val = float(h / (h + f)) if has_pos_pred else 0.0
    recall_val = pod(h, m) or 0.0
    f1_val = (
        float(2 * precision_val * recall_val / (precision_val + recall_val))
        if (precision_val + recall_val) > 0
        else 0.0
    )

    return {
        "threshold_mm": threshold_mm,
        "decision_threshold": decision_threshold,
        "sample_count": n,
        "positive_count": n_pos,
        "negative_count": n_neg,
        "base_rate": float(n_pos / n) if n > 0 else 0.0,
        "brier_score": bs,
        "reliability": decomp["reliability"],
        "resolution": decomp["resolution"],
        "uncertainty": decomp["uncertainty"],
        "brier_skill_score": bss,
        "roc_auc": roc_auc if roc_auc is not None else "INSUFFICIENT CLASS VARIATION",
        "pr_auc": pr_auc if pr_auc is not None else "INSUFFICIENT CLASS VARIATION",
        "expected_calibration_error": ece,
        "maximum_calibration_error": mce,
        "POD": pod(h, m),
        "FAR": far(h, f),
        "CSI": csi(h, f, m),
        "ETS": ets(h, f, m, c, n),
        "precision": precision_val,
        "recall": recall_val,
        "f1": f1_val,
        "contingency_table": table,
        "fss": "FSS NOT COMPUTABLE FOR CURRENT POINT-BASED PROBABILITY DATA",
    }
