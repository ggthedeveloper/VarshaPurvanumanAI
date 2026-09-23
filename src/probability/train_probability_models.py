"""
Training and Evaluation Pipeline for Phase 7 Probability of Exceedance Models.
Trains calibrated Global and Regime-Aware models on Train set (JJAS 2021-2022),
tunes operational decision thresholds on Validation set (JJAS 2023),
evaluates on held-out Test set (June 2024), and exports models, metadata, evaluation JSON,
and prediction trace.
"""
import os
import json
import pickle
import numpy as np
import pandas as pd
from typing import Dict, Any

from src.probability.exceedance_model import (
    VERIFIED_THRESHOLDS,
    GlobalExceedanceModel,
    RegimeAwareExceedanceModel,
    ExceedanceModelSuite,
)
from src.metrics.probabilistic import (
    evaluate_probability_forecast,
    brier_score,
    brier_score_decomposition,
    brier_skill_score,
    roc_auc_metric,
    pr_auc_metric,
    compute_calibration_curve,
)


def run_probability_pipeline():
    print("============================================================")
    print("PHASE 7: CALIBRATED PROBABILITY OF EXCEEDANCE PIPELINE")
    print("============================================================")

    # 1. Load Data
    X_train = pd.read_csv("data/processed/X_train.csv")
    X_val = pd.read_csv("data/processed/X_val.csv")
    X_test = pd.read_csv("data/processed/X_test.csv")

    y_train = pd.read_csv("data/processed/y_train.csv")["observed_rainfall"].values
    y_val = pd.read_csv("data/processed/y_val.csv")["observed_rainfall"].values
    y_test = pd.read_csv("data/processed/y_test.csv")["observed_rainfall"].values

    reg_train = pd.read_csv("data/processed/regime_labels/train_labels.csv")["regime"].values
    reg_val = pd.read_csv("data/processed/regime_labels/val_labels.csv")["regime"].values
    reg_test = pd.read_csv("data/processed/regime_labels/test_labels.csv")["regime"].values

    pred_trace_prev = pd.read_csv("data/processed/predictions_trace_test.csv")

    # Load Phase 4 Regime Classifier
    with open("models/regime_classifier.pkl", "rb") as f:
        reg_clf = pickle.load(f)

    pred_reg_test = reg_clf.predict(X_test)
    proba_reg_test = reg_clf.predict_proba(X_test)
    reg_probs_test = np.max(proba_reg_test, axis=1)

    print(f"Train samples: {len(X_train)} (JJAS 2021-2022)")
    print(f"Validation samples: {len(X_val)} (JJAS 2023)")
    print(f"Test samples: {len(X_test)} (June 2024)")
    print(f"Features: {X_train.shape[1]}")

    # Threshold positive counts audit
    threshold_counts = {}
    for thr in sorted(VERIFIED_THRESHOLDS.keys()):
        tr_pos = int(np.sum(y_train >= thr))
        va_pos = int(np.sum(y_val >= thr))
        te_pos = int(np.sum(y_test >= thr))
        threshold_counts[thr] = {
            "name": VERIFIED_THRESHOLDS[thr]["name"],
            "category": VERIFIED_THRESHOLDS[thr]["category"],
            "train_pos": tr_pos,
            "train_rate": float(tr_pos / len(y_train)),
            "val_pos": va_pos,
            "val_rate": float(va_pos / len(y_val)),
            "test_pos": te_pos,
            "test_rate": float(te_pos / len(y_test)),
        }
        print(f"Threshold >= {thr:5.1f} mm ({VERIFIED_THRESHOLDS[thr]['name']:15s} - {VERIFIED_THRESHOLDS[thr]['category']}): Train={tr_pos:3d}, Val={va_pos:2d}, Test={te_pos:2d}")

    # 2. Instantiate and Fit Suite
    print("\n--- Training Global and Regime-Aware Exceedance Models ---")
    suite = ExceedanceModelSuite(classifier=reg_clf, routing_mode="hard", random_state=42)
    suite.fit(X_train, y_train, regime_labels=reg_train)

    # 3. Tune Operational Decision Thresholds on Validation Data strictly
    print("\n--- Tuning Operational Decision Thresholds on Validation Data ---")
    candidate_taus = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
    tuned_thresholds = suite.tune_decision_thresholds_on_validation(
        X_val=X_val,
        y_val=y_val,
        candidate_cutoffs=candidate_taus
    )
    print("Optimal validation decision thresholds (Global):", tuned_thresholds["global_optimal_thresholds"])
    print("Optimal validation decision thresholds (Regime):", tuned_thresholds["regime_optimal_thresholds"])

    # 4. Evaluate on Validation Set
    val_eval = suite.evaluate_suite(X_val, y_val, use_tuned_thresholds=True)

    # 5. Evaluate on Held-out Test Set
    test_eval = suite.evaluate_suite(
        X_test,
        y_test,
        predicted_regimes=pred_reg_test,
        use_tuned_thresholds=True
    )

    # Also compute default tau=0.5 test evaluation for fair comparison
    test_eval_tau05 = suite.evaluate_suite(
        X_test,
        y_test,
        predicted_regimes=pred_reg_test,
        use_tuned_thresholds=False
    )

    # 6. Regime-wise Test Evaluation
    print("\n--- Evaluating Regime-Wise Test Performance ---")
    regime_wise_test: Dict[str, Any] = {}
    classes = ["ACTIVE_MONSOON", "BREAK_MONSOON", "COASTAL_OROGRAPHIC", "DEPRESSION", "OTHER"]

    for r in classes:
        mask_r = (pred_reg_test == r)
        count_r = int(np.sum(mask_r))
        if count_r == 0:
            regime_wise_test[r] = {
                "sample_count": 0,
                "status": "NO TEST SAMPLES",
                "thresholds": {}
            }
        else:
            X_sub = X_test[mask_r]
            y_sub = y_test[mask_r]
            regime_wise_test[r] = {
                "sample_count": count_r,
                "status": "EVALUATED",
                "thresholds": {}
            }
            for thr in sorted(VERIFIED_THRESHOLDS.keys()):
                y_sub_bin = (y_sub >= thr).astype(int)
                p_glob_sub = suite.global_models[thr].predict_proba(X_sub)
                p_reg_sub = suite.regime_models[thr].predict_proba(X_sub, predicted_regimes=[r] * count_r)
                tau_glob = suite.optimal_decision_thresholds_global.get(thr, 0.5)
                tau_reg = suite.optimal_decision_thresholds_regime.get(thr, 0.5)

                eval_g = evaluate_probability_forecast(y_sub_bin, p_glob_sub, decision_threshold=tau_glob, threshold_mm=thr)
                eval_r = evaluate_probability_forecast(y_sub_bin, p_reg_sub, decision_threshold=tau_reg, threshold_mm=thr)

                regime_wise_test[r]["thresholds"][str(thr)] = {
                    "global": eval_g,
                    "regime_aware": eval_r,
                }

    # 7. Save Model Artifacts
    os.makedirs("models/probability", exist_ok=True)
    for thr, m in suite.global_models.items():
        with open(f"models/probability/global_exceedance_thr_{thr}.pkl", "wb") as f:
            pickle.dump(m, f)
    for thr, m in suite.regime_models.items():
        with open(f"models/probability/regime_exceedance_thr_{thr}.pkl", "wb") as f:
            pickle.dump(m, f)
    with open("models/probability/probability_suite.pkl", "wb") as f:
        pickle.dump(suite, f)

    # 8. Save Metadata
    metadata = {
        "model_name": "Calibrated Probability of Exceedance Post-Processor",
        "model_version": "v1.0.0-phase7",
        "random_seed": 42,
        "algorithm": "GradientBoostingClassifier with CalibratedClassifierCV",
        "hyperparameters": {
            "n_estimators": 60,
            "max_depth_standard": 3,
            "max_depth_rare": 2,
            "learning_rate": 0.05,
            "subsample": 0.8,
            "calibration_method": "sigmoid (Platt scaling)",
            "calibration_cv": 3,
        },
        "features": list(X_train.columns),
        "n_features": len(X_train.columns),
        "dataset_split": {
            "training_period": "JJAS 2021 - 2022",
            "training_samples": len(X_train),
            "validation_period": "JJAS 2023",
            "validation_samples": len(X_val),
            "test_period": "June 2024",
            "test_samples": len(X_test),
        },
        "threshold_definitions": VERIFIED_THRESHOLDS,
        "threshold_sample_counts": threshold_counts,
        "tuned_decision_thresholds": tuned_thresholds,
    }

    with open("models/probability_model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    # 9. Save Evaluation Results
    # Convert numpy types to native python for JSON serialization
    def convert_for_json(obj):
        if isinstance(obj, dict):
            return {str(k): convert_for_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_for_json(v) for v in obj]
        elif isinstance(obj, (np.integer, int)):
            return int(obj)
        elif isinstance(obj, (np.floating, float)):
            return float(obj)
        elif isinstance(obj, (np.bool_, bool)):
            return bool(obj)
        elif isinstance(obj, np.ndarray):
            return [convert_for_json(v) for v in obj.tolist()]
        else:
            return obj

    evaluation_data = {
        "validation_evaluation": convert_for_json(val_eval),
        "test_evaluation_tuned_tau": convert_for_json(test_eval),
        "test_evaluation_default_tau05": convert_for_json(test_eval_tau05),
        "regime_wise_test": convert_for_json(regime_wise_test),
        "spatial_fss_status": "FSS NOT COMPUTABLE FOR CURRENT POINT-BASED PROBABILITY DATA",
    }

    with open("models/probability_evaluation.json", "w") as f:
        json.dump(evaluation_data, f, indent=2)

    # 10. Generate Test Prediction Trace CSV
    print("\n--- Generating Probability Predictions Trace CSV ---")
    trace_rows = []
    # Test dates, lat, lon, lead_time from pred_trace_prev
    for i in range(len(X_test)):
        ts = pred_trace_prev.iloc[i]["timestamp"]
        lat = pred_trace_prev.iloc[i]["latitude"]
        lon = pred_trace_prev.iloc[i]["longitude"]
        lead = pred_trace_prev.iloc[i]["lead_time"]
        raw_nwp = pred_trace_prev.iloc[i]["raw_nwp_rainfall"]
        obs_rain = y_test[i]
        pred_reg = pred_reg_test[i]
        reg_prob = float(reg_probs_test[i])

        for thr in sorted(VERIFIED_THRESHOLDS.keys()):
            p_glob = float(suite.global_models[thr].predict_proba(X_test.iloc[[i]])[0])
            p_reg = float(suite.regime_models[thr].predict_proba(X_test.iloc[[i]], predicted_regimes=[pred_reg])[0])
            obs_exc = int(obs_rain >= thr)

            # Record Global row
            trace_rows.append({
                "timestamp": ts,
                "latitude": lat,
                "longitude": lon,
                "lead_time": lead,
                "raw_nwp_rainfall": raw_nwp,
                "predicted_regime": pred_reg,
                "regime_probability": reg_prob,
                "observed_rainfall": obs_rain,
                "threshold": thr,
                "exceedance_probability": p_glob,
                "observed_exceedance": obs_exc,
                "model_version": "v1.0.0-phase7-global",
            })

            # Record Regime-Aware row
            trace_rows.append({
                "timestamp": ts,
                "latitude": lat,
                "longitude": lon,
                "lead_time": lead,
                "raw_nwp_rainfall": raw_nwp,
                "predicted_regime": pred_reg,
                "regime_probability": reg_prob,
                "observed_rainfall": obs_rain,
                "threshold": thr,
                "exceedance_probability": p_reg,
                "observed_exceedance": obs_exc,
                "model_version": "v1.0.0-phase7-regime-aware",
            })

    trace_df = pd.DataFrame(trace_rows)
    trace_df.to_csv("data/processed/probability_predictions_trace_test.csv", index=False)
    print(f"Saved {len(trace_df)} trace rows to data/processed/probability_predictions_trace_test.csv")

    print("\n============================================================")
    print("PHASE 7 PIPELINE COMPLETED SUCCESSFULLY")
    print("============================================================")


if __name__ == "__main__":
    run_probability_pipeline()
