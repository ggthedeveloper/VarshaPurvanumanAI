"""
Diagnostic Visualization Generator for Phase 7 Probability Models (SIH26080).
Generates publication-quality, unmanipulated diagnostic figures:
1. Reliability Diagram (Calibration Curve)
2. ROC Curves
3. Precision-Recall Curves
4. Probability Distribution Histograms
5. Observed vs Predicted Exceedance Probability Time Series
6. Decision Threshold Performance Curve (CSI/POD vs tau)
"""
import os
import json
import pickle
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import roc_curve, precision_recall_curve

from src.metrics.probabilistic import compute_calibration_curve
from src.probability.exceedance_model import VERIFIED_THRESHOLDS


def plot_all_diagnostics():
    os.makedirs("reports/figures", exist_ok=True)
    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")

    # Load data
    X_test = pd.read_csv("data/processed/X_test.csv")
    y_test = pd.read_csv("data/processed/y_test.csv")["observed_rainfall"].values
    trace = pd.read_csv("data/processed/probability_predictions_trace_test.csv")

    with open("models/probability/probability_suite.pkl", "rb") as f:
        suite = pickle.load(f)
    with open("models/probability_evaluation.json", "r") as f:
        eval_data = json.load(f)

    test_eval_g = eval_data["test_evaluation_tuned_tau"]["global_model"]
    test_eval_r = eval_data["test_evaluation_tuned_tau"]["regime_aware_model"]

    # -------------------------------------------------------------
    # 1. Reliability Diagram
    # -------------------------------------------------------------
    fig, axes = plt.subplots(1, 2, figsize=(12, 5), sharey=True)
    for idx, thr in enumerate([2.5, 15.6]):
        ax = axes[idx]
        y_bin = (y_test >= thr).astype(int)
        p_g = suite.global_models[thr].predict_proba(X_test)
        p_r = suite.regime_models[thr].predict_proba(X_test)

        cal_g = compute_calibration_curve(y_bin, p_g, n_bins=5)
        cal_r = compute_calibration_curve(y_bin, p_r, n_bins=5)

        ax.plot([0, 1], [0, 1], "k--", label="Perfect Reliability (y=x)", alpha=0.7)
        ax.plot(cal_g["prob_pred"], cal_g["prob_true"], "s-", color="#1f77b4", label=f"Global ML (ECE={test_eval_g[str(thr)]['expected_calibration_error']:.3f})")
        ax.plot(cal_r["prob_pred"], cal_r["prob_true"], "o-", color="#ff7f0e", label=f"Regime-Aware (ECE={test_eval_r[str(thr)]['expected_calibration_error']:.3f})")

        ax.set_title(f"Reliability Diagram: Threshold >= {thr} mm ({VERIFIED_THRESHOLDS[thr]['name']})", fontsize=11, fontweight="bold")
        ax.set_xlabel("Mean Forecast Probability", fontsize=10)
        if idx == 0:
            ax.set_ylabel("Observed Relative Frequency", fontsize=10)
        ax.set_xlim([-0.05, 1.05])
        ax.set_ylim([-0.05, 1.05])
        ax.legend(loc="upper left", fontsize=9)
        ax.grid(True, linestyle=":", alpha=0.6)

    plt.tight_layout()
    plt.savefig("reports/figures/reliability_diagram.png", dpi=300)
    plt.close()
    print("Saved reports/figures/reliability_diagram.png")

    # -------------------------------------------------------------
    # 2. ROC Curves
    # -------------------------------------------------------------
    fig, axes = plt.subplots(1, 3, figsize=(15, 4.5))
    eval_thresholds = [2.5, 7.5, 15.6]

    for idx, thr in enumerate(eval_thresholds):
        ax = axes[idx]
        y_bin = (y_test >= thr).astype(int)
        p_g = suite.global_models[thr].predict_proba(X_test)
        p_r = suite.regime_models[thr].predict_proba(X_test)

        fpr_g, tpr_g, _ = roc_curve(y_bin, p_g)
        fpr_r, tpr_r, _ = roc_curve(y_bin, p_r)

        auc_g = test_eval_g[str(thr)]["roc_auc"]
        auc_r = test_eval_r[str(thr)]["roc_auc"]
        auc_g_str = f"{auc_g:.3f}" if isinstance(auc_g, (int, float)) else str(auc_g)
        auc_r_str = f"{auc_r:.3f}" if isinstance(auc_r, (int, float)) else str(auc_r)

        ax.plot([0, 1], [0, 1], "k--", label="Random Chance (AUC=0.500)", alpha=0.6)
        ax.plot(fpr_g, tpr_g, color="#1f77b4", lw=2, label=f"Global ML (AUC={auc_g_str})")
        ax.plot(fpr_r, tpr_r, color="#ff7f0e", lw=2, label=f"Regime-Aware (AUC={auc_r_str})")

        ax.set_title(f"ROC Curve: >= {thr} mm ({VERIFIED_THRESHOLDS[thr]['name']})", fontsize=11, fontweight="bold")
        ax.set_xlabel("False Positive Rate", fontsize=10)
        ax.set_ylabel("True Positive Rate (POD)", fontsize=10)
        ax.set_xlim([-0.02, 1.02])
        ax.set_ylim([-0.02, 1.02])
        ax.legend(loc="lower right", fontsize=9)
        ax.grid(True, linestyle=":", alpha=0.6)

    plt.tight_layout()
    plt.savefig("reports/figures/roc_curves.png", dpi=300)
    plt.close()
    print("Saved reports/figures/roc_curves.png")

    # -------------------------------------------------------------
    # 3. Precision-Recall Curves
    # -------------------------------------------------------------
    fig, axes = plt.subplots(1, 3, figsize=(15, 4.5))

    for idx, thr in enumerate(eval_thresholds):
        ax = axes[idx]
        y_bin = (y_test >= thr).astype(int)
        p_g = suite.global_models[thr].predict_proba(X_test)
        p_r = suite.regime_models[thr].predict_proba(X_test)

        prec_g, rec_g, _ = precision_recall_curve(y_bin, p_g)
        prec_r, rec_r, _ = precision_recall_curve(y_bin, p_r)

        prauc_g = test_eval_g[str(thr)]["pr_auc"]
        prauc_r = test_eval_r[str(thr)]["pr_auc"]
        prauc_g_str = f"{prauc_g:.3f}" if isinstance(prauc_g, (int, float)) else str(prauc_g)
        prauc_r_str = f"{prauc_r:.3f}" if isinstance(prauc_r, (int, float)) else str(prauc_r)

        base_rate = np.mean(y_bin)
        ax.axhline(base_rate, color="gray", linestyle="--", label=f"Climatology ({base_rate:.2f})", alpha=0.7)
        ax.plot(rec_g, prec_g, color="#1f77b4", lw=2, label=f"Global ML (PR-AUC={prauc_g_str})")
        ax.plot(rec_r, prec_r, color="#ff7f0e", lw=2, label=f"Regime-Aware (PR-AUC={prauc_r_str})")

        ax.set_title(f"PR Curve: >= {thr} mm ({VERIFIED_THRESHOLDS[thr]['name']})", fontsize=11, fontweight="bold")
        ax.set_xlabel("Recall (POD)", fontsize=10)
        ax.set_ylabel("Precision (Success Ratio)", fontsize=10)
        ax.set_xlim([-0.02, 1.02])
        ax.set_ylim([-0.02, 1.02])
        ax.legend(loc="upper right", fontsize=9)
        ax.grid(True, linestyle=":", alpha=0.6)

    plt.tight_layout()
    plt.savefig("reports/figures/pr_curves.png", dpi=300)
    plt.close()
    print("Saved reports/figures/pr_curves.png")

    # -------------------------------------------------------------
    # 4. Probability Distribution Histograms
    # -------------------------------------------------------------
    fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))
    for idx, thr in enumerate([2.5, 15.6]):
        ax = axes[idx]
        y_bin = (y_test >= thr).astype(int)
        p_g = suite.global_models[thr].predict_proba(X_test)

        p_event = p_g[y_bin == 1]
        p_nonevent = p_g[y_bin == 0]

        bins = np.linspace(0.0, 1.0, 11)
        ax.hist(p_nonevent, bins=bins, alpha=0.6, color="#4682b4", label=f"Non-Event (< {thr}mm, N={len(p_nonevent)})", density=False)
        ax.hist(p_event, bins=bins, alpha=0.7, color="#d95f02", label=f"Event (>= {thr}mm, N={len(p_event)})", density=False)

        ax.set_title(f"Forecast Probability Distribution (Global ML: >= {thr} mm)", fontsize=11, fontweight="bold")
        ax.set_xlabel("Predicted Exceedance Probability", fontsize=10)
        ax.set_ylabel("Case Count", fontsize=10)
        ax.legend(loc="upper right", fontsize=9)
        ax.grid(True, linestyle=":", alpha=0.6)

    plt.tight_layout()
    plt.savefig("reports/figures/probability_distributions.png", dpi=300)
    plt.close()
    print("Saved reports/figures/probability_distributions.png")

    # -------------------------------------------------------------
    # 5. Observed vs Predicted Exceedance Probability Time Series
    # -------------------------------------------------------------
    fig, ax1 = plt.subplots(figsize=(13, 5))
    dates = pd.to_datetime(trace[trace["threshold"] == 2.5]["timestamp"].unique()[:31])
    p_25_glob = suite.global_models[2.5].predict_proba(X_test)
    p_156_glob = suite.global_models[15.6].predict_proba(X_test)

    ax1.plot(dates, p_25_glob, "o-", color="#2ca02c", lw=2, label="P(Rain >= 2.5 mm) [Global ML]")
    ax1.plot(dates, p_156_glob, "s-", color="#d62728", lw=2, label="P(Rain >= 15.6 mm) [Global ML]")
    ax1.axhline(0.3, color="#2ca02c", linestyle=":", alpha=0.5, label="Warning Cutoff tau=0.3 (>=2.5mm)")
    ax1.axhline(0.1, color="#d62728", linestyle=":", alpha=0.5, label="Warning Cutoff tau=0.1 (>=15.6mm)")
    ax1.set_ylabel("Exceedance Probability", fontsize=10, fontweight="bold")
    ax1.set_ylim([-0.05, 1.05])
    ax1.grid(True, linestyle=":", alpha=0.6)

    ax2 = ax1.twinx()
    ax2.bar(dates, y_test, width=0.4, color="#1f77b4", alpha=0.35, label="Observed Rainfall (mm/day)")
    ax2.set_ylabel("Observed Rainfall (mm)", fontsize=10, fontweight="bold", color="#1f77b4")
    ax2.set_ylim([0, 35])

    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc="upper left", fontsize=8.5, framealpha=0.9)
    plt.title("June 2024 Test Period: Observed Rainfall vs Calibrated Exceedance Probabilities", fontsize=11, fontweight="bold")
    plt.tight_layout()
    plt.savefig("reports/figures/observed_vs_predicted_prob.png", dpi=300)
    plt.close()
    print("Saved reports/figures/observed_vs_predicted_prob.png")

    # -------------------------------------------------------------
    # 6. Decision Threshold Performance Curve
    # -------------------------------------------------------------
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))
    taus = np.linspace(0.05, 0.95, 19)

    for idx, thr in enumerate([2.5, 15.6]):
        ax = axes[idx]
        y_bin = (y_test >= thr).astype(int)
        p_g = suite.global_models[thr].predict_proba(X_test)

        pods, fars, csis, f1s = [], [], [], []
        for tau in taus:
            pred_bin = (p_g >= tau).astype(int)
            h = int(np.sum((pred_bin == 1) & (y_bin == 1)))
            f = int(np.sum((pred_bin == 1) & (y_bin == 0)))
            m = int(np.sum((pred_bin == 0) & (y_bin == 1)))
            c = int(np.sum((pred_bin == 0) & (y_bin == 0)))

            pod_val = h / (h + m) if (h + m) > 0 else 0.0
            far_val = f / (h + f) if (h + f) > 0 else 0.0
            csi_val = h / (h + f + m) if (h + f + m) > 0 else 0.0
            prec_val = h / (h + f) if (h + f) > 0 else 0.0
            f1_val = (2 * prec_val * pod_val / (prec_val + pod_val)) if (prec_val + pod_val) > 0 else 0.0

            pods.append(pod_val)
            fars.append(far_val)
            csis.append(csi_val)
            f1s.append(f1_val)

        optimal_tau = suite.optimal_decision_thresholds_global.get(thr, 0.5)

        ax.plot(taus, pods, "g-", label="POD (Hit Rate)")
        ax.plot(taus, fars, "r-", label="FAR (False Alarm)")
        ax.plot(taus, csis, "b-", lw=2, label="CSI (Threat Score)")
        ax.plot(taus, f1s, "m--", label="F1 Score")
        ax.axvline(optimal_tau, color="black", linestyle="--", label=f"Validation-Tuned tau={optimal_tau}")

        ax.set_title(f"Threshold Sensitivity: >= {thr} mm ({VERIFIED_THRESHOLDS[thr]['name']})", fontsize=11, fontweight="bold")
        ax.set_xlabel("Probability Decision Threshold (tau)", fontsize=10)
        ax.set_ylabel("Metric Value", fontsize=10)
        ax.set_xlim([0.0, 1.0])
        ax.set_ylim([-0.05, 1.05])
        ax.legend(loc="center right", fontsize=8.5)
        ax.grid(True, linestyle=":", alpha=0.6)

    plt.tight_layout()
    plt.savefig("reports/figures/threshold_performance.png", dpi=300)
    plt.close()
    print("Saved reports/figures/threshold_performance.png")


if __name__ == "__main__":
    plot_all_diagnostics()
