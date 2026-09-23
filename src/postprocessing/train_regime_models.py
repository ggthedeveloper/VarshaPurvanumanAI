"""
Training runner for Phase 6 Regime-Aware AI Post-Processing System.
Fits dedicated regime models on real training partitions and serializes artifacts.
"""
import os
import json
import pandas as pd
import numpy as np

from src.features.split import ChronologicalSplitter
from src.regime_classifier.classifier import RegimeClassifier
from src.postprocessing.regime_aware_postprocessor import RegimeAwarePostProcessor


def run_train_regime_models():
    print("=== TRAINING REGIME-AWARE POST-PROCESSING SYSTEM ===")

    # 1. Load splits and features
    df = pd.read_csv("data/processed/paired_monsoon_benchmark.csv")
    train_df, val_df, test_df = ChronologicalSplitter.split_by_dates(
        df, time_col="timestamp", train_end="2022-10-01", val_end="2023-10-01"
    )
    train_df = train_df.reset_index(drop=True)
    val_df = val_df.reset_index(drop=True)
    test_df = test_df.reset_index(drop=True)

    train_labels = pd.read_csv("data/processed/regime_labels/train_labels.csv")
    val_labels = pd.read_csv("data/processed/regime_labels/val_labels.csv")
    test_labels = pd.read_csv("data/processed/regime_labels/test_labels.csv")

    X_train = pd.read_csv("data/processed/X_train.csv")
    X_val = pd.read_csv("data/processed/X_val.csv")
    X_test = pd.read_csv("data/processed/X_test.csv")

    y_train = train_df["observed_rainfall"].values
    y_val = val_df["observed_rainfall"].values
    y_test = test_df["observed_rainfall"].values

    regimes_train = train_labels["regime"].values

    # 2. Load Phase 4 Regime Classifier
    print("Loading pre-trained Phase 4 Regime Classifier...")
    clf = RegimeClassifier.load(
        model_path="models/regime_classifier.pkl",
        metadata_path="models/regime_classifier_metadata.json"
    )

    # 3. Fit Regime-Aware Post-Processor
    postprocessor = RegimeAwarePostProcessor(
        classifier=clf,
        min_samples=15,
        model_family="random_forest",
        random_state=42,
        routing_mode="hard"
    )
    postprocessor.fit(X_train=X_train, y_train=y_train, regimes_train=regimes_train)

    # 4. Save Models and Metadata
    extra_meta = {
        "training_period": "2021-06-01 to 2022-09-30 (JJAS 2021 + JJAS 2022)",
        "validation_period": "2023-06-01 to 2023-09-30 (JJAS 2023)",
        "test_period": "2024-06-01 to 2024-06-30 (June 2024)",
        "training_sample_count": len(X_train),
        "validation_sample_count": len(X_val),
        "test_sample_count": len(X_test),
        "model_version": "v1.0.0-phase6",
    }
    postprocessor.save(
        models_dir="models/regime_postprocessors/",
        metadata_path="models/regime_postprocessor_metadata.json",
        extra_metadata=extra_meta
    )

    # 5. Generate and Save Prediction Trace Table for Test Set
    preds_test, trace_df = postprocessor.predict(X_test, routing="operational", return_trace=True)

    trace_df["timestamp"] = test_df["timestamp"]
    trace_df["latitude"] = test_df["latitude"]
    trace_df["longitude"] = test_df["longitude"]
    trace_df["lead_time"] = test_df["forecast_lead_time"]
    trace_df["raw_nwp_rainfall"] = test_df["nwp_rainfall"]
    trace_df["observed_rainfall"] = test_df["observed_rainfall"]
    trace_df["true_regime"] = test_labels["regime"]
    trace_df["model_version"] = "v1.0.0-phase6"

    # Reorder columns for audit compliance
    cols_order = [
        "timestamp", "latitude", "longitude", "lead_time",
        "raw_nwp_rainfall", "assigned_regime", "regime_probability",
        "selected_model", "corrected_rainfall", "observed_rainfall",
        "true_regime", "model_version"
    ]
    trace_df = trace_df.rename(columns={"assigned_regime": "predicted_regime"})
    cols_order = [c if c != "assigned_regime" else "predicted_regime" for c in cols_order]
    trace_df = trace_df[cols_order]

    trace_path = "data/processed/predictions_trace_test.csv"
    os.makedirs(os.path.dirname(trace_path), exist_ok=True)
    trace_df.to_csv(trace_path, index=False)
    print(f"Saved prediction audit trace table to {trace_path}")

    print("\nRegime-Aware Post-Processing Models successfully trained and serialized.")
    return postprocessor


if __name__ == "__main__":
    run_train_regime_models()
