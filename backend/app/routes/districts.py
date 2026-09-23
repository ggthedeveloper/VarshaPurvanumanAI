"""
District catalog and forecast query route handlers for VarshaPurvanumanAI Backend.
"""
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.district import DistrictListResponse, DistrictForecastResponse
from backend.app.services.district_service import DistrictService

router = APIRouter(prefix="/api", tags=["Districts"])


@router.get("/districts", response_model=DistrictListResponse, summary="List Verified Indian Districts")
def list_districts():
    """
    Returns verified administrative districts from official registry.
    Transparently indicates active benchmark stations vs reference-only districts.
    """
    return DistrictService.get_all_districts()


@router.get("/district/{district_id}/forecast", response_model=DistrictForecastResponse, summary="Query District Forecast")
def get_district_forecast(district_id: str):
    """
    Returns real verified forecast for benchmark station districts.
    Returns clear data-unavailability notice for districts lacking active station instruments.
    NEVER returns fabricated weather data.
    """
    response = DistrictService.get_district_forecast(district_id)
    if response.coverage_status == "UNKNOWN_DISTRICT":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"District '{district_id}' is not recognized in the verified administrative registry."
        )
    return response


@router.get("/districts/geojson", summary="Verified District Boundary GeoJSON")
def get_district_geojson():
    """
    Returns authentic verified boundary GeoJSON from official repository artifacts.
    Never fabricates or approximates polygons.
    """
    import os
    import json
    from backend.app.config import settings

    if not os.path.exists(settings.DISTRICT_GEOJSON_PATH):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="District boundary data unavailable in repository."
        )
    with open(settings.DISTRICT_GEOJSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

