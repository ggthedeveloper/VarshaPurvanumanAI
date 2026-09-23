"""
Model information route handler for VarshaPurvanumanAI Backend.
"""
from fastapi import APIRouter
from backend.app.config import settings
from backend.app.services.model_loader import registry
from src.probability.exceedance_model import VERIFIED_THRESHOLDS

router = APIRouter(prefix="/api", tags=["Models"])


@router.get("/models", summary="Authoritative Model Architecture Information")
def get_model_info():
    """
    Returns non-sensitive metadata for all scientific models deployed in the pipeline.
    """
    return {
        "regime_classifier": {
            "model_version": "v1.0.0-phase4",
            "algorithm": "GradientBoostingClassifier (n_estimators=100, max_depth=4)",
            "supported_classes": list(registry.regime_classifier.classes_) if registry.regime_classifier else [],
            "status": registry.status_dict["regime_classifier"],
        },
        "global_postprocessor": {
            "model_version": "v1.0.0-phase5",
            "algorithm": "RandomForestRegressor (n_estimators=100, max_depth=8)",
            "rmse_reduction_pct": 22.3,
            "status": registry.status_dict["global_postprocessor"],
        },
        "regime_aware_postprocessor": {
            "model_version": "v1.0.0-phase6",
            "architecture": "Hierarchical Regime Conditioning with Discrete Fallback",
            "dedicated_submodels": list(registry.regime_postprocessor.regime_models_.keys()) if registry.regime_postprocessor else [],
            "routing_mode": "hard (operational predicted regime routing)",
            "status": registry.status_dict["regime_postprocessor"],
        },
        "probability_suite": {
            "model_version": "v1.0.0-phase7",
            "calibration_method": "Platt Sigmoid Scaling (cv=3)",
            "supported_thresholds": list(VERIFIED_THRESHOLDS.keys()),
            "status": registry.status_dict["probability_suite"],
        },
        "verified_thresholds": VERIFIED_THRESHOLDS,
        "data_status": settings.DATA_STATUS,
    }
