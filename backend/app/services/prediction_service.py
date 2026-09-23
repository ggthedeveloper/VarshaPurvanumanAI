"""
Prediction Service for VarshaPurvanumanAI Backend.
Orchestrates inference across Phase 4 (Regime Classifier), Phase 5/6 (Post-Processors),
and Phase 7 (Calibrated Exceedance Models).
"""
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional
import pandas as pd
import numpy as np

from backend.app.config import settings
from backend.app.services.model_loader import registry
from backend.app.schemas.regime import RegimePredictionResponse
from backend.app.schemas.forecast import (
    RainfallPredictionResponse,
    ProbabilityThresholdItem,
    ProbabilityPredictionResponse,
    CombinedForecastResponse,
)
from src.probability.exceedance_model import VERIFIED_THRESHOLDS


class PredictionService:
    """
    Core inference service executing existing, authoritative model artifacts.
    """

    @staticmethod
    def predict_regime(df_features: pd.DataFrame) -> RegimePredictionResponse:
        """
        Executes Phase 4 Gradient Boosting Regime Classifier.
        """
        if registry.regime_classifier is None:
            raise RuntimeError("Regime classifier model is not loaded.")

        clf = registry.regime_classifier
        pred_regime = str(clf.predict(df_features)[0])
        probas = clf.predict_proba(df_features)[0]
        classes = list(clf.classes_)

        prob_dict = {classes[i]: float(probas[i]) for i in range(len(classes))}
        confidence = float(np.max(probas))

        return RegimePredictionResponse(
            predicted_regime=pred_regime,
            probabilities=prob_dict,
            confidence=confidence,
            model_version="v1.0.0-phase4",
            data_status=settings.DATA_STATUS,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    @staticmethod
    def predict_rainfall(df_features: pd.DataFrame, raw_nwp_val: float) -> RainfallPredictionResponse:
        """
        Executes operational post-processing pipeline:
        Features -> Phase 4 Classifier -> Predicted Regime -> Dedicated Regime Regressor -> Non-Negative Rainfall.
        """
        if registry.regime_postprocessor is None or registry.regime_classifier is None:
            raise RuntimeError("Post-processor or regime classifier is not loaded.")

        # 1. Operational synoptic regime prediction
        regime_res = PredictionService.predict_regime(df_features)
        pred_regime = regime_res.predicted_regime

        # 2. Operational regime routing
        postprocessor = registry.regime_postprocessor
        if postprocessor.classifier is None:
            postprocessor.classifier = registry.regime_classifier

        preds, trace_df = postprocessor.predict(
            df_features,
            routing="operational",
            return_trace=True
        )
        corrected_val = float(preds[0])

        # Enforce physical non-negative bound
        corrected_val = max(0.0, corrected_val)

        # Determine selected sub-model from trace
        if not trace_df.empty and "selected_model" in trace_df.columns:
            selected_model = str(trace_df["selected_model"].iloc[0])
        elif postprocessor.regime_models_.get(pred_regime) is not None:
            selected_model = f"dedicated_{pred_regime.lower()}"
        else:
            selected_model = "global_fallback"

        return RainfallPredictionResponse(
            raw_nwp_rainfall_mm=float(raw_nwp_val),
            predicted_regime=pred_regime,
            regime_probabilities=regime_res.probabilities,
            selected_model=selected_model,
            corrected_rainfall_mm=round(corrected_val, 2),
            model_version="v1.0.0-phase6",
            data_status=settings.DATA_STATUS,
            prediction_source="verified_model_artifacts",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    @staticmethod
    def predict_probability(df_features: pd.DataFrame, predicted_regime: Optional[str] = None) -> ProbabilityPredictionResponse:
        """
        Executes Phase 7 Calibrated Probability of Exceedance Suite across all verified thresholds.
        """
        if registry.probability_suite is None:
            raise RuntimeError("Probability suite model is not loaded.")

        suite = registry.probability_suite
        if predicted_regime is None and registry.regime_classifier is not None:
            predicted_regime = str(registry.regime_classifier.predict(df_features)[0])

        prob_items: List[ProbabilityThresholdItem] = []

        for thr in suite.thresholds:
            meta_thr = VERIFIED_THRESHOLDS.get(thr, {"name": f"Threshold {thr}mm", "category": "OPERATIONAL"})
            
            # Predict using Regime-Aware model where available, or Global fallback
            p_val = float(suite.regime_models[thr].predict_proba(
                df_features,
                predicted_regimes=[predicted_regime] if predicted_regime else None
            )[0])
            p_val = max(0.0, min(1.0, p_val))

            tau = suite.optimal_decision_thresholds_regime.get(thr, 0.5)
            advisory = "ELEVATED_RISK" if (p_val >= tau) else "NORMAL_ADVISORY"

            prob_items.append(ProbabilityThresholdItem(
                threshold_mm=float(thr),
                threshold_name=meta_thr["name"],
                category=meta_thr["category"],
                exceedance_probability=round(p_val, 4),
                decision_threshold_tau=tau,
                advisory_status=advisory,
            ))

        return ProbabilityPredictionResponse(
            probabilities=prob_items,
            disclaimer="MODEL EXCEEDANCE PROBABILITIES ARE SCIENTIFIC NUMERICAL ESTIMATES AND DO NOT CONSTITUTE OFFICIAL IMD WEATHER WARNINGS.",
            model_version="v1.0.0-phase7",
            data_status=settings.DATA_STATUS,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    @staticmethod
    def predict_combined_forecast(df_features: pd.DataFrame, raw_nwp_val: float) -> CombinedForecastResponse:
        """
        Generates full operational forecast combining deterministic and probabilistic layers.
        """
        rainfall_res = PredictionService.predict_rainfall(df_features, raw_nwp_val)
        prob_res = PredictionService.predict_probability(df_features, predicted_regime=rainfall_res.predicted_regime)

        model_meta = {
            "regime_classifier": "Phase 4 GradientBoostingClassifier (v1.0.0-phase4)",
            "deterministic_postprocessor": "Phase 6 RegimeAwarePostProcessor (v1.0.0-phase6)",
            "probability_engine": "Phase 7 Platt-Calibrated Suite (v1.0.0-phase7)",
            "selected_submodel": rainfall_res.selected_model,
        }

        return CombinedForecastResponse(
            raw_nwp_rainfall_mm=rainfall_res.raw_nwp_rainfall_mm,
            predicted_regime=rainfall_res.predicted_regime,
            regime_probabilities=rainfall_res.regime_probabilities,
            selected_model=rainfall_res.selected_model,
            corrected_rainfall_mm=rainfall_res.corrected_rainfall_mm,
            heavy_rainfall_probabilities=prob_res.probabilities,
            model_metadata=model_meta,
            data_status=settings.DATA_STATUS,
            prediction_source="verified_model_artifacts",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
