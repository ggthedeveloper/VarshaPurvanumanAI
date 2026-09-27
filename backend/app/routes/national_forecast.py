"""
National & Hierarchical Forecast REST Routes for VarshaPurvanumanAI (SIH26080).
Provides REST endpoints specified in Section 17 of the problem statement:
- GET /forecast/india
- GET /forecast/state/{state}
- GET /forecast/district/{district}
- GET /forecast/grid
- GET /forecast/{district}/probability
- GET /forecast/{district}/regime
- GET /data-status
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from backend.app.services.national_forecast_service import NationalForecastService
from src.data.data_manager import DataManager

router = APIRouter(tags=["National Forecast Products"])
api_router = APIRouter(prefix="/api", tags=["National Forecast Products"])


def _get_service() -> NationalForecastService:
    return NationalForecastService.get_instance()


# ---------------------------------------------------------------------------
# 1. India National Overview
# ---------------------------------------------------------------------------
@router.get("/forecast/india", summary="All-India Synoptic Overview & State Summaries")
@api_router.get("/forecast/india", summary="All-India Synoptic Overview & State Summaries")
def get_india_forecast(date: Optional[str] = Query(None, description="Forecast target date (YYYY-MM-DD)")):
    """Returns India-wide overview covering all 40 States and Union Territories."""
    return _get_service().get_india_overview(target_date=date)


# ---------------------------------------------------------------------------
# 2. State-Level Aggregate View
# ---------------------------------------------------------------------------
@router.get("/forecast/state/{state}", summary="State-Level District Rainfall Summaries")
@api_router.get("/forecast/state/{state}", summary="State-Level District Rainfall Summaries")
def get_state_forecast(
    state: str,
    date: Optional[str] = Query(None, description="Forecast target date (YYYY-MM-DD)")
):
    """Returns all constituent districts belonging to the requested State / UT."""
    res = _get_service().get_state_forecast(state, target_date=date)
    if res.get("data_status") == "STATE_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"State '{state}' was not found in the official administrative directory."
        )
    return res


# ---------------------------------------------------------------------------
# 3. Comprehensive District Product
# ---------------------------------------------------------------------------
@router.get("/forecast/district/{district}", summary="Granular District-Level Product")
@api_router.get("/forecast/district/{district}", summary="Granular District-Level Product")
def get_district_forecast(
    district: str,
    date: Optional[str] = Query(None, description="Forecast target date (YYYY-MM-DD)")
):
    """
    Returns complete district forecast with area-weighted spatial aggregation,
    P10/P50/P90 prediction intervals, climatological anomaly, and calibrated heavy rain probabilities.
    """
    res = _get_service().get_district_product(district, target_date=date)
    if res.get("data_status") == "UNKNOWN_DISTRICT":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"District '{district}' not recognized."
        )
    return res


# ---------------------------------------------------------------------------
# 4. Raw Grid-Level Product
# ---------------------------------------------------------------------------
@router.get("/forecast/grid", summary="Pre-Aggregation Grid-Level Forecast Field")
@api_router.get("/forecast/grid", summary="Pre-Aggregation Grid-Level Forecast Field")
def get_grid_product(date: Optional[str] = Query(None, description="Forecast target date (YYYY-MM-DD)")):
    """Returns raw 2D grid cells before polygon aggregation."""
    return _get_service().get_grid_product(target_date=date)


# ---------------------------------------------------------------------------
# 5. Dedicated District Exceedance Probabilities
# ---------------------------------------------------------------------------
@router.get("/forecast/{district}/probability", summary="Dedicated Exceedance Probabilities")
@api_router.get("/forecast/{district}/probability", summary="Dedicated Exceedance Probabilities")
def get_district_probability(
    district: str,
    date: Optional[str] = Query(None, description="Forecast target date (YYYY-MM-DD)")
):
    """Returns calibrated probabilities for operational thresholds (>=2.5, 7.5, 15.6, 64.5, 115.6 mm)."""
    p = _get_service().get_district_product(district, target_date=date)
    return {
        "district_id": district,
        "district_name": p.get("district_name"),
        "data_status": p.get("data_status"),
        "probabilities": p.get("probabilities", []),
        "warning_category": p.get("warning_category"),
        "confidence": p.get("confidence"),
    }


# ---------------------------------------------------------------------------
# 6. Dedicated District Regime Classification
# ---------------------------------------------------------------------------
@router.get("/forecast/{district}/regime", summary="Dedicated Regime Classification")
@api_router.get("/forecast/{district}/regime", summary="Dedicated Regime Classification")
def get_district_regime(
    district: str,
    date: Optional[str] = Query(None, description="Forecast target date (YYYY-MM-DD)")
):
    """Returns hierarchical weather regime identification and multi-label breakdown."""
    p = _get_service().get_district_product(district, target_date=date)
    return {
        "district_id": district,
        "district_name": p.get("district_name"),
        "predicted_regime": p.get("predicted_regime"),
        "macro_state": p.get("macro_state"),
        "disturbance_state": p.get("disturbance_state"),
        "topographic_state": p.get("topographic_state"),
        "active_flags": p.get("active_flags", []),
        "regime_probabilities": p.get("regime_probabilities", {}),
        "confidence": p.get("confidence"),
    }


# ---------------------------------------------------------------------------
# 7. National Data Availability Matrix
# ---------------------------------------------------------------------------
@router.get("/data-status", summary="National Data Status & Verification Matrix")
@api_router.get("/data-status", summary="National Data Status & Verification Matrix")
def get_data_status():
    """Returns authoritative disclosures on data availability, benchmark bounds, and provenance."""
    dm = DataManager()
    return dm.get_national_data_matrix()
