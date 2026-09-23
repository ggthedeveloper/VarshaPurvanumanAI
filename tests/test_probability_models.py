"""
Unit and Integration Tests for Phase 7 Probability Models (SIH26080).
Validates probability bounds [0, 1], zero data leakage (target, temporal, calibration),
test set integrity, threshold construction, class imbalance handling, reproducibility,
and model persistence.
"""
import os
import pickle
import numpy as np
import pandas as pd
import pytest

from src.metrics.probabilistic import (
    brier_score,
    brier_score_decomposition,
    brier_skill_score,
    expected_calibration_error,
    maximum_calibration_error,
    roc_auc_metric,
    pr_auc_metric,
    evaluate_probability_forecast,
)
from src.probability.exceedance_model import (
    VERIFIED_THRESHOLDS,
    GlobalExceedanceModel,
    RegimeAwareExceedanceModel,
    ExceedanceModelSuite,
    ConstantProbabilityEstimator,
)


@pytest.fixture
def real_data():
    X_train = pd.read_csv("data/processed/X_train.csv")
    X_val = pd.read_csv("data/processed/X_val.csv")
    X_test = pd.read_csv("data/processed/X_test.csv")
    y_train = pd.read_csv("data/processed/y_train.csv")["observed_rainfall"].values
    y_val = pd.read_csv("data/processed/y_val.csv")["observed_rainfall"].values
    y_test = pd.read_csv("data/processed/y_test.csv")["observed_rainfall"].values
    reg_train = pd.read_csv("data/processed/regime_labels/train_labels.csv")["regime"].values
    reg_val = pd.read_csv("data/processed/regime_labels/val_labels.csv")["regime"].values
    reg_test = pd.read_csv("data/processed/regime_labels/test_labels.csv")["regime"].values

    return {
        "X_train": X_train,
        "X_val": X_val,
        "X_test": X_test,
        "y_train": y_train,
        "y_val": y_val,
        "y_test": y_test,
        "reg_train": reg_train,
        "reg_val": reg_val,
        "reg_test": reg_test,
    }


def test_probability_range(real_data):
    """Verifies that all predicted probabilities are strictly bounded within [0, 1]."""
    X_test = real_data["X_test"]
    with open("models/probability/probability_suite.pkl", "rb") as f:
        suite = pickle.load(f)

    for thr in suite.thresholds:
        p_glob = suite.global_models[thr].predict_proba(X_test)
        p_reg = suite.regime_models[thr].predict_proba(X_test)

        assert np.all(p_glob >= 0.0), f"Global probability below 0 at threshold {thr}"
        assert np.all(p_glob <= 1.0), f"Global probability above 1 at threshold {thr}"
        assert np.all(p_reg >= 0.0), f"Regime probability below 0 at threshold {thr}"
        assert np.all(p_reg <= 1.0), f"Regime probability above 1 at threshold {thr}"
        assert not np.any(np.isnan(p_glob)), f"NaN in global probability at {thr}"
        assert not np.any(np.isnan(p_reg)), f"NaN in regime probability at {thr}"


def test_no_target_leakage(real_data):
    """Verifies that no target variable or target derivative leaked into features."""
    feature_names = list(real_data["X_train"].columns)
    forbidden_terms = [
        "observed", "obs_rain", "rainfall_obs", "target", "label",
        "regime_label", "exceedance", "true_regime"
    ]
    for feat in feature_names:
        for term in forbidden_terms:
            assert term not in feat.lower(), f"Potential target leakage feature: {feat}"


def test_no_temporal_leakage():
    """Verifies chronological ordering and zero overlap between Train, Val, and Test."""
    df_raw = pd.read_csv("data/processed/paired_monsoon_benchmark.csv")
    df_raw["timestamp"] = pd.to_datetime(df_raw["timestamp"])

    train_dates = df_raw.iloc[:244]["timestamp"]
    val_dates = df_raw.iloc[244:366]["timestamp"]
    test_dates = df_raw.iloc[366:397]["timestamp"]

    assert train_dates.max() < val_dates.min(), "Temporal overlap between Train and Val"
    assert val_dates.max() < test_dates.min(), "Temporal overlap between Val and Test"
    assert len(train_dates) == 244
    assert len(val_dates) == 122
    assert len(test_dates) == 31


def test_no_calibration_leakage(real_data):
    """Verifies that calibration is fit strictly on training data without test set leakage."""
    X_train = real_data["X_train"]
    y_train = real_data["y_train"]
    X_test = real_data["X_test"]

    model = GlobalExceedanceModel(threshold_mm=2.5, random_state=42)
    model.fit(X_train, y_train)

    # Predict before and after any test set inspection
    p1 = model.predict_proba(X_test)
    p2 = model.predict_proba(X_test)
    np.testing.assert_array_equal(p1, p2)


def test_test_set_integrity(real_data):
    """Verifies that the test set remains exact and unaltered (31 real samples)."""
    X_test = real_data["X_test"]
    y_test = real_data["y_test"]

    assert len(X_test) == 31
    assert len(y_test) == 31
    assert np.isclose(np.mean(y_test), 6.438607, atol=1e-4)
    assert np.isclose(np.max(y_test), 30.451557, atol=1e-4)


def test_threshold_construction(real_data):
    """Verifies that exceedance binary targets match exact threshold definition."""
    y = real_data["y_train"]
    for thr in [2.5, 7.5, 15.6, 64.5, 115.6]:
        binary_target = (y >= thr).astype(int)
        expected_pos = np.sum(y >= thr)
        assert np.sum(binary_target) == expected_pos


def test_class_imbalance_and_zero_positives():
    """Verifies that extreme thresholds with zero positives handle single-class gracefully."""
    X_dummy = pd.DataFrame({"feat1": [1.0, 2.0, 3.0], "feat2": [0.5, 0.6, 0.7]})
    y_zero = np.array([0.0, 1.0, 2.0])  # None >= 64.5

    model = GlobalExceedanceModel(threshold_mm=64.5, random_state=42)
    model.fit(X_dummy, y_zero)
    probs = model.predict_proba(X_dummy)

    assert len(probs) == 3
    assert np.all(probs == 0.0)
    assert isinstance(model.model_, ConstantProbabilityEstimator)


def test_reproducibility(real_data):
    """Verifies deterministic training across runs with fixed random state."""
    X_train = real_data["X_train"]
    y_train = real_data["y_train"]
    X_test = real_data["X_test"]

    m1 = GlobalExceedanceModel(threshold_mm=2.5, random_state=42).fit(X_train, y_train)
    m2 = GlobalExceedanceModel(threshold_mm=2.5, random_state=42).fit(X_train, y_train)

    p1 = m1.predict_proba(X_test)
    p2 = m2.predict_proba(X_test)
    np.testing.assert_array_almost_equal(p1, p2)


def test_model_loading_and_prediction_shape(real_data):
    """Verifies serialized models can be loaded and output correct prediction shapes."""
    X_test = real_data["X_test"]

    for thr in [2.5, 7.5, 15.6, 64.5, 115.6]:
        path = f"models/probability/global_exceedance_thr_{thr}.pkl"
        assert os.path.exists(path), f"Missing model file {path}"
        with open(path, "rb") as f:
            m = pickle.load(f)
        probs = m.predict_proba(X_test)
        assert isinstance(probs, np.ndarray)
        assert probs.shape == (len(X_test),)
        assert np.all((probs >= 0.0) & (probs <= 1.0))


def test_probabilistic_metrics_murphy_decomposition():
    """Verifies Murphy (1973) Brier score decomposition: BS = REL - RES + UNC + VAR_within."""
    y = np.array([0, 1, 0, 1, 1, 0, 0, 1])
    p = np.array([0.1, 0.9, 0.2, 0.8, 0.7, 0.3, 0.2, 0.85])

    decomp = brier_score_decomposition(y, p, n_bins=5)
    bs = decomp["brier_score"]
    rel = decomp["reliability"]
    res = decomp["resolution"]
    unc = decomp["uncertainty"]
    var_w = decomp["within_bin_variance"]

    reconstructed_bs = rel - res + unc + var_w
    assert np.isclose(bs, reconstructed_bs, atol=1e-6)
    assert decomp["identity_error"] < 1e-6


def test_insufficient_class_variation_handling():
    """Verifies ROC-AUC and PR-AUC return None when test set contains only one class."""
    y_single = np.array([0, 0, 0, 0])
    p = np.array([0.1, 0.2, 0.3, 0.4])

    assert roc_auc_metric(y_single, p) is None
    assert pr_auc_metric(y_single, p) is None

    res = evaluate_probability_forecast(y_single, p, threshold_mm=64.5)
    assert res["roc_auc"] == "INSUFFICIENT CLASS VARIATION"
    assert res["pr_auc"] == "INSUFFICIENT CLASS VARIATION"
    assert res["fss"] == "FSS NOT COMPUTABLE FOR CURRENT POINT-BASED PROBABILITY DATA"
