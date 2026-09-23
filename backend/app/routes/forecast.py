"""
Combined operational forecast route handler for VarshaPurvanumanAI Backend.
Primary endpoint consumed by the frontend and client applications.
"""
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.forecast import RainfallPredictionRequest, CombinedForecastResponse
from backend.app.services.feature_service import FeatureService
from backend.app.services.prediction_service import PredictionService
from backend.app.utils.logger import logger

router = APIRouter(prefix="/api", tags=["Operational Forecast"])


@router.post("/forecast", response_model=CombinedForecastResponse, summary="Consolidated Operational Forecast")
def generate_combined_forecast(request: RainfallPredictionRequest):
    """
    Unified operational inference endpoint combining:
    - Raw NWP Rainfall (Input)
    - Synoptic Weather Regime Classification (Phase 4)
    - Regime-Conditioned Point Rainfall Correction (Phase 6)
    - Multi-Threshold Calibrated Probability of Exceedance (Phase 7)
    - Architectural Metadata & Provenance Tracking
    """
    try:
        df_features, raw_nwp_val = FeatureService.prepare_feature_dataframe(request)
        response = PredictionService.predict_combined_forecast(df_features, raw_nwp_val)
        return response
    except ValueError as ve:
        logger.warning(f"Validation error in forecast generation: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except RuntimeError as re:
        logger.error(f"Runtime error in forecast generation: {re}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(re))
    except Exception as e:
        logger.error(f"Unexpected error in forecast generation: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal operational forecast failure.")
