"""
Visualization Generator for Phase 8 Verification Engine (SIH26080).
Creates reproducible, publication-quality diagnostic plots for deterministic,
probabilistic, categorical, and spatial verification.
"""
import os
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from src.probability.exceedance_model import VERIFIED_THRESHOLDS


def plot_all_verification_figures():
    os.makedirs("reports/figures", exist_ok=True)
    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")

    with open("reports/final_metrics.json", "r") as f:
        metrics = json.load(f)

    df_det = pd.read_csv("data/processed/predictions_trace_test.csv")
    y_true = df_det["observed_rainfall"].values
    y_raw = df_det["raw_nwp_rainfall"].values
    y_reg = df_det["corrected_rainfall"].values
    dates = pd.to_datetime(df_det["timestamp"])

    import pickle
    with open("models/global_postprocessor.pkl", "rb") as f:
        glob_model = pickle.load(f)
    X_test = pd.read_csv("data/processed/X_test.csv")
    y_glob = glob_model.predict(X_test)

    models = ["Raw NWP", "Global ML", "Regime-Aware ML"]
    colors = ["#4c72b0", "#55a868", "#c44e52"]

    # -------------------------------------------------------------
    # 1, 2, 3: Continuous Metrics (RMSE, MAE, Mean Bias) with 95% CI
    # -------------------------------------------------------------
    fig, axes = plt.subplots(1, 3, figsize=(15, 4.5))

    # RMSE
    ax = axes[0]
    rmses = [metrics["continuous_metrics"][m]["rmse"] for m in models]
    rmse_err_low = [rmses[i] - metrics["uncertainty_intervals_95"][models[i]]["rmse_ci"][0] for i in range(3)]
    rmse_err_high = [metrics["uncertainty_intervals_95"][models[i]]["rmse_ci"][1] - rmses[i] for i in range(3)]
    bars = ax.bar(models, rmses, yerr=[rmse_err_low, rmse_err_high], capsize=5, color=colors, alpha=0.85)
    ax.set_title("Root Mean Squared Error (RMSE)", fontsize=11, fontweight="bold")
    ax.set_ylabel("RMSE (mm/day)", fontsize=10)
    for bar in bars:
        yval = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2.0, yval / 2.0, f"{yval:.2f}", ha="center", va="center", color="white", fontweight="bold")

    # MAE
    ax = axes[1]
    maes = [metrics["continuous_metrics"][m]["mae"] for m in models]
    mae_err_low = [maes[i] - metrics["uncertainty_intervals_95"][models[i]]["mae_ci"][0] for i in range(3)]
    mae_err_high = [metrics["uncertainty_intervals_95"][models[i]]["mae_ci"][1] - maes[i] for i in range(3)]
    bars = ax.bar(models, maes, yerr=[mae_err_low, mae_err_high], capsize=5, color=colors, alpha=0.85)
    ax.set_title("Mean Absolute Error (MAE)", fontsize=11, fontweight="bold")
    ax.set_ylabel("MAE (mm/day)", fontsize=10)
    for bar in bars:
        yval = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2.0, yval / 2.0, f"{yval:.2f}", ha="center", va="center", color="white", fontweight="bold")

    # Mean Bias
    ax = axes[2]
    biases = [metrics["continuous_metrics"][m]["mean_bias"] for m in models]
    bias_err_low = [biases[i] - metrics["uncertainty_intervals_95"][models[i]]["bias_ci"][0] for i in range(3)]
    bias_err_high = [metrics["uncertainty_intervals_95"][models[i]]["bias_ci"][1] - biases[i] for i in range(3)]
    bars = ax.bar(models, biases, yerr=[bias_err_low, bias_err_high], capsize=5, color=colors, alpha=0.85)
    ax.axhline(0.0, color="black", linestyle="--", alpha=0.7)
    ax.set_title("Mean Forecast Bias", fontsize=11, fontweight="bold")
    ax.set_ylabel("Mean Bias (mm/day)", fontsize=10)
    for bar in bars:
        yval = bar.get_height()
        offset = 0.4 if yval >= 0 else -0.8
        ax.text(bar.get_x() + bar.get_width() / 2.0, yval + offset, f"{yval:+.2f}", ha="center", va="center", fontweight="bold")

    plt.tight_layout()
    plt.savefig("reports/figures/verification_continuous_comparison.png", dpi=300)
    plt.close()
    print("Saved reports/figures/verification_continuous_comparison.png")

    # -------------------------------------------------------------
    # 4, 5, 6, 7: Categorical Metrics vs Threshold (CSI, POD, FAR, ETS)
    # -------------------------------------------------------------
    eval_thresholds = [2.5, 7.5, 15.6]
    thr_labels = ["2.5 mm\n(Rainy Day)", "7.5 mm\n(Surge)", "15.6 mm\n(Moderate)"]

    fig, axes = plt.subplots(2, 2, figsize=(12, 9))

    # CSI
    ax = axes[0, 0]
    x = np.arange(len(eval_thresholds))
    width = 0.25
    for idx, m in enumerate(models):
        csi_vals = [metrics["categorical_metrics"][m][str(t)]["CSI"] for t in eval_thresholds]
        csi_clean = [v if isinstance(v, (int, float)) else 0.0 for v in csi_vals]
        ax.bar(x + idx * width, csi_clean, width, label=m, color=colors[idx], alpha=0.85)
    ax.set_xticks(x + width)
    ax.set_xticklabels(thr_labels)
    ax.set_title("Critical Success Index (CSI / Threat Score)", fontweight="bold")
    ax.set_ylabel("CSI", fontsize=10)
    ax.set_ylim([0, 0.6])
    ax.legend(loc="upper right")

    # POD
    ax = axes[0, 1]
    for idx, m in enumerate(models):
        pod_vals = [metrics["categorical_metrics"][m][str(t)]["POD"] for t in eval_thresholds]
        pod_clean = [v if isinstance(v, (int, float)) else 0.0 for v in pod_vals]
        ax.bar(x + idx * width, pod_clean, width, label=m, color=colors[idx], alpha=0.85)
    ax.set_xticks(x + width)
    ax.set_xticklabels(thr_labels)
    ax.set_title("Probability of Detection (POD / Hit Rate)", fontweight="bold")
    ax.set_ylabel("POD", fontsize=10)
    ax.set_ylim([0, 1.05])
    ax.legend(loc="upper right")

    # FAR
    ax = axes[1, 0]
    for idx, m in enumerate(models):
        far_vals = [metrics["categorical_metrics"][m][str(t)]["FAR"] for t in eval_thresholds]
        far_clean = [v if isinstance(v, (int, float)) else 0.0 for v in far_vals]
        ax.bar(x + idx * width, far_clean, width, label=m, color=colors[idx], alpha=0.85)
    ax.set_xticks(x + width)
    ax.set_xticklabels(thr_labels)
    ax.set_title("False Alarm Ratio (FAR)", fontweight="bold")
    ax.set_ylabel("FAR", fontsize=10)
    ax.set_ylim([0, 1.05])
    ax.legend(loc="upper right")

    # ETS
    ax = axes[1, 1]
    for idx, m in enumerate(models):
        ets_vals = [metrics["categorical_metrics"][m][str(t)]["ETS"] for t in eval_thresholds]
        ets_clean = [v if isinstance(v, (int, float)) else 0.0 for v in ets_vals]
        ax.bar(x + idx * width, ets_clean, width, label=m, color=colors[idx], alpha=0.85)
    ax.axhline(0.0, color="black", linestyle="--", alpha=0.5)
    ax.set_xticks(x + width)
    ax.set_xticklabels(thr_labels)
    ax.set_title("Equitable Threat Score (ETS / Gilbert Skill Score)", fontweight="bold")
    ax.set_ylabel("ETS", fontsize=10)
    ax.set_ylim([-0.2, 0.3])
    ax.legend(loc="upper right")

    plt.tight_layout()
    plt.savefig("reports/figures/verification_categorical_vs_threshold.png", dpi=300)
    plt.close()
    print("Saved reports/figures/verification_categorical_vs_threshold.png")

    # -------------------------------------------------------------
    # 8. Spatial Verification Schematic: Why FSS Requires 2D Spatial Grid
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.axis("off")
    ax.text(0.5, 0.90, "Spatial Verification Assessment: Fractions Skill Score (FSS)", ha="center", fontsize=13, fontweight="bold")
    ax.text(0.5, 0.78, "Roberts & Lean (2008) Spatial Neighborhood Requirement vs. Current Benchmark Dataset", ha="center", fontsize=10, style="italic")

    box_grid = dict(boxstyle="square,pad=0.6", facecolor="#e8f4f8", edgecolor="#2b7bba", lw=1.5)
    box_point = dict(boxstyle="square,pad=0.6", facecolor="#fde8e8", edgecolor="#ba2b2b", lw=1.5)

    ax.text(0.25, 0.45,
            "THEORETICAL REQUIREMENT FOR FSS\n\n"
            "• 2D Spatial Grid (NX x NY grid cells)\n"
            "• Simultaneous Spatial Field of Observations\n"
            "• Simultaneous Spatial Field of NWP Forecasts\n"
            "• Spatial Neighborhood Windows: 3x3, 5x5, 9x9...\n"
            "• Fractions: f_obs(x,y) vs f_fcst(x,y)\n\n"
            "STATUS: Mathematically Defined for 2D Grids",
            ha="center", va="center", bbox=box_grid, fontsize=9.5)

    ax.text(0.75, 0.45,
            "CURRENT SIH26080 BENCHMARK DATASET\n\n"
            "• Single District Centroid Station: 18.50°N, 73.80°E\n"
            "• Daily Time Series (1D Temporal Sequence)\n"
            "• Zero Surrounding Spatial Grid Columns\n"
            "• Spatial Neighborhood Radius = 0 km\n"
            "• 1D temporal surrogates are scientifically invalid\n\n"
            "VERDICT: FSS NOT COMPUTABLE FOR CURRENT DATA",
            ha="center", va="center", bbox=box_point, fontsize=9.5)

    ax.text(0.5, 0.10, "Scientific Principle: Never fabricate synthetic spatial fields to manufacture an FSS score.", ha="center", fontsize=10, fontweight="bold", color="#800000")

    plt.tight_layout()
    plt.savefig("reports/figures/verification_spatial_fss_schematic.png", dpi=300)
    plt.close()
    print("Saved reports/figures/verification_spatial_fss_schematic.png")

    # -------------------------------------------------------------
    # 9. Observed vs Predicted Daily Rainfall Time Series Trace
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(14, 5))
    ax.plot(dates, y_true, "k-o", lw=2, label="Observed Rainfall (IMD 0.25°)", zorder=4)
    ax.plot(dates, y_raw, "--", color="#4c72b0", lw=1.8, label=f"Raw NWP GFS (RMSE={metrics['continuous_metrics']['Raw NWP']['rmse']:.2f})", zorder=3)
    ax.plot(dates, y_glob, "-.", color="#55a868", lw=1.8, label=f"Global ML (RMSE={metrics['continuous_metrics']['Global ML']['rmse']:.2f})", zorder=3)
    ax.plot(dates, y_reg, "-", color="#c44e52", lw=2.0, label=f"Regime-Aware ML (RMSE={metrics['continuous_metrics']['Regime-Aware ML']['rmse']:.2f})", zorder=3)

    ax.axhline(2.5, color="gray", linestyle=":", alpha=0.6, label="Rainy Day (2.5 mm)")
    ax.axhline(15.6, color="orange", linestyle=":", alpha=0.6, label="Moderate Rain (15.6 mm)")

    ax.set_title("June 2024 Held-Out Test Period: Daily Rainfall Comparison (mm/day)", fontsize=12, fontweight="bold")
    ax.set_ylabel("Daily Cumulative Precipitation (mm)", fontsize=10)
    ax.set_xlabel("Forecast Date (June 2024)", fontsize=10)
    ax.legend(loc="upper right", fontsize=9, framealpha=0.9)
    ax.grid(True, linestyle=":", alpha=0.6)

    plt.tight_layout()
    plt.savefig("reports/figures/verification_observed_vs_predicted.png", dpi=300)
    plt.close()
    print("Saved reports/figures/verification_observed_vs_predicted.png")

    # -------------------------------------------------------------
    # 10. Contingency Confusion Matrices at 2.5 mm and 15.6 mm
    # -------------------------------------------------------------
    fig, axes = plt.subplots(2, 3, figsize=(12, 7))
    thr_tests = [2.5, 15.6]

    for row_idx, thr in enumerate(thr_tests):
        for col_idx, m in enumerate(models):
            ax = axes[row_idx, col_idx]
            t = metrics["categorical_metrics"][m][str(thr)]["contingency_table"]
            mat = np.array([[t["H"], t["F"]], [t["M"], t["C"]]])

            im = ax.imshow(mat, cmap="Blues", interpolation="nearest")
            ax.set_title(f"{m} (>= {thr} mm)", fontsize=10, fontweight="bold")
            ax.set_xticks([0, 1])
            ax.set_yticks([0, 1])
            ax.set_xticklabels(["Pred Event", "Pred Non-Event"], fontsize=8.5)
            ax.set_yticklabels(["Obs Event", "Obs Non-Event"], fontsize=8.5)

            for i in range(2):
                for j in range(2):
                    ax.text(j, i, str(mat[i, j]), ha="center", va="center", color="black" if mat[i, j] < 15 else "white", fontsize=12, fontweight="bold")

    plt.suptitle("Contingency Confusion Matrices across Models and Thresholds", fontsize=12, fontweight="bold")
    plt.tight_layout()
    plt.savefig("reports/figures/verification_confusion_matrices.png", dpi=300)
    plt.close()
    print("Saved reports/figures/verification_confusion_matrices.png")

    # -------------------------------------------------------------
    # 11. Error Distribution Boxplot
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(8, 4.5))
    err_data = [y_raw - y_true, y_glob - y_true, y_reg - y_true]
    box = ax.boxplot(err_data, tick_labels=models, patch_artist=True, showmeans=True)
    for patch, color in zip(box["boxes"], colors):
        patch.set_facecolor(color)
        patch.set_alpha(0.7)

    ax.axhline(0.0, color="black", linestyle="--", alpha=0.7)
    ax.set_title("Forecast Error Distribution (Prediction - Observed Rainfall)", fontsize=11, fontweight="bold")
    ax.set_ylabel("Error (mm/day)", fontsize=10)
    ax.grid(True, linestyle=":", alpha=0.6)

    plt.tight_layout()
    plt.savefig("reports/figures/verification_error_distributions.png", dpi=300)
    plt.close()
    print("Saved reports/figures/verification_error_distributions.png")


if __name__ == "__main__":
    plot_all_verification_figures()
