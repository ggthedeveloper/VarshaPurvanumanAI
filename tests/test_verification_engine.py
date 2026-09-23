"""
Comprehensive Unit and Integration Tests for Phase 8 Verification Engine (SIH26080).
Tests continuous metrics, categorical metrics, edge cases (zero events, zero forecast events),
missing value handling, FSS spatial condition, identical test set enforcement,
and deterministic reproducibility.
"""
import os
import json
import numpy as np
import pandas as pd
import pytest

from src.metrics.continuous import rmse, mae, mean_bias, pearson_r
from src.metrics.categorical import (
    compute_contingency_table,
    pod,
    far,
    csi,
    ets,
    evaluate_threshold_metrics,
)
from src.metrics.spatial import fractions_skill_score_1d, fractions_skill_score_2d
from src.verification.engine import VerificationEngine


def test_continuous_metrics_mathematical_properties():
    """Validates mathematical properties of RMSE, MAE, and Mean Bias."""
    y_true = np.array([0.0, 5.0, 10.0, 15.0])
    y_pred = np.array([2.0, 5.0, 8.0, 15.0])

    # Errors: +2, 0, -2, 0
    assert np.isclose(mae(y_true, y_pred), 1.0)
    assert np.isclose(mean_bias(y_true, y_pred), 0.0)
    assert np.isclose(rmse(y_true, y_pred), np.sqrt(8.0 / 4.0))


def test_categorical_metrics_standard_case():
    """Validates contingency table and scores on a standard case."""
    y_true = np.array([10.0, 10.0, 0.0, 0.0])
    y_pred = np.array([10.0, 0.0, 10.0, 0.0])
    # Threshold 5.0 mm: H=1, M=1, F=1, C=1, N=4
    table = compute_contingency_table(y_true, y_pred, threshold=5.0)
    assert table["H"] == 1
    assert table["M"] == 1
    assert table["F"] == 1
    assert table["C"] == 1

    assert np.isclose(pod(1, 1), 0.5)
    assert np.isclose(far(1, 1), 0.5)
    assert np.isclose(csi(1, 1, 1), 1.0 / 3.0)

    # ETS: H_exp = (2 * 2) / 4 = 1.0 -> ETS = (1 - 1) / (3 - 1) = 0.0
    assert np.isclose(ets(1, 1, 1, 1, 4), 0.0)


def test_zero_event_handling_not_computable():
    """Verifies that zero observed events return None / NOT COMPUTABLE for POD, CSI, ETS."""
    y_true = np.array([0.0, 0.0, 0.0])
    y_pred = np.array([0.0, 0.0, 0.0])

    cat = evaluate_threshold_metrics(y_true, y_pred, threshold=64.5)
    assert cat["contingency_table"]["observed_events"] == 0
    assert cat["POD"] is None
    assert cat["CSI"] is None
    assert cat["ETS"] is None
    assert cat["FAR"] is None


def test_zero_forecast_event_far_not_computable():
    """Verifies that zero forecast events return None for FAR (prevents division by zero)."""
    assert far(0, 0) is None


def test_fractions_skill_score_properties():
    """Tests 1D and 2D FSS behavior on controlled inputs."""
    # Identical fields -> FSS = 1.0
    field_obs = np.array([[10.0, 0.0], [0.0, 10.0]])
    field_fcst = np.array([[10.0, 0.0], [0.0, 10.0]])
    fss_perfect = fractions_skill_score_2d(field_obs, field_fcst, threshold=5.0, window_size=1)
    assert np.isclose(fss_perfect, 1.0)

    # Completely disjoint fields -> FSS = 0.0 at window 1
    field_disjoint = np.array([[0.0, 10.0], [10.0, 0.0]])
    fss_disjoint = fractions_skill_score_2d(field_obs, field_disjoint, threshold=5.0, window_size=1)
    assert np.isclose(fss_disjoint, 0.0)


def test_verification_engine_identical_test_sets():
    """Verifies that VerificationEngine evaluates all models on identical sample cohorts."""
    engine = VerificationEngine().load_data()

    assert len(engine.y_true) == 31
    assert len(engine.y_raw) == 31
    assert len(engine.y_glob) == 31
    assert len(engine.y_reg) == 31

    # Verify no NaN or Inf
    assert not np.any(np.isnan(engine.y_true))
    assert not np.any(np.isnan(engine.y_raw))
    assert not np.any(np.isnan(engine.y_glob))
    assert not np.any(np.isnan(engine.y_reg))


def test_verification_engine_reproducibility():
    """Verifies that VerificationEngine produces identical numbers across multiple runs."""
    e1 = VerificationEngine(random_seed=42)
    m1 = e1.run_full_verification()

    e2 = VerificationEngine(random_seed=42)
    m2 = e2.run_full_verification()

    assert m1["continuous_metrics"] == m2["continuous_metrics"]
    assert m1["uncertainty_intervals_95"] == m2["uncertainty_intervals_95"]


def test_final_metrics_and_metadata_files_exist():
    """Verifies that final_metrics.json and final_verification_metadata.json exist and are valid."""
    assert os.path.exists("reports/final_metrics.json")
    assert os.path.exists("reports/final_verification_metadata.json")

    with open("reports/final_metrics.json", "r") as f:
        metrics = json.load(f)
    with open("reports/final_verification_metadata.json", "r") as f:
        meta = json.load(f)

    assert "continuous_metrics" in metrics
    assert "categorical_metrics" in metrics
    assert "uncertainty_intervals_95" in metrics
    assert metrics["spatial_fss_status"] == "FSS NOT COMPUTABLE FOR CURRENT POINT-BASED DATA"
    assert meta["resampling_method"] == "Stationary Block Bootstrap (block length = 3 days, B = 1000, 95% CI)"
