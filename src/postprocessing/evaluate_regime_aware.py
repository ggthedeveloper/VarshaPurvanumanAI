"""
Comprehensive Evaluation runner for Phase 6: Regime-Aware AI Post-Processing.
Compares Model A (Raw NWP), Model B (Global ML), and Model C (Regime-Aware ML).
Computes continuous, categorical (2.5mm, 15.6mm, 64.5mm), spatial (FSS), regime-stratified,
and bootstrap uncertainty metrics.
"""
import os
import json
import numpy as np
import pandas as pd

from src.features.split import ChronologicalSplitter
from src.metrics.evaluator import ForecastEvaluator
from src.metrics.continuous import rmse, mae, mean_bias
from src.postprocessing.global_postprocessor import GlobalPostProcessor
from src.postprocessing.regime_aware_postprocessor import RegimeAwarePostProcessor
from src.regime_classifier.classifier import RegimeClassifier


def compute_bootstrap_rmse_diff(y_true, pred_a, pred_b, n_bootstraps=1000, seed=42):
    """Computes bootstrap 95% confidence interval for RMSE difference (RMSE_B - RMSE_A)."""
    rng = np.random.RandomState(seed)
    N = len(y_true)
    diffs = []
    for _ in range(n_bootstraps):
        idx = rng.randint(0, N, size=N)
        r_a = np.sqrt(np.mean((pred_a[idx] - y_true[idx]) ** 2))
        r_b = np.sqrt(np.mean((pred_b[idx] - y_true[idx]) ** 2))
        diffs.append(r_b - r_a)
    diffs = np.array(diffs)
    ci_lower = float(np.percentile(diffs, 2.5))
    ci_upper = float(np.percentile(diffs, 97.5))
    return float(np.mean(diffs)), ci_lower, ci_upper


def run_comprehensive_evaluation():
    print("=== EXECUTING PHASE 6 COMPREHENSIVE THREE-MODEL EVALUATION ===")

    # 1. Load data
    df = pd.read_csv("data/processed/paired_monsoon_benchmark.csv")
    _, val_df, test_df = ChronologicalSplitter.split_by_dates(
        df, time_col="timestamp", train_end="2022-10-01", val_end="2023-10-01"
    )
    val_df = val_df.reset_index(drop=True)
    test_df = test_df.reset_index(drop=True)

    val_labels = pd.read_csv("data/processed/regime_labels/val_labels.csv")
    test_labels = pd.read_csv("data/processed/regime_labels/test_labels.csv")

    X_val = pd.read_csv("data/processed/X_val.csv")
    X_test = pd.read_csv("data/processed/X_test.csv")

    y_val = val_df["observed_rainfall"].values
    y_test = test_df["observed_rainfall"].values

    # 2. Predictions: Model A (Raw NWP)
    raw_val = val_df["nwp_rainfall"].values
    raw_test = test_df["nwp_rainfall"].values

    # 3. Predictions: Model B (Global ML)
    global_model = GlobalPostProcessor.load("models/global_postprocessor.pkl", "models/global_postprocessor_metadata.json")
    global_val = global_model.predict(X_val)
    global_test = global_model.predict(X_test)

    # 4. Predictions: Model C (Regime-Aware ML)
    clf = RegimeClassifier.load("models/regime_classifier.pkl", "models/regime_classifier_metadata.json")
    regime_model = RegimeAwarePostProcessor.load("models/regime_postprocessors/", "models/regime_postprocessor_metadata.json", classifier=clf)

    # Operational (using predicted regimes)
    reg_val_op = regime_model.predict(X_val, routing="operational")
    reg_test_op = regime_model.predict(X_test, routing="operational")

    # Oracle (using ground truth regimes)
    reg_val_orc = regime_model.predict(X_val, routing="oracle", true_regimes=val_labels["regime"])
    reg_test_orc = regime_model.predict(X_test, routing="oracle", true_regimes=test_labels["regime"])

    # 5. Full Evaluation Suites
    eval_a_test = ForecastEvaluator.evaluate(y_test, raw_test, regimes=test_labels["regime"])
    eval_b_test = ForecastEvaluator.evaluate(y_test, global_test, regimes=test_labels["regime"])
    eval_c_test_op = ForecastEvaluator.evaluate(y_test, reg_test_op, regimes=test_labels["regime"])
    eval_c_test_orc = ForecastEvaluator.evaluate(y_test, reg_test_orc, regimes=test_labels["regime"])

    eval_a_val = ForecastEvaluator.evaluate(y_val, raw_val, regimes=val_labels["regime"])
    eval_b_val = ForecastEvaluator.evaluate(y_val, global_val, regimes=val_labels["regime"])
    eval_c_val_op = ForecastEvaluator.evaluate(y_val, reg_val_op, regimes=val_labels["regime"])
    eval_c_val_orc = ForecastEvaluator.evaluate(y_val, reg_val_orc, regimes=val_labels["regime"])

    # 6. Bootstrap Statistical Uncertainty on Test Set
    diff_ml_raw, ci_l_ml_raw, ci_u_ml_raw = compute_bootstrap_rmse_diff(y_test, raw_test, global_test)
    diff_reg_raw, ci_l_reg_raw, ci_u_reg_raw = compute_bootstrap_rmse_diff(y_test, raw_test, reg_test_op)
    diff_reg_ml, ci_l_reg_ml, ci_u_reg_ml = compute_bootstrap_rmse_diff(y_test, global_test, reg_test_op)

    bootstrap_stats = {
        "test_rmse_diff_global_minus_raw": {
            "mean_diff": diff_ml_raw,
            "ci_95": [ci_l_ml_raw, ci_u_ml_raw]
        },
        "test_rmse_diff_regime_minus_raw": {
            "mean_diff": diff_reg_raw,
            "ci_95": [ci_l_reg_raw, ci_u_reg_raw]
        },
        "test_rmse_diff_regime_minus_global": {
            "mean_diff": diff_reg_ml,
            "ci_95": [ci_l_reg_ml, ci_u_reg_ml]
        }
    }

    # 7. Print Master Comparison Table (Held-Out Test Set)
    print("\n=========================================================================================")
    print("MASTER HELD-OUT TEST SET EVALUATION (June 2024, N = 31)")
    print("=========================================================================================")
    print(f"{'Model':30s} | {'RMSE (mm)':10s} | {'MAE (mm)':10s} | {'Bias (mm)':10s} | {'CSI (2.5)':10s} | {'POD (2.5)':10s} | {'FAR (2.5)':10s} | {'ETS (2.5)':10s} | {'FSS (2.5)':10s}")
    print("-" * 115)

    models_list = [
        ("Model A: Raw NWP", eval_a_test),
        ("Model B: Global ML", eval_b_test),
        ("Model C: Regime-Aware (Operational)", eval_c_test_op),
        ("Model C: Regime-Aware (Oracle True)", eval_c_test_orc)
    ]

    for name, ev in models_list:
        cont = ev["continuous"]
        c25 = ev["categorical"]["thresh_2.5mm"]
        far_str = f"{c25['FAR']:.4f}" if c25["FAR"] is not None else "N/A"
        ets_str = f"{c25['ETS']:.4f}" if c25["ETS"] is not None else "N/A"
        print(f"{name:30s} | {cont['rmse']:10.4f} | {cont['mae']:10.4f} | {cont['mean_bias']:+10.4f} | {c25['CSI']:10.4f} | {c25['POD']:10.4f} | {far_str:10s} | {ets_str:10s} | {c25['FSS']:10.4f}")

    # 8. Print Regime-Stratified Table (Validation Season JJAS 2023)
    print("\n=========================================================================================")
    print("REGIME-STRATIFIED RMSE (mm) ON VALIDATION SET (JJAS 2023, N = 122)")
    print("=========================================================================================")
    print(f"{'Regime':20s} | {'Sample Count':12s} | {'Raw NWP':12s} | {'Global ML':12s} | {'Regime Operational':18s} | {'Regime Oracle':14s}")
    print("-" * 100)

    for reg in sorted(list(eval_a_val["regime_breakdown"].keys())):
        n_cnt = eval_a_val["regime_breakdown"][reg]["sample_count"]
        r_a = eval_a_val["regime_breakdown"][reg]["rmse"]
        r_b = eval_b_val["regime_breakdown"][reg]["rmse"]
        r_c_op = eval_c_val_op["regime_breakdown"][reg]["rmse"]
        r_c_orc = eval_c_val_orc["regime_breakdown"][reg]["rmse"]
        print(f"{reg:20s} | {n_cnt:12d} | {r_a:12.4f} | {r_b:12.4f} | {r_c_op:18.4f} | {r_c_orc:14.4f}")

    # 9. Save Evaluation JSON Record
    eval_record = {
        "evaluation_scope": "Phase 6 Core Experiment (Three-Model Benchmark)",
        "test_period": "2024-06-01 to 2024-06-30 (June 2024)",
        "validation_period": "2023-06-01 to 2023-09-30 (JJAS 2023)",
        "sample_counts": {"test": len(y_test), "val": len(y_val)},
        "bootstrap_statistics": bootstrap_stats,
        "test_evaluation": {
            "model_a_raw_nwp": eval_a_test,
            "model_b_global_ml": eval_b_test,
            "model_c_regime_aware_operational": eval_c_test_op,
            "model_c_regime_aware_oracle": eval_c_test_orc
        },
        "validation_evaluation": {
            "model_a_raw_nwp": eval_a_val,
            "model_b_global_ml": eval_b_val,
            "model_c_regime_aware_operational": eval_c_val_op,
            "model_c_regime_aware_oracle": eval_c_val_orc
        }
    }

    out_json = "models/regime_postprocessor_evaluation.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(eval_record, f, indent=2)

    print(f"\nSaved complete evaluation record to {out_json}")
    return eval_record


if __name__ == "__main__":
    run_comprehensive_evaluation()
