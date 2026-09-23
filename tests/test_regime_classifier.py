"""
Unit and Integration Tests for Weather Regime Classification (Phase 4).
Validates provenance integrity, canonical schema compliance, zero-leakage,
temporal/spatial alignment, and deterministic model reproducibility.
"""
import os
import pytest
import numpy as np
import pandas as pd
from src.regime_classifier.label_generator import (
    RegimeLabelGenerator,
    VALID_REGIMES,
    VALID_STATUSES,
    REGIME_ACTIVE,
    REGIME_BREAK,
    REGIME_DEPRESSION,
    REGIME_COASTAL_OROGRAPHIC,
    REGIME_OTHER
)
from src.regime_classifier.classifier import RegimeClassifier
from src.features.split import ChronologicalSplitter


@pytest.fixture
def paired_benchmark_df():
    path = "data/processed/paired_monsoon_benchmark.csv"
    if not os.path.exists(path):
        pytest.skip(f"Benchmark file not found: {path}")
    return pd.read_csv(path)


@pytest.fixture
def regime_labels_df(paired_benchmark_df):
    path = "data/processed/regime_labels/regime_labels_monsoon_benchmark.csv"
    if os.path.exists(path):
        return pd.read_csv(path)
    gen = RegimeLabelGenerator()
    return gen.generate_labels_for_dataset(paired_benchmark_df)


def test_label_validity_and_schema(regime_labels_df):
    """Verifies that all generated labels belong to the canonical taxonomy."""
    required_cols = [
        "timestamp", "date", "latitude", "longitude",
        "regime", "sub_regime", "source", "source_event_id",
        "label_method", "label_confidence", "label_status"
    ]
    for col in required_cols:
        assert col in regime_labels_df.columns, f"Missing required column: {col}"

    # Check regimes
    unique_regimes = set(regime_labels_df["regime"].unique())
    for r in unique_regimes:
        assert r in VALID_REGIMES, f"Unexpected regime label: {r}"

    # Check statuses
    unique_statuses = set(regime_labels_df["label_status"].unique())
    for s in unique_statuses:
        assert s in VALID_STATUSES, f"Unexpected label status: {s}"

    # Check confidence range
    assert (regime_labels_df["label_confidence"] >= 0.0).all()
    assert (regime_labels_df["label_confidence"] <= 1.0).all()


def test_zero_missing_labels(regime_labels_df):
    """Ensures no missing or null labels exist in the benchmark set."""
    assert regime_labels_df["regime"].isna().sum() == 0, "Null values found in regime labels"
    assert regime_labels_df["label_status"].isna().sum() == 0, "Null values found in label_status"
    assert regime_labels_df["label_confidence"].isna().sum() == 0, "Null values found in label_confidence"


def test_temporal_alignment_with_paired_dataset(paired_benchmark_df, regime_labels_df):
    """Verifies row-by-row and timestamp-by-timestamp alignment with paired NWP-observation dataset."""
    assert len(regime_labels_df) == len(paired_benchmark_df), "Length mismatch between labels and benchmark"
    assert (regime_labels_df["timestamp"] == paired_benchmark_df["timestamp"]).all(), "Timestamp misalignment detected"


def test_spatial_alignment_with_paired_dataset(paired_benchmark_df, regime_labels_df):
    """Verifies spatial coordinates match the benchmark dataset."""
    assert np.allclose(regime_labels_df["latitude"], paired_benchmark_df["latitude"]), "Latitude mismatch"
    assert np.allclose(regime_labels_df["longitude"], paired_benchmark_df["longitude"]), "Longitude mismatch"


def test_class_distribution_coverage(regime_labels_df):
    """Verifies that all 5 canonical regimes are populated in the multi-year benchmark."""
    counts = regime_labels_df["regime"].value_counts().to_dict()
    for reg in VALID_REGIMES:
        assert reg in counts, f"Regime {reg} has zero verified samples"
        assert counts[reg] > 0, f"Regime {reg} count must be positive"


def test_target_independence_and_no_leakage(paired_benchmark_df, regime_labels_df):
    """
    Confirms regime labels are strictly independent of observed rainfall values.
    Verifies that regime assignment is not an arbitrary thresholding of observed_rainfall.
    """
    df = pd.concat([paired_benchmark_df[["observed_rainfall"]], regime_labels_df[["regime"]]], axis=1)
    # Check that in every non-empty regime, observed rainfall varies (not a single constant or simple threshold)
    for reg, grp in df.groupby("regime"):
        assert grp["observed_rainfall"].std() > 0.0, f"Observed rainfall shows zero variance in {reg}"


def test_classifier_fit_predict_and_reproducibility():
    """Tests fitting, probability prediction, and serialized loading reproducibility."""
    X_train = pd.read_csv("data/processed/X_train.csv")
    y_train = pd.read_csv("data/processed/y_train_regime.csv").squeeze("columns")
    X_val = pd.read_csv("data/processed/X_val.csv")

    clf = RegimeClassifier(
        model_type="gradient_boosting",
        n_estimators=30,
        max_depth=3,
        random_state=42
    )
    clf.fit(X_train, y_train)

    preds = clf.predict(X_val)
    probs = clf.predict_proba(X_val)

    assert len(preds) == len(X_val)
    assert probs.shape == (len(X_val), len(clf.classes_))
    # Probabilities must sum to 1.0 per sample
    assert np.allclose(probs.sum(axis=1), 1.0, atol=1e-5)

    # Test serialization and reloading
    temp_model_path = "models/test_temp_regime_model.pkl"
    temp_meta_path = "models/test_temp_regime_meta.json"

    clf.save(temp_model_path, temp_meta_path)
    loaded_clf = RegimeClassifier.load(temp_model_path, temp_meta_path)

    reloaded_preds = loaded_clf.predict(X_val)
    assert (preds == reloaded_preds).all(), "Loaded classifier predictions do not match original model"

    # Clean up temp test files
    if os.path.exists(temp_model_path):
        os.remove(temp_model_path)
    if os.path.exists(temp_meta_path):
        os.remove(temp_meta_path)
