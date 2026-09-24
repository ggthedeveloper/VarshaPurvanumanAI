"""
Verification Service for VarshaPurvanumanAI Backend.
Exposes authoritative, read-only scientific verification metrics from Phase 8.
Never recomputes or approximates official verification results.
"""
import os
import json
from typing import Dict, Any

from backend.app.config import settings
from backend.app.schemas.verification import (
    FSSStatusItem,
    VerificationSummaryResponse,
    VerificationThresholdsResponse,
    VerificationRegimesResponse,
    VerificationProbabilityResponse,
    GriddedVerificationResponse,
)


class VerificationService:
    """
    Read-only service for Phase 8 verified results.
    """

    @staticmethod
    def _load_metrics() -> Dict[str, Any]:
        if not os.path.exists(settings.FINAL_METRICS_PATH):
            raise FileNotFoundError(f"Verification metrics file missing at {settings.FINAL_METRICS_PATH}")
        with open(settings.FINAL_METRICS_PATH, "r") as f:
            return json.load(f)

    @classmethod
    def get_summary(cls) -> VerificationSummaryResponse:
        metrics = cls._load_metrics()
        return VerificationSummaryResponse(
            test_period=metrics.get("test_period", "June 1 - June 30, 2024"),
            test_sample_count=metrics.get("test_sample_count", 31),
            continuous_metrics=metrics.get("continuous_metrics", {}),
            categorical_metrics=metrics.get("categorical_metrics", {}),
            uncertainty_intervals_95=metrics.get("uncertainty_intervals_95", {}),
            fss=FSSStatusItem(
                metric="FSS",
                status="NOT_COMPUTABLE",
                reason="Current evaluation data is point-based and lacks the required 2-D spatial forecast/observation grid."
            ),
            scientific_conclusion=metrics.get("scientific_conclusion", "MIXED RESULTS"),
            data_status=settings.DATA_STATUS,
        )

    @classmethod
    def get_thresholds(cls) -> VerificationThresholdsResponse:
        metrics = cls._load_metrics()
        # Merge thresholds across models for clean consumption
        threshold_data = {}
        for m_name in ["Raw NWP", "Global ML", "Regime-Aware ML"]:
            m_cats = metrics.get("categorical_metrics", {}).get(m_name, {})
            for thr, info in m_cats.items():
                if thr not in threshold_data:
                    threshold_data[thr] = {}
                threshold_data[thr][m_name] = info

        return VerificationThresholdsResponse(
            thresholds=threshold_data,
            data_status=settings.DATA_STATUS,
        )

    @classmethod
    def get_regimes(cls) -> VerificationRegimesResponse:
        metrics = cls._load_metrics()
        return VerificationRegimesResponse(
            regimes=metrics.get("regime_wise_metrics", {}),
            data_status=settings.DATA_STATUS,
        )

    @classmethod
    def get_probability(cls) -> VerificationProbabilityResponse:
        metrics = cls._load_metrics()
        prob = metrics.get("probability_metrics", {})
        return VerificationProbabilityResponse(
            global_model=prob.get("global_probability_model", {}),
            regime_aware_model=prob.get("regime_aware_probability_model", {}),
            data_status=settings.DATA_STATUS,
        )

    @classmethod
    def get_gridded(cls) -> GriddedVerificationResponse:
        grid_metrics_path = "models/gridded_verification_evaluation.json"
        if not os.path.exists(grid_metrics_path):
            from src.verification.gridded_verification import GriddedVerificationRunner
            runner = GriddedVerificationRunner()
            runner.save_evaluation(grid_metrics_path)

        with open(grid_metrics_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return GriddedVerificationResponse(**data)

