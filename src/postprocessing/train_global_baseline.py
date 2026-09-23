"""
Training and Evaluation runner for Phase 5 Baselines.
Evaluates:
  Baseline A: Raw NWP Forecast
  Baseline B: Global ML Post-Processing (Random Forest Regressor)
Generates evaluation artifacts and baseline verification reports.
"""
import os
import json
import numpy as np
import pandas as pd

from src.features.split import ChronologicalSplitter
from src.metrics.evaluator import ForecastEvaluator
from src.postprocessing.global_postprocessor import GlobalPostProcessor


def run_phase_5_baseline():
    print("=== RUNNING PHASE 5: BASELINE EXPERIMENT ===")

    # 1. Load paired benchmark and splits
    df = pd.read_csv("data/processed/paired_monsoon_benchmark.csv")
    train_df, val_df, test_df = ChronologicalSplitter.split_by_dates(
        df, time_col="timestamp", train_end="2022-10-01", val_end="2023-10-01"
    )

    # Load regime labels for stratified analysis
    train_labels = pd.read_csv("data/processed/regime_labels/train_labels.csv")
    val_labels = pd.read_csv("data/processed/regime_labels/val_labels.csv")
    test_labels = pd.read_csv("data/processed/regime_labels/test_labels.csv")

    # Load feature matrices (NWP + spatio-temporal features, strictly zero regime labels)
    X_train = pd.read_csv("data/processed/X_train.csv")
    X_val = pd.read_csv("data/processed/X_val.csv")
    X_test = pd.read_csv("data/processed/X_test.csv")

    y_train = train_df["observed_rainfall"].values
    y_val = val_df["observed_rainfall"].values
    y_test = test_df["observed_rainfall"].values

    print(f"Train samples: {len(X_train)} (2021-06-01 to 2022-09-30)")
    print(f"Val samples:   {len(X_val)} (2023-06-01 to 2023-09-30)")
    print(f"Test samples:  {len(X_test)} (2024-06-01 to 2024-06-30)")

    # 2. Evaluate Baseline A: Raw NWP Forecast
    print("\n--- EVALUATING BASELINE A: RAW NWP FORECAST ---")
    raw_nwp_val = val_df["nwp_rainfall"].values
    raw_nwp_test = test_df["nwp_rainfall"].values

    raw_eval_val = ForecastEvaluator.evaluate(
        y_true=y_val, y_pred=raw_nwp_val, regimes=val_labels["regime"]
    )
    raw_eval_test = ForecastEvaluator.evaluate(
        y_true=y_test, y_pred=raw_nwp_test, regimes=test_labels["regime"]
    )

    # 3. Train Baseline B: Global ML Post-Processing
    print("\n--- TRAINING BASELINE B: GLOBAL ML POST-PROCESSING ---")
    global_model = GlobalPostProcessor(
        model_type="random_forest",
        n_estimators=100,
        max_depth=5,
        min_samples_leaf=3,
        random_state=42
    )
    global_model.fit(X_train, y_train)

    # 4. Evaluate Baseline B: Global ML Post-Processing
    print("\n--- EVALUATING BASELINE B: GLOBAL ML POST-PROCESSING ---")
    ml_eval_val = global_model.evaluate(X_val, y_val, regimes=val_labels["regime"])
    ml_eval_test = global_model.evaluate(X_test, y_test, regimes=test_labels["regime"])

    # 5. Print Comparison Summary
    print("\n=======================================================")
    print("VALIDATION SET COMPARISON (JJAS 2023, N=122)")
    print("=======================================================")
    print(f"Raw NWP  : RMSE={raw_eval_val['continuous']['rmse']:.4f} | MAE={raw_eval_val['continuous']['mae']:.4f} | Bias={raw_eval_val['continuous']['mean_bias']:+.4f} | Pearson_r={raw_eval_val['continuous']['pearson_r']:.4f}")
    print(f"Global ML: RMSE={ml_eval_val['continuous']['rmse']:.4f} | MAE={ml_eval_val['continuous']['mae']:.4f} | Bias={ml_eval_val['continuous']['mean_bias']:+.4f} | Pearson_r={ml_eval_val['continuous']['pearson_r']:.4f}")

    print("\n=======================================================")
    print("HELD-OUT TEST SET COMPARISON (June 2024, N=31)")
    print("=======================================================")
    print(f"Raw NWP  : RMSE={raw_eval_test['continuous']['rmse']:.4f} | MAE={raw_eval_test['continuous']['mae']:.4f} | Bias={raw_eval_test['continuous']['mean_bias']:+.4f} | Pearson_r={raw_eval_test['continuous']['pearson_r']:.4f}")
    print(f"Global ML: RMSE={ml_eval_test['continuous']['rmse']:.4f} | MAE={ml_eval_test['continuous']['mae']:.4f} | Bias={ml_eval_test['continuous']['mean_bias']:+.4f} | Pearson_r={ml_eval_test['continuous']['pearson_r']:.4f}")

    # 6. Save Model Artifacts
    extra_meta = {
        "target": "observed_rainfall",
        "units": "mm/day",
        "train_period": "2021-06-01 to 2022-09-30",
        "val_period": "2023-06-01 to 2023-09-30",
        "test_period": "2024-06-01 to 2024-06-30",
        "train_sample_count": len(X_train),
        "val_sample_count": len(X_val),
        "test_sample_count": len(X_test),
    }
    global_model.save(
        model_path="models/global_postprocessor.pkl",
        metadata_path="models/global_postprocessor_metadata.json",
        extra_metadata=extra_meta
    )

    # 7. Save Evaluation JSON
    evaluation_record = {
        "experiment": "Phase 5 Baseline Comparison",
        "train_period": "2021-06-01 to 2022-09-30 (JJAS 2021 + JJAS 2022)",
        "val_period": "2023-06-01 to 2023-09-30 (JJAS 2023)",
        "test_period": "2024-06-01 to 2024-06-30 (June 2024)",
        "sample_counts": {
            "train": len(X_train),
            "val": len(X_val),
            "test": len(X_test)
        },
        "baseline_a_raw_nwp": {
            "validation": raw_eval_val,
            "test": raw_eval_test
        },
        "baseline_b_global_ml": {
            "validation": ml_eval_val,
            "test": ml_eval_test
        }
    }
    with open("models/global_postprocessor_evaluation.json", "w", encoding="utf-8") as f:
        json.dump(evaluation_record, f, indent=2)

    print("\nSaved artifacts:")
    print("- models/global_postprocessor.pkl")
    print("- models/global_postprocessor_metadata.json")
    print("- models/global_postprocessor_evaluation.json")

    return evaluation_record


if __name__ == "__main__":
    run_phase_5_baseline()
