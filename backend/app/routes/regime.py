"""
Regime prediction route handler for VarshaPurvanumanAI Backend.
"""
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.regime import RegimePredictionRequest, RegimePredictionResponse
from backend.app.services.feature_service import FeatureService
from backend.app.services.prediction_service import PredictionService
from backend.app.utils.logger import logger

router = APIRouter(prefix="/api/regime", tags=["Regime Classification"])


@router.post("/predict", response_model=RegimePredictionResponse, summary="Predict Synoptic Weather Regime")
def predict_regime(request: RegimePredictionRequest):
    """
    Executes Phase 4 Gradient Boosting Classifier using forecast-time atmospheric predictors.
    """
    try:
        # Prepare and validate feature vector
        from backend.app.schemas.forecast import RainfallPredictionRequest
        rain_req = RainfallPredictionRequest(**request.model_dump())
        df_features, _ = FeatureService.prepare_feature_dataframe(rain_req)

        # Run prediction
        response = PredictionService.predict_regime(df_features)
        return response
    except ValueError as ve:
        logger.warning(f"Validation error in regime prediction: {ve}")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except RuntimeError as re:
        logger.error(f"Runtime error in regime prediction: {re}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(re))
    except Exception as e:
        logger.error(f"Unexpected error in regime prediction: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal prediction failure.")
