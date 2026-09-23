"""
Rainfall post-processing and exceedance probability route handlers for VarshaPurvanumanAI Backend.
"""
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.forecast import (
    RainfallPredictionRequest,
    RainfallPredictionResponse,
    ProbabilityPredictionResponse,
)
from backend.app.services.feature_service import FeatureService
from backend.app.services.prediction_service import PredictionService
from backend.app.utils.logger import logger

router = APIRouter(prefix="/api/rainfall", tags=["Rainfall Post-Processing"])


@router.post("/predict", response_model=RainfallPredictionResponse, summary="Correct Point NWP Rainfall via Regime-Aware ML")
def predict_rainfall(request: RainfallPredictionRequest):
    """
    Executes operational regime-aware bias-correction pipeline:
    NWP Inputs -> Validation -> Regime Classifier -> Predicted Regime -> Dedicated Sub-Model -> Physical Bounds [>=0].
    """
    try:
        df_features, raw_nwp_val = FeatureService.prepare_feature_dataframe(request)
        response = PredictionService.predict_rainfall(df_features, raw_nwp_val)
        return response
    except ValueError as ve:
        logger.warning(f"Validation error in rainfall prediction: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except RuntimeError as re:
        logger.error(f"Runtime error in rainfall prediction: {re}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(re))
    except Exception as e:
        logger.error(f"Unexpected error in rainfall prediction: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal rainfall prediction failure.")


@router.post("/probability", response_model=ProbabilityPredictionResponse, summary="Calibrated Multi-Threshold Probability of Exceedance")
def predict_probability(request: RainfallPredictionRequest):
    """
    Estimates calibrated probabilities P(Rainfall >= T) for all verified thresholds (2.5, 7.5, 15.6, 64.5, 115.6 mm).
    Clearly demarcates probabilities from official government weather alerts.
    """
    try:
        df_features, _ = FeatureService.prepare_feature_dataframe(request)
        response = PredictionService.predict_probability(df_features)
        return response
    except ValueError as ve:
        logger.warning(f"Validation error in probability estimation: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except RuntimeError as re:
        logger.error(f"Runtime error in probability estimation: {re}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(re))
    except Exception as e:
        logger.error(f"Unexpected error in probability estimation: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal probability estimation failure.")
