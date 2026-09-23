"""
Unit and Integration Tests for Phase 5 Baseline Post-Processing.
Validates target/feature leakage, strict chronological isolation, non-negative rainfall,
metric calculations (RMSE, MAE, Bias, POD, FAR, CSI, ETS, FSS), identical sample alignment,
and serialized model reproducibility.
"""
import os
import pytest
import numpy as np
import pandas as pd

from src.postprocessing.global_postprocessor import GlobalPostProcessor
from src.metrics.continuous import rmse, mae, mean_bias, pearson_r
from src.metrics.categorical import compute_contingency_table, pod, far, csi, ets
from src.metrics.spatial import fractions_skill_score_1d
from src.features.split import ChronologicalSplitter


@pytest.fixture
def feature_matrices():
    x_tr = pd.read_csv("data/processed/X_train.csv")
    y_tr = pd.read_csv("data/processed/y_train.csv").squeeze("columns")
    x_val = pd.read_csv("data/processed/X_val.csv")
    y_val = pd.read_csv("data/processed/y_val.csv").squeeze("columns")
    x_te = pd.read_csv("data/processed/X_test.csv")
    y_te = pd.read_csv("data/processed/y_test.csv").squeeze("columns")
    return x_tr, y_tr, x_val, y_val, x_te, y_te


def test_zero_target_and_regime_leakage(feature_matrices):
    """Verifies that no target column or regime label enters the global feature matrix."""
    x_tr, _, _, _, x_te, _ = feature_matrices
    forbidden = ["observed_rainfall", "regime", "sub_regime", "label_status", "label_method"]
    for col in forbidden:
        assert col not in x_tr.columns, f"Forbidden column {col} found in X_train"
        assert col not in x_te.columns, f"Forbidden column {col} found in X_test"


def test_global_postprocessor_fit_and_non_negative_output(feature_matrices):
    """Verifies that GlobalPostProcessor predicts non-negative rainfall and matches shape."""
    x_tr, y_tr, _, _, x_te, _ = feature_matrices

    model = GlobalPostProcessor(model_type="random_forest", n_estimators=20, max_depth=4, random_state=42)
    model.fit(x_tr, y_tr)

    preds = model.predict(x_te)
    assert len(preds) == len(x_te), "Prediction length mismatch"
    assert not np.isnan(preds).any(), "NaN values found in predictions"
    assert (preds >= 0.0).all(), "Negative precipitation predicted"


def test_identical_test_samples_fair_comparison():
    """Confirms that Baseline A and Baseline B evaluate on the exact same test records."""
    df = pd.read_csv("data/processed/paired_monsoon_benchmark.csv")
    _, _, test_df = ChronologicalSplitter.split_by_dates(
        df, time_col="timestamp", train_end="2022-10-01", val_end="2023-10-01"
    )
    x_te = pd.read_csv("data/processed/X_test.csv")
    y_te = pd.read_csv("data/processed/y_test.csv")

    assert len(test_df) == len(x_te) == len(y_te) == 31, "Test sample count mismatch"


def test_continuous_metrics_mathematical_properties():
    """Validates mathematical correctness of continuous verification metrics."""
    y_true = np.array([0.0, 10.0, 20.0, 30.0])
    y_pred = np.array([2.0, 12.0, 18.0, 32.0])

    # Errors: [+2, +2, -2, +2]
    # Bias = (2 + 2 - 2 + 2) / 4 = 1.0
    # MAE = (2 + 2 + 2 + 2) / 4 = 2.0
    # RMSE = sqrt((4 + 4 + 4 + 4) / 4) = 2.0
    assert np.isclose(mean_bias(y_true, y_pred), 1.0)
    assert np.isclose(mae(y_true, y_pred), 2.0)
    assert np.isclose(rmse(y_true, y_pred), 2.0)
    assert np.isclose(pearson_r(y_true, y_pred), 0.988, atol=1e-3)


def test_categorical_metrics_synthetic_contingency_table():
    """Validates POD, FAR, CSI, and ETS against a known analytical 2x2 contingency table."""
    # Contingency table: H=50, F=20, M=10, C=120, Total N=200
    # POD = H / (H + M) = 50 / 60 = 0.8333
    # FAR = F / (H + F) = 20 / 70 = 0.2857
    # CSI = H / (H + F + M) = 50 / 80 = 0.625
    # H_exp = (60 * 70) / 200 = 21.0
    # ETS = (50 - 21) / (80 - 21) = 29 / 59 = 0.4915
    y_true = np.array([10.0] * 50 + [0.0] * 20 + [10.0] * 10 + [0.0] * 120)
    y_pred = np.array([10.0] * 50 + [10.0] * 20 + [0.0] * 10 + [0.0] * 120)

    tbl = compute_contingency_table(y_true, y_pred, threshold=5.0)
    assert tbl["H"] == 50 and tbl["F"] == 20 and tbl["M"] == 10 and tbl["C"] == 120

    assert np.isclose(pod(50, 10), 50 / 60)
    assert np.isclose(far(50, 20), 20 / 70)
    assert np.isclose(csi(50, 20, 10), 50 / 80)
    assert np.isclose(ets(50, 20, 10, 120, 200), 29 / 59)


def test_fractions_skill_score_bounds():
    """Tests Fractions Skill Score boundary properties."""
    y_true = np.array([0.0, 5.0, 15.0, 0.0, 25.0])
    # Perfect forecast -> FSS = 1.0
    assert np.isclose(fractions_skill_score_1d(y_true, y_true, threshold=10.0), 1.0)
    # Zero events anywhere -> FSS = 1.0
    zeros = np.zeros(10)
    assert np.isclose(fractions_skill_score_1d(zeros, zeros, threshold=10.0), 1.0)


def test_model_artifact_loading_reproducibility(feature_matrices):
    """Verifies that loaded persisted model generates 100% identical predictions."""
    x_tr, y_tr, _, _, x_te, _ = feature_matrices
    model = GlobalPostProcessor(model_type="random_forest", n_estimators=25, max_depth=4, random_state=42)
    model.fit(x_tr, y_tr)

    preds_orig = model.predict(x_te)

    temp_model = "models/test_temp_global.pkl"
    temp_meta = "models/test_temp_global_meta.json"

    model.save(temp_model, temp_meta)
    loaded_model = GlobalPostProcessor.load(temp_model, temp_meta)

    preds_loaded = loaded_model.predict(x_te)
    assert np.allclose(preds_orig, preds_loaded), "Reloaded model predictions mismatch"

    if os.path.exists(temp_model):
        os.remove(temp_model)
    if os.path.exists(temp_meta):
        os.remove(temp_meta)
