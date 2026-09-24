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
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except RuntimeError as re:
        logger.error(f"Runtime error in forecast generation: {re}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(re))
    except Exception as e:
        logger.error(f"Unexpected error in forecast generation: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal operational forecast failure.")


from typing import Optional
from fastapi import Query
from src.ingestion.gfs.realtime_service import RealtimeGFSService

_realtime_service: Optional[RealtimeGFSService] = None


def get_realtime_service() -> RealtimeGFSService:
    global _realtime_service
    if _realtime_service is None:
        _realtime_service = RealtimeGFSService()
    return _realtime_service


@router.get("/forecast/retrieve", summary="Retrieve Operational GFS Forecast Run")
def retrieve_operational_forecast(
    latitude: float = Query(18.5204, ge=-90.0, le=90.0, description="Latitude in degrees"),
    longitude: float = Query(73.8567, ge=-180.0, le=180.0, description="Longitude in degrees"),
    date: Optional[str] = Query(None, description="Forecast target date (YYYY-MM-DD). Defaults to 2024-06-07."),
    cycle: str = Query("00Z", description="NWP initialization cycle: 00Z, 06Z, 12Z, 18Z"),
    lead_time_days: int = Query(1, ge=1, le=10, description="Forecast lead time in days")
):
    """
    Workflow for retrieving current or recent NOAA GFS forecasts:
    1. Checks local raw GFS cache
    2. Downloads and validates remote run if not cached
    3. Handles rate-limits/network interruptions with graceful cached fallbacks
    4. Computes regime-aware AI post-processed rainfall and probability suite
    """
    try:
        service = get_realtime_service()
        return service.retrieve_and_predict(
            latitude=latitude,
            longitude=longitude,
            date_str=date,
            cycle=cycle,
            lead_time_days=lead_time_days
        )
    except Exception as e:
        logger.error(f"Error in forecast retrieval workflow: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecast retrieval workflow failure: {str(e)}"
        )

