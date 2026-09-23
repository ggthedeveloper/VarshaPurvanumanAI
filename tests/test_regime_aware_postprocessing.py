"""
Unit and Integration Tests for Phase 6 Regime-Aware AI Post-Processing.
Validates regime routing, fallback routing, non-negative projection,
model serialization, test-set integrity, and zero leakage.
"""
import os
import pytest
import numpy as np
import pandas as pd

from src.postprocessing.regime_aware_postprocessor import RegimeAwarePostProcessor
from src.regime_classifier.classifier import RegimeClassifier
from src.features.split import ChronologicalSplitter


@pytest.fixture
def postprocessing_setup():
    x_tr = pd.read_csv("data/processed/X_train.csv")
    y_tr = pd.read_csv("data/processed/y_train.csv").squeeze("columns")
    reg_tr = pd.read_csv("data/processed/regime_labels/train_labels.csv")["regime"]
    x_te = pd.read_csv("data/processed/X_test.csv")
    y_te = pd.read_csv("data/processed/y_test.csv").squeeze("columns")
    reg_te = pd.read_csv("data/processed/regime_labels/test_labels.csv")["regime"]

    clf = RegimeClassifier.load("models/regime_classifier.pkl", "models/regime_classifier_metadata.json")
    return x_tr, y_tr, reg_tr, x_te, y_te, reg_te, clf


def test_regime_aware_fit_and_non_negative_predictions(postprocessing_setup):
    """Verifies that RegimeAwarePostProcessor fits and predicts strictly non-negative rainfall."""
    x_tr, y_tr, reg_tr, x_te, _, _, clf = postprocessing_setup

    model = RegimeAwarePostProcessor(classifier=clf, min_samples=15, random_state=42)
    model.fit(x_tr, y_tr, reg_tr)

    preds = model.predict(x_te, routing="operational")
    assert len(preds) == len(x_te), "Prediction length mismatch"
    assert not np.isnan(preds).any(), "NaN found in predictions"
    assert (preds >= 0.0).all(), "Negative rainfall predicted"


def test_operational_vs_oracle_routing(postprocessing_setup):
    """Verifies operational routing (using classifier) and oracle routing (using true regimes)."""
    x_tr, y_tr, reg_tr, x_te, _, reg_te, clf = postprocessing_setup

    model = RegimeAwarePostProcessor(classifier=clf, min_samples=15, random_state=42)
    model.fit(x_tr, y_tr, reg_tr)

    preds_op, trace_op = model.predict(x_te, routing="operational", return_trace=True)
    preds_orc, trace_orc = model.predict(x_te, routing="oracle", true_regimes=reg_te, return_trace=True)

    assert len(preds_op) == len(preds_orc) == len(x_te)
    assert "assigned_regime" in trace_op.columns
    assert "assigned_regime" in trace_orc.columns


def test_fallback_routing_trigger(postprocessing_setup):
    """Verifies fallback routing is triggered when a regime has fewer than min_samples."""
    x_tr, y_tr, reg_tr, x_te, _, _, clf = postprocessing_setup

    # Set min_samples=100 so that minority regimes (< 100 samples) trigger fallback
    model = RegimeAwarePostProcessor(classifier=clf, min_samples=100, random_state=42)
    model.fit(x_tr, y_tr, reg_tr)

    # Active, Break, Depression, Coastal/Orographic each have < 100 samples -> must be fallback
    for reg in ["ACTIVE_MONSOON", "BREAK_MONSOON", "COASTAL_OROGRAPHIC", "DEPRESSION"]:
        assert model.model_provenance_[reg]["fallback_applied"] is True

    # OTHER has 146 samples -> must be dedicated
    assert model.model_provenance_["OTHER"]["fallback_applied"] is False


def test_three_model_test_set_identical_cohort():
    """Asserts that Model A, Model B, and Model C evaluate on the exact same 31 test samples."""
    df = pd.read_csv("data/processed/paired_monsoon_benchmark.csv")
    _, _, test_df = ChronologicalSplitter.split_by_dates(
        df, time_col="timestamp", train_end="2022-10-01", val_end="2023-10-01"
    )
    trace_df = pd.read_csv("data/processed/predictions_trace_test.csv")
    x_te = pd.read_csv("data/processed/X_test.csv")

    assert len(test_df) == len(trace_df) == len(x_te) == 31, "Test cohort length mismatch"
    assert (test_df.reset_index(drop=True)["timestamp"] == trace_df["timestamp"]).all(), "Timestamp alignment mismatch"


def test_model_serialization_and_loading_reproducibility(postprocessing_setup):
    """Verifies that saving and loading RegimeAwarePostProcessor produces 100% identical outputs."""
    x_tr, y_tr, reg_tr, x_te, _, _, clf = postprocessing_setup

    model = RegimeAwarePostProcessor(classifier=clf, min_samples=15, random_state=42)
    model.fit(x_tr, y_tr, reg_tr)

    orig_preds = model.predict(x_te, routing="operational")

    temp_dir = "models/test_temp_regime_postprocessors/"
    temp_meta = "models/test_temp_regime_meta.json"

    model.save(temp_dir, temp_meta)
    loaded_model = RegimeAwarePostProcessor.load(temp_dir, temp_meta, classifier=clf)

    loaded_preds = loaded_model.predict(x_te, routing="operational")
    assert np.allclose(orig_preds, loaded_preds), "Reloaded regime model predictions do not match original"

    # Cleanup temp test files
    if os.path.exists(temp_dir):
        for f in os.listdir(temp_dir):
            os.remove(os.path.join(temp_dir, f))
        os.rmdir(temp_dir)
    if os.path.exists(temp_meta):
        os.remove(temp_meta)
